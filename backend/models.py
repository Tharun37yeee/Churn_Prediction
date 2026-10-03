"""
models.py
---------
SQLAlchemy ORM models for the Churn Predict application.

Tables
------
customers   - stores raw customer profile data
predictions - stores churn prediction results linked to a customer
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


# ---------------------------------------------------------------------------
# Customer model
# ---------------------------------------------------------------------------

class Customer(Base):
    """Represents a single CRM customer record."""

    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Demographic
    gender: Mapped[str] = mapped_column(String(50), nullable=False)
    Partner: Mapped[str] = mapped_column(String(10), nullable=False)
    Dependents: Mapped[str] = mapped_column(String(10), nullable=False)

    # Phone services
    PhoneService: Mapped[str] = mapped_column(String(10), nullable=False)
    MultipleLines: Mapped[str] = mapped_column(String(50), nullable=False)

    # Internet services
    InternetService: Mapped[str] = mapped_column(String(50), nullable=False)
    OnlineSecurity: Mapped[str] = mapped_column(String(50), nullable=False)
    OnlineBackup: Mapped[str] = mapped_column(String(50), nullable=False)
    DeviceProtection: Mapped[str] = mapped_column(String(50), nullable=False)
    TechSupport: Mapped[str] = mapped_column(String(50), nullable=False)
    StreamingTV: Mapped[str] = mapped_column(String(50), nullable=False)
    StreamingMovies: Mapped[str] = mapped_column(String(50), nullable=False)

    # Contract & billing
    Contract: Mapped[str] = mapped_column(String(50), nullable=False)
    PaperlessBilling: Mapped[str] = mapped_column(String(10), nullable=False)
    PaymentMethod: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    predictions: Mapped[list["Prediction"]] = relationship(
        "Prediction", back_populates="customer", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Prediction model
# ---------------------------------------------------------------------------

class Prediction(Base):
    """Stores a single churn prediction run for a customer."""

    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    churn_probability: Mapped[float] = mapped_column(Float, nullable=False)
    will_churn: Mapped[bool] = mapped_column(Boolean, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)  # Low | Medium | High

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    customer: Mapped["Customer"] = relationship("Customer", back_populates="predictions")
