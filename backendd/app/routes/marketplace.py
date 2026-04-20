from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_role, get_current_user
from app.models import User, Job, JobImage
from app.schemas import JobOut, JobImageOut

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


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


@router.get("/jobs", response_model=list[JobOut])
def list_open_jobs(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
    service_type: Optional[str] = None,
):
    """
    Vendor marketplace: show only open jobs.
    Optional filter by service_type.
    """
    q = db.query(Job).filter(Job.status == "open").order_by(Job.created_at.desc())

    if service_type:
        q = q.filter(Job.service_type.ilike(f"%{service_type.strip()}%"))

    jobs = q.all()
    return [_job_to_out(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_open_job_details(
    job_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    """
    Vendor can view job details only if it's still open.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Job is not available in marketplace anymore.")
    return _job_to_out(job)
