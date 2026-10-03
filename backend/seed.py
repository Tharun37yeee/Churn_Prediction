"""
seed.py
-------
Standalone script that populates the database with 50 realistic sample customers
spread across the last 12 months, running churn predictions for each.

Usage:
    python seed.py
"""

import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

import pandas as pd  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

# Ensure the backend directory is on the path so local imports work
sys.path.insert(0, str(Path(__file__).parent))

from database import Base  # noqa: E402
from models import Customer, Prediction  # noqa: E402
from predict_service import ChurnPredictor  # noqa: E402

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ["DATABASE_URL"]

_BACKEND_DIR = Path(__file__).resolve().parent
_MODEL_DIR = _BACKEND_DIR.parent

METADATA_PATH = str(_MODEL_DIR / "churn_pipeline_metadata.joblib")
LGB_PATH = str(_MODEL_DIR / "lgbm_churn_model.txt")
CAT_PATH = str(_MODEL_DIR / "catboost_churn_model.cbm")

# ---------------------------------------------------------------------------
# Valid categorical values
# ---------------------------------------------------------------------------

GENDERS = ["Female", "Male"]
YES_NO = ["Yes", "No"]
MULTIPLE_LINES = ["Yes", "No", "No phone service"]
INTERNET = ["DSL", "Fiber optic", "No"]
INTERNET_OPT = ["Yes", "No", "No internet service"]
CONTRACTS = ["Month-to-month", "One year", "Two year"]
PAYMENT_METHODS = [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)",
]

# ---------------------------------------------------------------------------
# Realistic names
# ---------------------------------------------------------------------------

NAMES = [
    "Alice Johnson", "Bob Martinez", "Carol Williams", "David Brown",
    "Emily Davis", "Frank Wilson", "Grace Taylor", "Henry Anderson",
    "Isabella Thomas", "James Jackson", "Karen White", "Liam Harris",
    "Mia Martin", "Noah Thompson", "Olivia Garcia", "Patrick Martinez",
    "Quinn Robinson", "Rachel Clark", "Samuel Rodriguez", "Tina Lewis",
    "Uma Lee", "Victor Walker", "Wendy Hall", "Xavier Allen",
    "Yara Young", "Zachary Hernandez", "Amber King", "Brandon Wright",
    "Chloe Lopez", "Derek Hill", "Elaine Scott", "Finn Green",
    "Gloria Adams", "Harold Baker", "Iris Gonzalez", "Jason Nelson",
    "Katherine Carter", "Leonard Mitchell", "Monica Perez", "Nathan Roberts",
    "Ophelia Turner", "Philip Phillips", "Quinn Campbell", "Rose Parker",
    "Steven Evans", "Tara Edwards", "Umar Collins", "Vanessa Stewart",
    "Walter Sanchez", "Xena Morris",
]

# ---------------------------------------------------------------------------
# Profile templates to ensure a realistic mix of risk levels
# ---------------------------------------------------------------------------

def _high_risk_profile():
    """Month-to-month, electronic check, fiber optic without extra services."""
    return {
        "gender": random.choice(GENDERS),
        "Partner": "No",
        "Dependents": "No",
        "PhoneService": "Yes",
        "MultipleLines": random.choice(["Yes", "No"]),
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "OnlineBackup": "No",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": random.choice(YES_NO),
        "StreamingMovies": random.choice(YES_NO),
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
    }


def _low_risk_profile():
    """Long-term contract, automatic payment, full add-on bundle."""
    return {
        "gender": random.choice(GENDERS),
        "Partner": "Yes",
        "Dependents": random.choice(YES_NO),
        "PhoneService": "Yes",
        "MultipleLines": "Yes",
        "InternetService": random.choice(["DSL", "Fiber optic"]),
        "OnlineSecurity": "Yes",
        "OnlineBackup": "Yes",
        "DeviceProtection": "Yes",
        "TechSupport": "Yes",
        "StreamingTV": "Yes",
        "StreamingMovies": "Yes",
        "Contract": random.choice(["One year", "Two year"]),
        "PaperlessBilling": random.choice(YES_NO),
        "PaymentMethod": random.choice([
            "Bank transfer (automatic)", "Credit card (automatic)"
        ]),
    }


def _medium_risk_profile():
    """Mixed signals – month-to-month but with some protective services."""
    internet = random.choice(["DSL", "Fiber optic"])
    return {
        "gender": random.choice(GENDERS),
        "Partner": random.choice(YES_NO),
        "Dependents": random.choice(YES_NO),
        "PhoneService": "Yes",
        "MultipleLines": random.choice(MULTIPLE_LINES),
        "InternetService": internet,
        "OnlineSecurity": random.choice(YES_NO),
        "OnlineBackup": random.choice(YES_NO),
        "DeviceProtection": random.choice(YES_NO),
        "TechSupport": random.choice(YES_NO),
        "StreamingTV": random.choice(YES_NO),
        "StreamingMovies": random.choice(YES_NO),
        "Contract": "Month-to-month",
        "PaperlessBilling": random.choice(YES_NO),
        "PaymentMethod": random.choice(PAYMENT_METHODS),
    }


def _random_profile():
    """Fully random profile for variety."""
    internet = random.choice(INTERNET)
    internet_opt = "No internet service" if internet == "No" else random.choice(YES_NO)
    phone = random.choice(YES_NO)
    multi = "No phone service" if phone == "No" else random.choice(YES_NO)
    return {
        "gender": random.choice(GENDERS),
        "Partner": random.choice(YES_NO),
        "Dependents": random.choice(YES_NO),
        "PhoneService": phone,
        "MultipleLines": multi,
        "InternetService": internet,
        "OnlineSecurity": internet_opt,
        "OnlineBackup": internet_opt,
        "DeviceProtection": internet_opt,
        "TechSupport": internet_opt,
        "StreamingTV": internet_opt,
        "StreamingMovies": internet_opt,
        "Contract": random.choice(CONTRACTS),
        "PaperlessBilling": random.choice(YES_NO),
        "PaymentMethod": random.choice(PAYMENT_METHODS),
    }


# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

def generate_customers(n: int = 50) -> list[dict]:
    """Build a list of n customer feature dicts with varied risk profiles."""
    random.seed(42)
    profiles = []

    # Aim for ~30% High, ~30% Medium, ~30% Low, ~10% random
    for i in range(n):
        roll = random.random()
        if roll < 0.30:
            profile = _high_risk_profile()
        elif roll < 0.60:
            profile = _low_risk_profile()
        elif roll < 0.90:
            profile = _medium_risk_profile()
        else:
            profile = _random_profile()
        profile["name"] = NAMES[i % len(NAMES)]
        profiles.append(profile)

    return profiles


def spread_timestamps(n: int) -> list[datetime]:
    """
    Return n datetime objects spread roughly evenly over the last 12 months.
    """
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=365)
    total_seconds = (now - start).total_seconds()
    random.seed(99)
    return sorted(
        start + timedelta(seconds=random.uniform(0, total_seconds))
        for _ in range(n)
    )


def main():
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)

    predictor = ChurnPredictor(
        metadata_path=METADATA_PATH,
        lgb_path=LGB_PATH,
        cat_path=CAT_PATH,
    )

    feature_cols = [
        "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
        "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
        "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
        "PaperlessBilling", "PaymentMethod",
    ]

    customers_data = generate_customers(50)
    timestamps = spread_timestamps(50)

    print(f"Seeding {len(customers_data)} customers ...")

    with Session(engine) as session:
        for i, (data, ts) in enumerate(zip(customers_data, timestamps), start=1):
            # Persist customer
            customer = Customer(**data, created_at=ts)
            session.add(customer)
            session.flush()  # get the auto-generated id

            # Run prediction
            input_df = pd.DataFrame([{col: data[col] for col in feature_cols}])
            result_df = predictor.predict(input_df)
            row = result_df.iloc[0]

            prediction = Prediction(
                customer_id=customer.id,
                churn_probability=float(row["churn_probability"]),
                will_churn=bool(row["will_churn"]),
                risk_level=str(row["risk_level"]),
                created_at=ts,
            )
            session.add(prediction)

            print(
                f"  [{i:02d}/50] {data['name']:<22} "
                f"risk={str(row['risk_level']):<6} "
                f"prob={float(row['churn_probability']):.4f}"
            )

        session.commit()

    print("\n[OK] Seed complete - 50 customers inserted.")


if __name__ == "__main__":
    main()
