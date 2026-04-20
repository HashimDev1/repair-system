from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.deps import get_current_user, require_role
from app.models import User, Job, Payment
from app.schemas import PaymentOut

router = APIRouter(prefix="/payments", tags=["payments"])


def _payment_to_out(p: Payment) -> PaymentOut:
    return PaymentOut(
        id=p.id,
        job_id=p.job_id,
        method=p.method,
        status=p.status,
        amount=float(p.amount),
        paid_at=p.paid_at,
    )


@router.get("/jobs/{job_id}", response_model=PaymentOut)
def get_job_payment(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Customer (owner) or Vendor (assigned) can view payment details.
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

    payment = db.query(Payment).filter(Payment.job_id == job.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found (job may not be assigned yet).")

    return _payment_to_out(payment)


@router.post("/jobs/{job_id}/mark-paid", response_model=PaymentOut)
def mark_cod_paid(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    """
    Customer marks COD paid only after job is completed.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="You can mark paid only after job is completed.")

    payment = db.query(Payment).filter(Payment.job_id == job.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    if payment.status == "paid":
        return _payment_to_out(payment)

    payment.status = "paid"
    payment.paid_at = datetime.utcnow()

    db.commit()
    db.refresh(payment)
    return _payment_to_out(payment)


@router.get("/me/earnings")
def vendor_earnings(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    """
    Vendor earnings = sum of paid COD payments for jobs assigned to vendor.
    """
    total, count = (
        db.query(func.coalesce(func.sum(Payment.amount), 0), func.count(Payment.id))
        .join(Job, Job.id == Payment.job_id)
        .filter(Job.vendor_id == user.id)
        .filter(Payment.status == "paid")
        .first()
    )

    return {
        "vendor_id": user.id,
        "paid_jobs_count": int(count or 0),
        "total_paid_amount": float(total or 0),
        "currency": "PKR",
        "method": "COD",
    }
