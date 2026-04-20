from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, Customer, Vendor
from app.schemas import RegisterCustomerIn, RegisterVendorIn, LoginIn, TokenOut
from app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/customer", response_model=TokenOut)
def register_customer(payload: RegisterCustomerIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role="customer",
    )
    db.add(user)
    db.flush()

    customer = Customer(user_id=user.id, phone=payload.phone, address=payload.address)
    db.add(customer)
    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": user.id, "role": user.role})
    return TokenOut(access_token=token, role=user.role, user_id=user.id, name=user.name)


@router.post("/register/vendor", response_model=TokenOut)
def register_vendor(payload: RegisterVendorIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role="vendor",
    )
    db.add(user)
    db.flush()

    vendor = Vendor(user_id=user.id, phone=payload.phone, city_area=payload.city_area)
    db.add(vendor)
    db.commit()
    db.refresh(user)

    token = create_access_token({"user_id": user.id, "role": user.role})
    return TokenOut(access_token=token, role=user.role, user_id=user.id, name=user.name)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    token = create_access_token({"user_id": user.id, "role": user.role})
    return TokenOut(access_token=token, role=user.role, user_id=user.id, name=user.name)
