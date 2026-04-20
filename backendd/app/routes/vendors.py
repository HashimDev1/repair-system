import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_role
from app.models import User, Vendor, VendorService
from app.schemas import VendorPublic, VendorUpdateIn, VendorServiceIn, VendorServiceOut

router = APIRouter(prefix="/vendors", tags=["vendors"])

UPLOAD_DIR = Path("app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _save_upload_image(file: UploadFile) -> str:
    """
    Saves an uploaded image to app/uploads and returns the public URL path (/uploads/filename).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image type. Allowed: jpg, jpeg, png, webp.",
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / unique_name

    # Write file
    with open(save_path, "wb") as f:
        content = file.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file upload.")
        f.write(content)

    return f"/uploads/{unique_name}"


def _get_vendor_or_404(db: Session, vendor_id: int) -> Vendor:
    vendor = db.query(Vendor).filter(Vendor.user_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found.")
    return vendor


@router.get("", response_model=list[VendorPublic])
def list_vendors(
    db: Session = Depends(get_db),
    service_type: Optional[str] = None,
    city_area: Optional[str] = None,
):
    """
    Public vendor list for customers to browse.
    Optionally filter by service_type or city_area.
    """
    q = db.query(Vendor, User).join(User, User.id == Vendor.user_id)

    if city_area:
        q = q.filter(Vendor.city_area.ilike(f"%{city_area.strip()}%"))

    vendors = q.all()
    result: list[VendorPublic] = []

    for vendor, user in vendors:
        # If service_type filter is requested, check vendor has that service
        if service_type:
            st = service_type.strip().lower()
            has_service = (
                db.query(VendorService)
                .filter(VendorService.vendor_id == vendor.user_id)
                .filter(VendorService.service_type.ilike(st))
                .first()
            )
            if not has_service:
                continue

        result.append(
            VendorPublic(
                user_id=vendor.user_id,
                name=user.name,
                phone=vendor.phone,
                city_area=vendor.city_area,
                profile_image_url=vendor.profile_image_url,
                shop_image_url=vendor.shop_image_url,
                avg_rating=float(vendor.avg_rating),
            )
        )

    return result


@router.get("/{vendor_id}", response_model=VendorPublic)
def get_vendor_public(vendor_id: int, db: Session = Depends(get_db)):
    """
    Public vendor profile details.
    """
    vendor = _get_vendor_or_404(db, vendor_id)
    user = db.query(User).filter(User.id == vendor.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Vendor user not found.")

    return VendorPublic(
        user_id=vendor.user_id,
        name=user.name,
        phone=vendor.phone,
        city_area=vendor.city_area,
        profile_image_url=vendor.profile_image_url,
        shop_image_url=vendor.shop_image_url,
        avg_rating=float(vendor.avg_rating),
    )


@router.put("/me", response_model=VendorPublic)
def update_my_vendor_profile(
    payload: VendorUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    """
    Vendor updates their own basic profile fields.
    """
    vendor = _get_vendor_or_404(db, user.id)

    if payload.phone is not None:
        vendor.phone = payload.phone
    if payload.city_area is not None:
        vendor.city_area = payload.city_area

    db.commit()
    db.refresh(vendor)

    return VendorPublic(
        user_id=vendor.user_id,
        name=user.name,
        phone=vendor.phone,
        city_area=vendor.city_area,
        profile_image_url=vendor.profile_image_url,
        shop_image_url=vendor.shop_image_url,
        avg_rating=float(vendor.avg_rating),
    )


@router.post("/me/upload/profile-image", response_model=VendorPublic)
def upload_profile_image(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
    file: UploadFile = File(...),
):
    """
    Vendor uploads profile image (logo/self).
    """
    vendor = _get_vendor_or_404(db, user.id)
    image_url = _save_upload_image(file)
    vendor.profile_image_url = image_url

    db.commit()
    db.refresh(vendor)

    return VendorPublic(
        user_id=vendor.user_id,
        name=user.name,
        phone=vendor.phone,
        city_area=vendor.city_area,
        profile_image_url=vendor.profile_image_url,
        shop_image_url=vendor.shop_image_url,
        avg_rating=float(vendor.avg_rating),
    )


@router.post("/me/upload/shop-image", response_model=VendorPublic)
def upload_shop_image(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
    file: UploadFile = File(...),
):
    """
    Vendor uploads shop image (store/front).
    """
    vendor = _get_vendor_or_404(db, user.id)
    image_url = _save_upload_image(file)
    vendor.shop_image_url = image_url

    db.commit()
    db.refresh(vendor)

    return VendorPublic(
        user_id=vendor.user_id,
        name=user.name,
        phone=vendor.phone,
        city_area=vendor.city_area,
        profile_image_url=vendor.profile_image_url,
        shop_image_url=vendor.shop_image_url,
        avg_rating=float(vendor.avg_rating),
    )


@router.get("/me/services", response_model=list[VendorServiceOut])
def list_my_services(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    services = (
        db.query(VendorService)
        .filter(VendorService.vendor_id == user.id)
        .order_by(VendorService.created_at.desc())
        .all()
    )

    return [
        VendorServiceOut(
            id=s.id,
            service_type=s.service_type,
            base_price=float(s.base_price) if s.base_price is not None else None,
            created_at=s.created_at,
        )
        for s in services
    ]


@router.post("/me/services", response_model=VendorServiceOut, status_code=201)
def add_my_service(
    payload: VendorServiceIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    # Normalize service type
    st = payload.service_type.strip()
    if not st:
        raise HTTPException(status_code=400, detail="service_type is required.")

    existing = (
        db.query(VendorService)
        .filter(VendorService.vendor_id == user.id)
        .filter(VendorService.service_type.ilike(st))
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Service already exists.")

    service = VendorService(
        vendor_id=user.id,
        service_type=st,
        base_price=payload.base_price,
    )
    db.add(service)
    db.commit()
    db.refresh(service)

    return VendorServiceOut(
        id=service.id,
        service_type=service.service_type,
        base_price=float(service.base_price) if service.base_price is not None else None,
        created_at=service.created_at,
    )


@router.delete("/me/services/{service_id}", status_code=204)
def delete_my_service(
    service_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("vendor")),
):
    service = (
        db.query(VendorService)
        .filter(VendorService.id == service_id)
        .filter(VendorService.vendor_id == user.id)
        .first()
    )
    if not service:
        raise HTTPException(status_code=404, detail="Service not found.")

    db.delete(service)
    db.commit()
    return None
