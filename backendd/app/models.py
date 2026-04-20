from datetime import datetime
from sqlalchemy import (
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Numeric,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # "customer" | "vendor" | "admin"
    role: Mapped[str] = mapped_column(String(30), nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    customer_profile = relationship("Customer", back_populates="user", uselist=False)
    vendor_profile = relationship("Vendor", back_populates="user", uselist=False)


class Customer(Base):
    __tablename__ = "customers"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user = relationship("User", back_populates="customer_profile")
    jobs = relationship("Job", back_populates="customer")


class Vendor(Base):
    __tablename__ = "vendors"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    city_area: Mapped[str | None] = mapped_column(String(120), nullable=True)

    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    shop_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    avg_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0, nullable=False)

    user = relationship("User", back_populates="vendor_profile")
    services = relationship("VendorService", back_populates="vendor", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="vendor")
    assigned_jobs = relationship("Job", back_populates="vendor")
    ratings = relationship("Rating", back_populates="vendor")


class VendorService(Base):
    __tablename__ = "vendor_services"
    __table_args__ = (
        UniqueConstraint("vendor_id", "service_type", name="uq_vendor_service_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.user_id", ondelete="CASCADE"), nullable=False, index=True)

    service_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    base_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vendor = relationship("Vendor", back_populates="services")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.user_id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.user_id", ondelete="SET NULL"), nullable=True, index=True)

    service_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    address: Mapped[str] = mapped_column(String(255), nullable=False)
    preferred_time: Mapped[str | None] = mapped_column(String(120), nullable=True)

    customer_budget: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    final_cost: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    # open | assigned | picked_up | in_repair | repaired | ready_for_pickup | completed | cancelled
    status: Mapped[str] = mapped_column(String(40), default="open", nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="jobs")
    vendor = relationship("Vendor", back_populates="assigned_jobs")
    images = relationship("JobImage", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")
    status_history = relationship("JobStatusHistory", back_populates="job", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="job", uselist=False, cascade="all, delete-orphan")
    rating = relationship("Rating", back_populates="job", uselist=False, cascade="all, delete-orphan")


class JobImage(Base):
    __tablename__ = "job_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("Job", back_populates="images")


class JobApplication(Base):
    __tablename__ = "job_applications"
    __table_args__ = (
        UniqueConstraint("job_id", "vendor_id", name="uq_job_vendor_application"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.user_id", ondelete="CASCADE"), nullable=False, index=True)

    proposed_cost: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # pending | selected | rejected | withdrawn
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("Job", back_populates="applications")
    vendor = relationship("Vendor", back_populates="applications")


class JobStatusHistory(Base):
    __tablename__ = "job_status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    status: Mapped[str] = mapped_column(String(40), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    changed_by_role: Mapped[str] = mapped_column(String(30), nullable=False)  # customer/vendor/admin
    changed_by_id: Mapped[int] = mapped_column(Integer, nullable=False)

    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("Job", back_populates="status_history")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    method: Mapped[str] = mapped_column(String(20), default="COD", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="unpaid", nullable=False)  # unpaid/paid

    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    job = relationship("Job", back_populates="payment")


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.user_id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.user_id", ondelete="CASCADE"), nullable=False, index=True)

    stars: Mapped[int] = mapped_column(Integer, nullable=False)  # 1..5
    review_text: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    vendor = relationship("Vendor", back_populates="ratings")
    job = relationship("Job", back_populates="rating")
