from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_role
from app.models import (
    User,
    Vendor,
    Customer,
    Job,
    JobApplication,
    JobStatusHistory,
    Payment,
)
from app.schemas import (
    ApplicationCreateIn,
    ApplicationOut,
    SelectVendorIn,
    JobOut,
    JobImageOut,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def _job_to_out(job: Job) -> JobOut:
    return JobOut(
        id=job.id,
        customer_id=job.customer_id,
        vendor_id=job.vendor_id,
        service_type=job.service_type,
        description=job.description,
        address=job.address,
        preferred_time=job.preferred_time,
        customer_budget=float(job.customer_budget),
        final_cost=float(job.final_cost) if job.final_cost is not None else None,
        status=job.status,
        created_at=job.created_at,
        images=[
            JobImageOut(id=img.id, image_url=img.image_url, uploaded_at=img.uploaded_at)
            for img in (job.images or [])
        ],
    )


def _vendor_or_404(db: Session, user_id: int) -> Vendor:
    v = db.query(Vendor).filter(Vendor.user_id == user_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
    return v


def _customer_or_404(db: Session, user_id: int) -> Customer:
    c = db.query(Customer).filter(Customer.user_id == user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    return c


@router.post("/jobs/{job_id}", response_model=ApplicationOut, status_code=201)
def apply_to_job(
    job_id: int,
    payload: ApplicationCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    """
    Vendor applies to an open job with an offer price <= customer_budget.
    """
    vendor = _vendor_or_404(db, user.id)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Job is not open for applications.")

    if float(payload.proposed_cost) > float(job.customer_budget):
        raise HTTPException(status_code=400, detail="Offer must be <= customer budget.")

    existing = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job_id)
        .filter(JobApplication.vendor_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already applied to this job.")

    app = JobApplication(
        job_id=job_id,
        vendor_id=user.id,
        proposed_cost=payload.proposed_cost,
        message=payload.message.strip() if payload.message else None,
        status="pending",
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return ApplicationOut(
        id=app.id,
        job_id=app.job_id,
        vendor_id=app.vendor_id,
        vendor_name=user.name,
        vendor_profile_image_url=vendor.profile_image_url,
        vendor_shop_image_url=vendor.shop_image_url,
        vendor_avg_rating=float(vendor.avg_rating),
        proposed_cost=float(app.proposed_cost),
        message=app.message,
        status=app.status,
        created_at=app.created_at,
    )


@router.get("/jobs/{job_id}", response_model=list[ApplicationOut])
def list_applicants_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    """
    Customer views applicants for their own open job.
    """
    _customer_or_404(db, user.id)

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Applicants can be viewed only while job is open.")

    apps = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job_id)
        .order_by(JobApplication.created_at.desc())
        .all()
    )

    result: list[ApplicationOut] = []
    for a in apps:
        vendor = db.query(Vendor).filter(Vendor.user_id == a.vendor_id).first()
        vendor_user = db.query(User).filter(User.id == a.vendor_id).first()
        if not vendor or not vendor_user:
            continue

        result.append(
            ApplicationOut(
                id=a.id,
                job_id=a.job_id,
                vendor_id=a.vendor_id,
                vendor_name=vendor_user.name,
                vendor_profile_image_url=vendor.profile_image_url,
                vendor_shop_image_url=vendor.shop_image_url,
                vendor_avg_rating=float(vendor.avg_rating),
                proposed_cost=float(a.proposed_cost),
                message=a.message,
                status=a.status,
                created_at=a.created_at,
            )
        )

    return result


@router.post("/jobs/{job_id}/select", response_model=JobOut)
def select_vendor_for_job(
    job_id: int,
    payload: SelectVendorIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    """
    Customer selects one vendor application.
    This assigns the job, locks the final_cost, rejects other applications,
    creates COD payment record, and writes status history.
    """
    _customer_or_404(db, user.id)

    # Lock job row to avoid race conditions
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .with_for_update()
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Job is not open anymore.")

    chosen = (
        db.query(JobApplication)
        .filter(JobApplication.id == payload.application_id)
        .filter(JobApplication.job_id == job_id)
        .with_for_update()
        .first()
    )
    if not chosen:
        raise HTTPException(status_code=404, detail="Application not found for this job.")
    if chosen.status != "pending":
        raise HTTPException(status_code=400, detail="This application is not pending.")

    # Assign job
    job.vendor_id = chosen.vendor_id
    job.final_cost = chosen.proposed_cost
    job.status = "assigned"

    # Update application statuses
    all_apps = (
        db.query(JobApplication)
        .filter(JobApplication.job_id == job_id)
        .with_for_update()
        .all()
    )

    for a in all_apps:
        if a.id == chosen.id:
            a.status = "selected"
        else:
            if a.status == "pending":
                a.status = "rejected"

    # Create payment record (COD unpaid)
    existing_payment = db.query(Payment).filter(Payment.job_id == job.id).first()
    if existing_payment:
        # Should not happen in this flow, but safe guard
        existing_payment.amount = job.final_cost
        existing_payment.status = "unpaid"
        existing_payment.method = "COD"
    else:
        payment = Payment(
            job_id=job.id,
            method="COD",
            status="unpaid",
            amount=job.final_cost,
        )
        db.add(payment)

    # Status history
    db.add(
        JobStatusHistory(
            job_id=job.id,
            status="assigned",
            note="Customer selected a vendor",
            changed_by_role="customer",
            changed_by_id=user.id,
        )
    )

    db.commit()
    db.refresh(job)
    return _job_to_out(job)
