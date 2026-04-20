from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# -------------------------
# Auth
# -------------------------
class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str


class RegisterCustomerIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=255)


class RegisterVendorIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: str | None = Field(default=None, max_length=40)
    city_area: str | None = Field(default=None, max_length=120)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime


# -------------------------
# Vendor
# -------------------------
class VendorPublic(BaseModel):
    user_id: int
    name: str
    phone: str | None
    city_area: str | None
    profile_image_url: str | None
    shop_image_url: str | None
    avg_rating: float


class VendorUpdateIn(BaseModel):
    phone: str | None = Field(default=None, max_length=40)
    city_area: str | None = Field(default=None, max_length=120)


class VendorServiceIn(BaseModel):
    service_type: str = Field(min_length=2, max_length=80)
    base_price: float | None = None


class VendorServiceOut(BaseModel):
    id: int
    service_type: str
    base_price: float | None
    created_at: datetime


# -------------------------
# Jobs / Marketplace
# -------------------------
class JobCreateIn(BaseModel):
    service_type: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=10, max_length=5000)
    address: str = Field(min_length=5, max_length=255)
    preferred_time: str | None = Field(default=None, max_length=120)
    customer_budget: float = Field(gt=0)


class JobImageOut(BaseModel):
    id: int
    image_url: str
    uploaded_at: datetime


class JobOut(BaseModel):
    id: int
    customer_id: int
    vendor_id: int | None
    service_type: str
    description: str
    address: str
    preferred_time: str | None
    customer_budget: float
    final_cost: float | None
    status: str
    created_at: datetime
    images: list[JobImageOut] = []


class ApplicationCreateIn(BaseModel):
    proposed_cost: float = Field(gt=0)
    message: str | None = Field(default=None, max_length=500)


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    vendor_id: int
    vendor_name: str
    vendor_profile_image_url: str | None
    vendor_shop_image_url: str | None
    vendor_avg_rating: float
    proposed_cost: float
    message: str | None
    status: str
    created_at: datetime


class SelectVendorIn(BaseModel):
    application_id: int


class StatusUpdateIn(BaseModel):
    new_status: str = Field(min_length=2, max_length=40)
    note: str | None = Field(default=None, max_length=500)


class StatusHistoryOut(BaseModel):
    id: int
    status: str
    note: str | None
    changed_by_role: str
    changed_by_id: int
    changed_at: datetime


# -------------------------
# Payments (COD)
# -------------------------
class PaymentOut(BaseModel):
    id: int
    job_id: int
    method: str
    status: str
    amount: float
    paid_at: datetime | None


# -------------------------
# Ratings
# -------------------------
class RatingCreateIn(BaseModel):
    stars: int = Field(ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=1000)


class RatingOut(BaseModel):
    id: int
    job_id: int
    vendor_id: int
    customer_id: int
    stars: int
    review_text: str | None
    created_at: datetime


class VendorReviewOut(BaseModel):
    rating_id: int
    job_id: int
    stars: int
    review_text: str | None
    created_at: datetime
    customer_name: str
