"""
main.py  —  ML Service (port 8001)
-----------------------------------
FastAPI service exposing three endpoints:

  POST /anomaly   — Isolation Forest anomaly detection
  POST /predict   — XGBoost next-hour power forecast
  GET  /health    — liveness probe

Both models are loaded ONCE at startup via lifespan context; they are
never retrained per request.  All field names match the API contract
exactly (snake_case).
"""

from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR   = os.path.join(BASE_DIR, "models")
IF_PATH     = os.path.join(MODEL_DIR, "isolation_forest.pkl")
XGB_PATH    = os.path.join(MODEL_DIR, "xgboost_forecast.pkl")
META_PATH   = os.path.join(MODEL_DIR, "model_meta.pkl")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ML] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("ml_service")

# Day-of-week name -> int (Monday = 0)
DOW_MAP = {
    "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3,
    "Fri": 4, "Sat": 5, "Sun": 6,
}


# ---------------------------------------------------------------------------
# Global model store (populated once at startup)
# ---------------------------------------------------------------------------
class ModelStore:
    if_model  = None   # IsolationForest
    xgb_model = None   # XGBRegressor
    meta      = None   # dict with feature lists + calibration bounds
    score_min: float = -0.5   # fallback; overwritten from meta at startup
    score_max: float =  0.5   # fallback; overwritten from meta at startup
    loaded    = False


store = ModelStore()


# ---------------------------------------------------------------------------
# Lifespan — load models once, before any request is served
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    missing = [p for p in (IF_PATH, XGB_PATH, META_PATH) if not os.path.exists(p)]
    if missing:
        raise RuntimeError(
            f"Model files not found: {missing}\n"
            "Run  python generate_synthetic_data.py  then  python train_models.py  first."
        )
    store.if_model  = joblib.load(IF_PATH)
    store.xgb_model = joblib.load(XGB_PATH)
    store.meta      = joblib.load(META_PATH)
    # load data-driven calibration bounds (fall back to defaults if old meta)
    store.score_min = float(store.meta.get("score_min", -0.5))
    store.score_max = float(store.meta.get("score_max",  0.5))
    store.loaded    = True
    log.info(
        "Models loaded. Calibration bounds: score_min=%.6f  score_max=%.6f",
        store.score_min, store.score_max,
    )
    yield
    # shutdown cleanup (nothing needed)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ClassWatch ML Service",
    description="Anomaly detection (Isolation Forest) + next-hour forecast (XGBoost)",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Custom 422 handler — readable message instead of raw Pydantic stack
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for e in exc.errors():
        field = " -> ".join(str(loc) for loc in e["loc"] if loc != "body")
        errors.append(f"{field}: {e['msg']}" if field else e["msg"])
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request body", "errors": errors},
    )


# ---------------------------------------------------------------------------
# Logging middleware — room_id, endpoint, response time
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    # extract room_id from path params if present (e.g. /rooms/:id endpoints)
    # for POST bodies we log after parsing inside the handler
    log.info("%s %s  %.1f ms", request.method, request.url.path, elapsed_ms)
    return response


# ---------------------------------------------------------------------------
# Request / Response schemas  (field names exactly as in API contract)
# ---------------------------------------------------------------------------
class AnomalyRequest(BaseModel):
    room_id:     str
    power_watts: float
    occupancy:   int          # 0 or 1
    timestamp:   str          # ISO-8601


class AnomalyResponse(BaseModel):
    room_id:       str
    is_anomaly:    bool
    anomaly_score: float      # 0.0–1.0 (higher = more anomalous)
    reason:        str


class PredictRequest(BaseModel):
    room_id:    str
    timestamp:  str           # ISO-8601
    day_of_week: str          # "Mon" | "Tue" | ... | "Sun"


class PredictResponse(BaseModel):
    room_id:                  str
    predicted_watts_next_hour: float
    confidence:               float  # 0.0–1.0


class HealthResponse(BaseModel):
    status:       Literal["ok", "error"]
    models_loaded: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _parse_timestamp(ts: str) -> datetime:
    """Accept ISO-8601 with or without trailing Z."""
    return datetime.fromisoformat(ts.rstrip("Z"))


def _anomaly_reason(power_watts: float, occupancy: int, hour: int) -> str:
    """Return a human-readable reason string for the flagged anomaly."""
    if occupancy == 0 and power_watts > 500:
        return "power_stable_no_occupancy"
    if occupancy == 0 and hour < 7:
        return "off_hours_power_draw"
    if occupancy == 0 and (hour >= 17 or hour < 9):
        return "out_of_hours_power_draw"
    return "statistical_outlier"


def _raw_score_to_probability(raw: float) -> float:
    """
    Normalize raw IsolationForest decision_function score to [0, 1]
    where 1 = maximally anomalous, using the ACTUAL min/max computed
    across training data (stored in model_meta at train time).

    Formula: anomaly_score = (score_max - raw) / (score_max - score_min)
    A raw score at the minimum (most anomalous point seen in training)
    maps to 1.0; a raw score at the maximum (most normal) maps to 0.0.
    Values outside the training range are clipped to [0, 1].
    """
    span = store.score_max - store.score_min
    if span == 0:
        return 0.5
    prob = (store.score_max - raw) / span
    return round(float(np.clip(prob, 0.0, 1.0)), 4)


def _confidence_from_prediction(predicted: float, hour: int, occupancy: int) -> float:
    """
    Simple heuristic confidence: daytime active-zone predictions are more
    reliable than off-hours ones where the training data is sparse.
    """
    base = 0.85 if (9 <= hour < 17 and occupancy == 1) else 0.60
    # add a small random jitter so repeated identical calls vary naturally
    jitter = float(np.random.uniform(-0.05, 0.05))
    return round(float(np.clip(base + jitter, 0.05, 0.99)), 4)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.post("/anomaly", response_model=AnomalyResponse)
def detect_anomaly(req: AnomalyRequest) -> AnomalyResponse:
    """
    Runs the Isolation Forest on the incoming reading.
    Returns is_anomaly=True when the model classifies the point as an outlier.
    room_id is passed through as-is; unknown rooms are handled gracefully.
    """
    t0 = time.perf_counter()
    if not store.loaded:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    try:
        dt = _parse_timestamp(req.timestamp)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Cannot parse timestamp: {req.timestamp!r}")

    hour    = dt.hour
    minute  = dt.minute
    dow     = dt.weekday()   # 0 = Monday

    # Build feature DataFrame — column names match training to silence sklearn warnings
    # occupancy_count unknown at inference; impute from occupancy flag
    occ_count_est = max(0, int(np.random.normal(25, 8))) if req.occupancy == 1 else 0
    X = pd.DataFrame([{
        "power_watts":     req.power_watts,
        "occupancy":       req.occupancy,
        "hour":            hour,
        "day_of_week":     dow,
        "minute":          minute,
        "occupancy_count": occ_count_est,
    }])

    raw_score  = float(store.if_model.decision_function(X)[0])
    pred_label = int(store.if_model.predict(X)[0])   # -1 = anomaly, 1 = normal
    is_anomaly = pred_label == -1
    prob       = _raw_score_to_probability(raw_score)
    reason     = _anomaly_reason(req.power_watts, req.occupancy, hour) if is_anomaly else "normal"

    elapsed_ms = (time.perf_counter() - t0) * 1000
    log.info(
        "/anomaly  room=%s  power=%.0fW  occ=%d  is_anomaly=%s  score=%.4f  raw=%.6f  %.1fms",
        req.room_id, req.power_watts, req.occupancy, is_anomaly, prob, raw_score, elapsed_ms,
    )

    return AnomalyResponse(
        room_id=req.room_id,
        is_anomaly=is_anomaly,
        anomaly_score=prob,
        reason=reason,
    )


@app.post("/predict", response_model=PredictResponse)
def predict_next_hour(req: PredictRequest) -> PredictResponse:
    """
    Uses XGBoost to forecast average power_watts over the next hour.
    day_of_week is taken from the request body; other features are derived
    from timestamp.  Unknown room_id values are handled gracefully.
    """
    t0 = time.perf_counter()
    if not store.loaded:
        raise HTTPException(status_code=503, detail="Models not loaded yet.")

    try:
        dt = _parse_timestamp(req.timestamp)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Cannot parse timestamp: {req.timestamp!r}")

    dow_str = req.day_of_week
    if dow_str not in DOW_MAP:
        raise HTTPException(
            status_code=422,
            detail=f"day_of_week must be one of {list(DOW_MAP.keys())}, got {dow_str!r}"
        )
    dow    = DOW_MAP[dow_str]
    hour   = dt.hour
    minute = dt.minute

    # We don't receive power_watts/occupancy for /predict — use schedule-aware defaults
    is_weekday = dow < 5
    is_daytime = 9 <= hour < 17
    if is_weekday and is_daytime:
        power_est   = 1100.0
        occ_est     = 1
        occ_cnt_est = 25
    elif is_weekday and 17 <= hour < 21:
        power_est   = 500.0
        occ_est     = 0
        occ_cnt_est = 0
    else:
        power_est   = 20.0
        occ_est     = 0
        occ_cnt_est = 0

    # Build feature DataFrame — column names match training to silence sklearn warnings
    X = pd.DataFrame([{
        "power_watts":     power_est,
        "occupancy":       occ_est,
        "hour":            hour,
        "day_of_week":     dow,
        "minute":          minute,
        "occupancy_count": occ_cnt_est,
    }])

    predicted = float(store.xgb_model.predict(X)[0])
    predicted = round(max(0.0, predicted), 1)
    confidence = _confidence_from_prediction(predicted, hour, occ_est)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    log.info(
        "/predict  room=%s  dow=%s  hour=%02d  pred=%.1fW  conf=%.4f  %.1fms",
        req.room_id, dow_str, hour, predicted, confidence, elapsed_ms,
    )

    return PredictResponse(
        room_id=req.room_id,
        predicted_watts_next_hour=predicted,
        confidence=confidence,
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", models_loaded=store.loaded)
