from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.deps import get_current_user, require_role
from app.models import User, Job, Payment, Rating, Vendor
from app.schemas import RatingCreateIn, RatingOut, VendorReviewOut

router = APIRouter(prefix="/ratings", tags=["ratings"])


def _rating_to_out(r: Rating) -> RatingOut:
    return RatingOut(
        id=r.id,
        job_id=r.job_id,
        vendor_id=r.vendor_id,
        customer_id=r.customer_id,
        stars=r.stars,
        review_text=r.review_text,
        created_at=r.created_at,
    )


def _recompute_vendor_avg(db: Session, vendor_id: int) -> None:
    avg, count = (
        db.query(func.coalesce(func.avg(Rating.stars), 0), func.count(Rating.id))
        .filter(Rating.vendor_id == vendor_id)
        .first()
    )
    vendor = db.query(Vendor).filter(Vendor.user_id == vendor_id).first()
    if vendor:
        vendor.avg_rating = float(avg or 0)
        db.commit()


@router.post("/jobs/{job_id}", response_model=RatingOut, status_code=201)
def create_rating_for_job(
    job_id: int,
    payload: RatingCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("customer")),
):
    """
    Customer can rate only after:
      - job is completed
      - payment is paid
      - rating not already submitted
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed.")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="You can rate only after job is completed.")
    if not job.vendor_id:
        raise HTTPException(status_code=400, detail="Job has no vendor assigned.")

    payment = db.query(Payment).filter(Payment.job_id == job.id).first()
    if not payment or payment.status != "paid":
        raise HTTPException(status_code=400, detail="You can rate only after COD is marked paid.")

    existing = db.query(Rating).filter(Rating.job_id == job.id).first()
    if existing:
        return _rating_to_out(existing)

    rating = Rating(
        job_id=job.id,
        vendor_id=job.vendor_id,
        customer_id=user.id,
        stars=payload.stars,
        review_text=payload.review_text.strip() if payload.review_text else None,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)

    _recompute_vendor_avg(db, job.vendor_id)

    return _rating_to_out(rating)


@router.get("/vendors/{vendor_id}", response_model=list[VendorReviewOut])
def list_vendor_reviews(
    vendor_id: int,
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """
    Public vendor reviews list for trust (customer browsing).
    """
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100.")

    # join users to get customer names
    rows = (
        db.query(Rating, User)
        .join(User, User.id == Rating.customer_id)
        .filter(Rating.vendor_id == vendor_id)
        .order_by(Rating.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        VendorReviewOut(
            rating_id=r.id,
            job_id=r.job_id,
            stars=r.stars,
            review_text=r.review_text,
            created_at=r.created_at,
            customer_name=u.name,
        )
        for r, u in rows
    ]


@router.get("/me", response_model=list[VendorReviewOut])
def vendor_my_reviews(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
    limit: int = 20,
):
    """
    Vendor can view their own reviews.
    """
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100.")

    rows = (
        db.query(Rating, User)
        .join(User, User.id == Rating.customer_id)
        .filter(Rating.vendor_id == user.id)
        .order_by(Rating.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        VendorReviewOut(
            rating_id=r.id,
            job_id=r.job_id,
            stars=r.stars,
            review_text=r.review_text,
            created_at=r.created_at,
            customer_name=u.name,
        )
        for r, u in rows
    ]
