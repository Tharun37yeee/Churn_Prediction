"""
schemas.py
----------
Pydantic v2 request / response schemas for the Churn Predict API.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CustomerInput(BaseModel):
    """All 15 categorical feature fields accepted by the churn model."""

    # Optional display name
    name: Optional[str] = None

    # Demographic
    gender: str
    Partner: str
    Dependents: str

    # Phone services
    PhoneService: str
    MultipleLines: str

    # Internet services
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str

    # Contract & billing
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str


# ---------------------------------------------------------------------------
# Prediction response
# ---------------------------------------------------------------------------

class PredictionResponse(BaseModel):
    """Returned by POST /api/predict after a successful prediction run."""

    customer_id: int
    churn_probability: float
    will_churn: bool
    risk_level: str


# ---------------------------------------------------------------------------
# Customer output
# ---------------------------------------------------------------------------

class PredictionOut(BaseModel):
    """Slim prediction record embedded in customer views."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    churn_probability: float
    will_churn: bool
    risk_level: str
    created_at: datetime


class CustomerOut(BaseModel):
    """Full customer record with all prediction history."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: Optional[str]
    gender: str
    Partner: str
    Dependents: str
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    created_at: datetime
    predictions: list[PredictionOut] = []


# ---------------------------------------------------------------------------
# Dashboard schemas
# ---------------------------------------------------------------------------

class DashboardSummary(BaseModel):
    """Top-level KPI summary for the dashboard."""

    churn_rate: float          # percentage, e.g. 23.45
    active_customers: int
    high_risk_count: int
    revenue_at_risk: float     # high_risk_count * 500


class TrendPoint(BaseModel):
    """One data point in the monthly churn trend series."""

    month: str        # e.g. 'Jan 2024'
    churn_rate: float # percentage


class RiskDistribution(BaseModel):
    """Count of customers in each risk tier (latest prediction only)."""

    High: int
    Medium: int
    Low: int


# ---------------------------------------------------------------------------
# Paginated customer list
# ---------------------------------------------------------------------------

class CustomerListItem(BaseModel):
    """Slim customer row returned by the paginated /api/customers endpoint."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: Optional[str]
    gender: str
    Contract: str
    PaymentMethod: str
    churn_probability: Optional[float] = None
    risk_level: Optional[str] = None
    created_at: datetime


class PaginatedCustomers(BaseModel):
    """Paginated wrapper for the customer list endpoint."""

    items: list[CustomerListItem]
    total: int
    page: int
    page_size: int
