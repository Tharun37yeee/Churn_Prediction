"""
main.py
-------
FastAPI application entry-point for the Churn Predict backend.

Start the server:
    uvicorn main:app --reload --port 8000
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
from sqlalchemy.orm import Session

# Load environment variables from .env before anything else
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from database import Base, engine, get_db  # noqa: E402  (after load_dotenv)
from models import Customer, Prediction  # noqa: E402
from predict_service import ChurnPredictor  # noqa: E402
from schemas import (  # noqa: E402
    CustomerInput,
    CustomerListItem,
    CustomerOut,
    DashboardSummary,
    PaginatedCustomers,
    PredictionOut,
    PredictionResponse,
    RiskDistribution,
    TrendPoint,
)

# ---------------------------------------------------------------------------
# Resolved model paths (relative to backend parent directory)
# ---------------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent
_MODEL_DIR = _BACKEND_DIR.parent  # workspace root

METADATA_PATH = str(_MODEL_DIR / "churn_pipeline_metadata.joblib")
LGB_PATH = str(_MODEL_DIR / "lgbm_churn_model.txt")
CAT_PATH = str(_MODEL_DIR / "catboost_churn_model.cbm")


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown logic
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    - Creates all database tables on startup.
    - Loads the ChurnPredictor ensemble once and stores it in app.state.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Load ML models
    app.state.predictor = ChurnPredictor(
        metadata_path=METADATA_PATH,
        lgb_path=LGB_PATH,
        cat_path=CAT_PATH,
    )

    yield  # application runs here

    # Teardown (nothing needed currently)


def get_predictor() -> ChurnPredictor:
    """Ensure the predictor is loaded, initializing if needed."""
    if not hasattr(app.state, "predictor") or app.state.predictor is None:
        Base.metadata.create_all(bind=engine)
        app.state.predictor = ChurnPredictor(
            metadata_path=METADATA_PATH,
            lgb_path=LGB_PATH,
            cat_path=CAT_PATH,
        )
    return app.state.predictor


# ---------------------------------------------------------------------------
# Application instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Predictive CRM – Churn Prediction API",
    version="1.0.0",
    description="REST API for predicting customer churn using an LightGBM + CatBoost ensemble.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _latest_prediction_subquery(db: Session):
    """
    Returns a subquery that gives the most-recent prediction id per customer.
    """
    return (
        db.query(
            Prediction.customer_id,
            func.max(Prediction.id).label("max_pred_id"),
        )
        .group_by(Prediction.customer_id)
        .subquery()
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
def health_check():
    """Simple liveness probe."""
    return {"status": "ok"}


# ---- Predict ---------------------------------------------------------------

@app.post("/api/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(payload: CustomerInput, db: Session = Depends(get_db)):
    """
    Accept a customer's feature data, persist the customer record, run the
    churn ensemble, persist the prediction, and return the result.
    """
    predictor: ChurnPredictor = get_predictor()

    # Persist customer
    customer = Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)

    # Build feature DataFrame (model expects only the 15 categorical cols)
    feature_cols = [
        "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
        "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
        "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
        "PaperlessBilling", "PaymentMethod",
    ]
    input_df = pd.DataFrame([{col: getattr(payload, col) for col in feature_cols}])

    result_df = predictor.predict(input_df)
    row = result_df.iloc[0]

    prediction = Prediction(
        customer_id=customer.id,
        churn_probability=float(row["churn_probability"]),
        will_churn=bool(row["will_churn"]),
        risk_level=str(row["risk_level"]),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return PredictionResponse(
        customer_id=customer.id,
        churn_probability=prediction.churn_probability,
        will_churn=prediction.will_churn,
        risk_level=prediction.risk_level,
    )


# ---- Dashboard – Summary ---------------------------------------------------

@app.get("/api/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns top-level KPIs:
    - churn_rate: % of all predictions that flagged will_churn=True
    - active_customers: total distinct customers
    - high_risk_count: customers whose LATEST prediction is 'High'
    - revenue_at_risk: high_risk_count * 500
    """
    total_preds = db.query(func.count(Prediction.id)).scalar() or 0
    if total_preds == 0:
        return DashboardSummary(
            churn_rate=0.0,
            active_customers=0,
            high_risk_count=0,
            revenue_at_risk=0.0,
        )

    churned_count = (
        db.query(func.count(Prediction.id))
        .filter(Prediction.will_churn.is_(True))
        .scalar()
        or 0
    )
    churn_rate = round(churned_count / total_preds * 100, 2)

    active_customers = db.query(func.count(func.distinct(Prediction.customer_id))).scalar() or 0

    # Latest prediction per customer
    latest_sub = _latest_prediction_subquery(db)
    high_risk_count = (
        db.query(func.count(Prediction.id))
        .join(latest_sub, Prediction.id == latest_sub.c.max_pred_id)
        .filter(Prediction.risk_level == "High")
        .scalar()
        or 0
    )

    return DashboardSummary(
        churn_rate=churn_rate,
        active_customers=active_customers,
        high_risk_count=high_risk_count,
        revenue_at_risk=float(high_risk_count * 500),
    )


# ---- Dashboard – Trend -----------------------------------------------------

@app.get("/api/dashboard/trend", response_model=list[TrendPoint], tags=["Dashboard"])
def dashboard_trend(db: Session = Depends(get_db)):
    """
    Monthly churn rate for the last 12 months.
    Returns a list of {month: 'Jan 2024', churn_rate: 23.5}.
    """
    # Use a raw SQL expression that works with both PostgreSQL and SQLite
    sql = text(
        """
        SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
            DATE_TRUNC('month', created_at)                       AS month_date,
            COUNT(*)                                               AS total,
            SUM(CASE WHEN will_churn THEN 1 ELSE 0 END)           AS churned
        FROM predictions
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month_date, month_label
        ORDER BY month_date ASC
        """
    )
    rows = db.execute(sql).fetchall()

    trend: list[TrendPoint] = []
    for row in rows:
        rate = round(row.churned / row.total * 100, 2) if row.total else 0.0
        trend.append(TrendPoint(month=row.month_label, churn_rate=rate))

    return trend


# ---- Dashboard – Risk Distribution -----------------------------------------

@app.get(
    "/api/dashboard/risk-distribution",
    response_model=RiskDistribution,
    tags=["Dashboard"],
)
def dashboard_risk_distribution(db: Session = Depends(get_db)):
    """
    Count of customers in each risk tier based on their LATEST prediction.
    """
    latest_sub = _latest_prediction_subquery(db)

    rows = (
        db.query(Prediction.risk_level, func.count(Prediction.id).label("cnt"))
        .join(latest_sub, Prediction.id == latest_sub.c.max_pred_id)
        .group_by(Prediction.risk_level)
        .all()
    )

    dist = {"High": 0, "Medium": 0, "Low": 0}
    for risk_level, cnt in rows:
        if risk_level in dist:
            dist[risk_level] = cnt

    return RiskDistribution(**dist)


# ---- Customers – Paginated list --------------------------------------------

@app.get("/api/customers", response_model=PaginatedCustomers, tags=["Customers"])
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    risk_filter: Optional[str] = Query(None, description="High | Medium | Low | All"),
    db: Session = Depends(get_db),
):
    """
    Paginated customer list joined with their latest prediction.
    Supports name search (case-insensitive) and risk_level filter.
    """
    latest_sub = _latest_prediction_subquery(db)

    query = (
        db.query(Customer, Prediction)
        .outerjoin(latest_sub, Customer.id == latest_sub.c.customer_id)
        .outerjoin(Prediction, Prediction.id == latest_sub.c.max_pred_id)
    )

    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%"))

    if risk_filter and risk_filter.lower() != "all":
        query = query.filter(Prediction.risk_level == risk_filter)

    total = query.count()

    offset = (page - 1) * page_size
    results = query.offset(offset).limit(page_size).all()

    items: list[CustomerListItem] = []
    for customer, prediction in results:
        items.append(
            CustomerListItem(
                id=customer.id,
                name=customer.name,
                gender=customer.gender,
                Contract=customer.Contract,
                PaymentMethod=customer.PaymentMethod,
                churn_probability=prediction.churn_probability if prediction else None,
                risk_level=prediction.risk_level if prediction else None,
                created_at=customer.created_at,
            )
        )

    return PaginatedCustomers(items=items, total=total, page=page, page_size=page_size)


# ---- Customers – Single record ----------------------------------------------

@app.get("/api/customers/{customer_id}", response_model=CustomerOut, tags=["Customers"])
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Return full customer record plus all predictions (newest first).
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    predictions = (
        db.query(Prediction)
        .filter(Prediction.customer_id == customer_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    return CustomerOut(
        id=customer.id,
        name=customer.name,
        gender=customer.gender,
        Partner=customer.Partner,
        Dependents=customer.Dependents,
        PhoneService=customer.PhoneService,
        MultipleLines=customer.MultipleLines,
        InternetService=customer.InternetService,
        OnlineSecurity=customer.OnlineSecurity,
        OnlineBackup=customer.OnlineBackup,
        DeviceProtection=customer.DeviceProtection,
        TechSupport=customer.TechSupport,
        StreamingTV=customer.StreamingTV,
        StreamingMovies=customer.StreamingMovies,
        Contract=customer.Contract,
        PaperlessBilling=customer.PaperlessBilling,
        PaymentMethod=customer.PaymentMethod,
        created_at=customer.created_at,
        predictions=[
            PredictionOut(
                id=p.id,
                churn_probability=p.churn_probability,
                will_churn=p.will_churn,
                risk_level=p.risk_level,
                created_at=p.created_at,
            )
            for p in predictions
        ],
    )


@app.delete("/api/customers/{customer_id}", tags=["Customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Delete a customer and cascade delete all their prediction records.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return {"status": "ok", "message": f"Customer {customer_id} deleted"}
