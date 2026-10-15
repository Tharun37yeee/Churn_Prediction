# 📊 Predictive CRM — Customer Churn Prediction Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Neon](https://img.shields.io/badge/Database-Neon%20Postgres-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Machine Learning](https://img.shields.io/badge/ML%20Ensemble-LightGBM%20%2B%20CatBoost-blue?style=flat-square)](https://lightgbm.readthedocs.io/)

**Predictive CRM** is an end-to-end full-stack web application designed for subscription and telecommunications businesses to predict, monitor, and mitigate customer churn. The platform combines a **LightGBM + CatBoost ensemble model**, a high-performance **FastAPI** backend, a modern **React + Vite** dashboard with **Recharts**, and a serverless **Neon PostgreSQL** database.

Demo : https://churnprediction-97jzkihzv-tha11.vercel.app/

---

## 🌟 Key Features

### 1. 📈 Executive Churn Dashboard
- **4 Live KPI Cards**: Predicted Churn Rate (%), Total Active Customers, High-Risk Accounts, and Estimated Revenue at Risk ($).
- **Monthly Trend Chart**: Month-by-month churn percentage line chart featuring a dotted historical average reference line.
- **At-Risk Customers Donut Chart**: Visual breakdown of customer risk tiers (**High**, **Medium**, **Low**).
- **Recent At-Risk Customers Table**: Quick-action view showing real-time risk scores, progress bars, risk badges, and direct links to customer profiles.
- **Real-Time Data**: All metrics, charts, and tables are dynamically computed from live PostgreSQL records.

### 2. 🎯 Interactive Churn Predictor (`/predict`)
- Card-style input form with **15 categorical dropdowns** matching the trained model encoders:
  - **Demographics**: `gender`, `Partner`, `Dependents`
  - **Services**: `PhoneService`, `MultipleLines`, `InternetService`, `OnlineSecurity`, `OnlineBackup`, `DeviceProtection`, `TechSupport`, `StreamingTV`, `StreamingMovies`
  - **Billing & Contract**: `Contract`, `PaperlessBilling`, `PaymentMethod`
- Optional **Customer Name** field for identifying the account.
- Two-column responsive layout with field validation and clear error states.
- **Instant Inference Card**: Displays circular score, exact probability %, colored risk tier badge, and `"Likely to churn"` / `"Likely to stay"` classification.
- Automatically saves every prediction and customer profile to the database.

### 3. 👥 Customer Management & Deep Profiles (`/customers/:id`)
- **Searchable & Filterable Table**: Filter by risk level (**High**, **Medium**, **Low**, **All**) and search by customer name.
- **Comprehensive Profile View**:
  - **Header Card**: Customer name, joined date, latest churn score, and risk status.
  - **Visual Score Gauge**: Color-coded progress bar matching risk level.
  - **Three Detailed Specification Cards**: Demographics, Subscribed Services, and Billing & Contract.
  - **Prediction History**: Full audit trail of predictions, including a **chronological trend chart** when multiple predictions exist.
  - **Re-run Prediction**: Pre-fills the prediction form with the customer's exact attributes for instant reassessment.
  - **Delete Customer**: Secure deletion with confirmation modal and cascade record cleanup.

### 4. 🧩 Segmentation, Reports & Settings
- **Customer Segmentation**: Risk distribution bar charts and breakdown metrics.
- **Prediction History**: Centralized log of all historical inference runs.
- **Reports**: Key retention analytics and summary stats.
- **Settings**: Read-only display of active model architectures, feature mappings, and decision thresholds.

---

## 🏗️ Architecture & Project Structure

```
Churn Predict/
├── backend/
│   ├── main.py                  # FastAPI application, lifespan handler & REST routes
│   ├── models.py                # SQLAlchemy ORM schemas (Customer & Prediction)
│   ├── schemas.py               # Pydantic v2 validation models
│   ├── database.py              # PostgreSQL engine & session factory
│   ├── predict_service.py       # ChurnPredictor ensemble inference engine
│   ├── seed.py                  # Database seeder (50 historical sample accounts)
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Database configuration template
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios HTTP client
│   │   ├── components/          # Layout, KPICard, RiskBadge, LoadingSpinner
│   │   ├── pages/               # Dashboard, PredictChurn, CustomerList,
│   │   │                        # CustomerProfile, Segmentation, History, Reports, Settings
│   │   ├── App.jsx              # React Router v6 route configuration
│   │   └── main.jsx             # React entry point
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.js       # Custom slate & teal theme colors
│   └── vite.config.js           # Vite development server configuration
├── lgbm_churn_model.txt         # Pre-trained LightGBM model artifact
├── catboost_churn_model.cbm     # Pre-trained CatBoost model artifact
├── churn_pipeline_metadata.joblib # Feature encoders and decision thresholds
├── neon.ts                      # Neon cloud infrastructure-as-code configuration
└── README.md                    # Project documentation
```

---

## 🤖 Machine Learning Model Integration

The inference engine (`ChurnPredictor`) evaluates customer churn risk using an ensemble blend:

$$\text{Probability} = \frac{P_{\text{LightGBM}} + P_{\text{CatBoost}}}{2}$$

- **Threshold Classification**: Binary flag $\text{will\_churn} = \text{Probability} \ge 0.5$ (or metadata threshold).
- **Risk Tiers**:
  - 🟢 **Low Risk**: Churn Probability $< 35\%$
  - 🟠 **Medium Risk**: Churn Probability between $35\%$ and $60\%$
  - 🔴 **High Risk**: Churn Probability $\ge 60\%$
- **Unseen Category Fallback**: Categorical encoders automatically handle unseen categories safely by falling back to the base class without throwing exceptions.
- **Zero Retraining**: Pre-trained artifacts are loaded **once** at backend startup and cached in memory.

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.9+** (tested on Python 3.11 & 3.13)
- **Node.js 18+** & **npm**
- A **Neon PostgreSQL** database account ([neon.tech](https://neon.tech))

---

### Step 1: Database Setup (Neon PostgreSQL)

1. Create a free project at [neon.tech](https://neon.tech).
2. Copy your PostgreSQL connection string:
   ```
   postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Create `backend/.env` (copy from `backend/.env.example`):
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

*(Optional CLI integration: the repository is pre-configured with `neon link` and `neon.ts` for automated Neon branch management).*

---

### Step 2: Backend Setup (FastAPI)

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server (auto-creates tables on first launch)
uvicorn main:app --reload --port 8000
```

- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### Step 3: Seed Sample Data

To populate the dashboard with 50 realistic customer records and predictions spread across the last 12 months, run:

```bash
# From within the backend directory (with virtual environment active)
python seed.py
```

---

### Step 4: Frontend Setup (React + Vite)

In a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

- **Web Application**: [http://localhost:5173](http://localhost:5173)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/predict` | Runs model inference, saves customer & prediction, returns risk score |
| `GET` | `/api/dashboard/summary` | Returns KPIs: churn rate, active customers, high-risk count, revenue at risk |
| `GET` | `/api/dashboard/trend` | Returns 12-month historical churn rate timeline |
| `GET` | `/api/dashboard/risk-distribution`| Returns customer counts grouped by High, Medium, Low risk tiers |
| `GET` | `/api/customers` | Paginated customer list with search query & risk filtering |
| `GET` | `/api/customers/{id}` | Fetches full customer profile with all 15 fields & prediction history |
| `DELETE`| `/api/customers/{id}` | Deletes customer profile and cascades related predictions |

### Example Request (`POST /api/predict`)

```json
{
  "name": "Jane Doe",
  "gender": "Female",
  "Partner": "Yes",
  "Dependents": "No",
  "PhoneService": "Yes",
  "MultipleLines": "Yes",
  "InternetService": "Fiber optic",
  "OnlineSecurity": "No",
  "OnlineBackup": "No",
  "DeviceProtection": "No",
  "TechSupport": "No",
  "StreamingTV": "Yes",
  "StreamingMovies": "Yes",
  "Contract": "Month-to-month",
  "PaperlessBilling": "Yes",
  "PaymentMethod": "Electronic check"
}
```

### Example Response (`200 OK`)

```json
{
  "customer_id": 51,
  "churn_probability": 0.7337,
  "will_churn": true,
  "risk_level": "High"
}
```

---

## 🛡️ Production & Security Considerations

1. **Environment Security**: Never commit `.env` or `.env.local` containing live database credentials to version control.
2. **CORS Restrictions**: For production deployments, update `allow_origins` in `backend/main.py` from `["*"]` to your specific production domain.
3. **Database Connection Pooling**: Neon connection strings with `-pooler` are recommended for serverless or high-concurrency environments.

---

## 📄 License

This project is licensed under the MIT License — feel free to customize and extend for your commercial or personal CRM needs.
