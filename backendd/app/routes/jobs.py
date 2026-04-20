import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_role, get_current_user
from app.models import User, Customer, Vendor, Job, JobImage, JobStatusHistory
from app.schemas import (
    JobCreateIn,
    JobOut,
    JobImageOut,
    StatusHistoryOut,
    StatusUpdateIn,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])

UPLOAD_DIR = Path("app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

JOB_STATUSES = {
    "open",
    "assigned",
    "picked_up",
    "in_repair",
    "repaired",
    "ready_for_pickup",
    "completed",
    "cancelled",
}

# Strict vendor workflow transitions (professional rule)
ALLOWED_VENDOR_TRANSITIONS = {
    "assigned": {"picked_up"},
    "picked_up": {"in_repair"},
    "in_repair": {"repaired"},
    "repaired": {"ready_for_pickup"},
    "ready_for_pickup": {"completed"},
}


def _save_upload_image(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: jpg, jpeg, png, webp.")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file upload.")

    with open(save_path, "wb") as f:
        f.write(content)

    return f"/uploads/{unique_name}"


def _customer_or_404(db: Session, user_id: int) -> Customer:
    c = db.query(Customer).filter(Customer.user_id == user_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    return c


def _vendor_or_404(db: Session, user_id: int) -> Vendor:
    v = db.query(Vendor).filter(Vendor.user_id == user_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
    return v


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


@router.post("", response_model=JobOut, status_code=201)
def create_job(
    payload: JobCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    customer = _customer_or_404(db, user.id)

    job = Job(
        customer_id=customer.user_id,
        vendor_id=None,
        service_type=payload.service_type.strip(),
        description=payload.description.strip(),
        address=payload.address.strip(),
        preferred_time=payload.preferred_time.strip() if payload.preferred_time else None,
        customer_budget=payload.customer_budget,
        final_cost=None,
        status="open",
    )
    db.add(job)
    db.flush()  # get job.id

    db.add(
        JobStatusHistory(
            job_id=job.id,
            status="open",
            note="Job posted by customer",
            changed_by_role="customer",
            changed_by_id=user.id,
        )
    )

    db.commit()
    db.refresh(job)
    return _job_to_out(job)


@router.post("/{job_id}/images", response_model=list[JobImageOut], status_code=201)
def upload_job_images(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
    files: list[UploadFile] = File(...),
):
    """
    Customer uploads multiple device images for a job they own.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="You can only add images while job is open.")

    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    created: list[JobImage] = []
    for f in files:
        url = _save_upload_image(f)
        img = JobImage(job_id=job.id, image_url=url)
        db.add(img)
        created.append(img)

    db.commit()

    outs: list[JobImageOut] = []
    for img in created:
        db.refresh(img)
        outs.append(JobImageOut(id=img.id, image_url=img.image_url, uploaded_at=img.uploaded_at))

    return outs


@router.get("/me", response_model=list[JobOut])
def list_my_jobs(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    status_filter: Optional[str] = None,
):
    """
    Customer: list jobs they created.
    Vendor: list jobs assigned to them.
    """
    if user.role == "customer":
        q = db.query(Job).filter(Job.customer_id == user.id)
    elif user.role == "vendor":
        q = db.query(Job).filter(Job.vendor_id == user.id)
    else:
        raise HTTPException(status_code=403, detail="Not allowed.")

    if status_filter:
        sf = status_filter.strip()
        if sf not in JOB_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status_filter.")
        q = q.filter(Job.status == sf)

    jobs = q.order_by(Job.created_at.desc()).all()
    return [_job_to_out(j) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
def get_job_details(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Customer can view their job.
    Vendor can view assigned job.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if user.role == "customer" and job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if user.role == "vendor" and job.vendor_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if user.role not in ("customer", "vendor"):
        raise HTTPException(status_code=403, detail="Not allowed.")

    return _job_to_out(job)


@router.get("/{job_id}/timeline", response_model=list[StatusHistoryOut])
def get_job_timeline(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if user.role == "customer" and job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if user.role == "vendor" and job.vendor_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if user.role not in ("customer", "vendor"):
        raise HTTPException(status_code=403, detail="Not allowed.")

    items = (
        db.query(JobStatusHistory)
        .filter(JobStatusHistory.job_id == job_id)
        .order_by(JobStatusHistory.changed_at.asc())
        .all()
    )

    return [
        StatusHistoryOut(
            id=i.id,
            status=i.status,
            note=i.note,
            changed_by_role=i.changed_by_role,
            changed_by_id=i.changed_by_id,
            changed_at=i.changed_at,
        )
        for i in items
    ]


@router.post("/{job_id}/cancel", response_model=JobOut)
def cancel_job(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    """
    Customer can cancel only if job is still open.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")

    if job.status != "open":
        raise HTTPException(status_code=400, detail="You can only cancel while job is open.")

    job.status = "cancelled"
    db.add(
        JobStatusHistory(
            job_id=job.id,
            status="cancelled",
            note="Cancelled by customer",
            changed_by_role="customer",
            changed_by_id=user.id,
        )
    )
    db.commit()
    db.refresh(job)
    return _job_to_out(job)


@router.post("/{job_id}/status", response_model=JobOut)
def vendor_update_job_status(
    job_id: int,
    payload: StatusUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    """
    Vendor updates status for an assigned job, in a strict order.
    Writes to job_status_history.
    """
    _vendor_or_404(db, user.id)

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .with_for_update()
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.vendor_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed. Job not assigned to you.")

    new_status = payload.new_status.strip()
    if new_status not in JOB_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid new_status.")

    current = job.status
    if current not in ALLOWED_VENDOR_TRANSITIONS:
        raise HTTPException(status_code=400, detail=f"Status cannot be updated from '{current}' by vendor.")

    allowed_next = ALLOWED_VENDOR_TRANSITIONS[current]
    if new_status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: {current} -> {new_status}. Allowed: {sorted(list(allowed_next))}",
        )

    job.status = new_status

    db.add(
        JobStatusHistory(
            job_id=job.id,
            status=new_status,
            note=payload.note.strip() if payload.note else None,
            changed_by_role="vendor",
            changed_by_id=user.id,
        )
    )

    db.commit()
    db.refresh(job)
    return _job_to_out(job)
