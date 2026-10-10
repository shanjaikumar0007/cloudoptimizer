# Cloud Optimizer - Backend API

Production-ready decoupled cloud resource cost & utilization optimization engine built with FastAPI, SQLAlchemy, and SQLite.

## Project Structure
```text
backend/
├── app/
│   ├── main.py          # FastAPI entry point & API endpoints
│   ├── database.py      # SQLAlchemy engine & SessionLocal setup
│   ├── models.py        # Database models (Resource, MetricHistory, Recommendation)
│   ├── schemas.py       # Pydantic validation schemas
│   ├── services.py      # Optimization engine (<15% Idle, <40% Underutilized, cost math)
│   └── crud.py          # Database operations (Create, Read, Update, Delete)
├── tests/
│   └── test_optimizer.py # Automated pytest test cases
├── seed.py              # Initial dataset seeder
└── requirements.txt     # Python package requirements
```

## Setup & Running Locally
```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed demo resources into SQLite
python seed.py

# 4. Start the FastAPI development server
uvicorn app.main:app --reload --port 8000

# 5. Open Swagger Documentation
# Navigate to: http://127.0.0.1:8000/docs
```

## Running Automated Tests
```bash
pytest tests/ -v
```
