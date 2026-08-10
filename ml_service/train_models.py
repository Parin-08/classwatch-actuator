"""
train_models.py
---------------
Trains two models on the synthetic classroom data:
  1. Isolation Forest  → anomaly detection
  2. XGBoost Regressor → next-hour power forecast

Features (minimum set per contract):
    [power_watts, occupancy, hour, day_of_week]

Extended features used (supersets are fine — the /anomaly and /predict
endpoints only receive the minimum set; extras are derived server-side):
    [power_watts, occupancy, hour, day_of_week, minute, occupancy_count]

Both models are pickled to models/ and loaded once at FastAPI startup.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

# ---------------------------------------------------------------------------
FEATURES_ANOMALY  = ["power_watts", "occupancy", "hour", "day_of_week",
                     "minute", "occupancy_count"]
FEATURES_FORECAST = ["power_watts", "occupancy", "hour", "day_of_week",
                     "minute", "occupancy_count"]

MODEL_DIR = "models"
DATA_PATH = "data/synthetic_classroom_data.csv"


# ---------------------------------------------------------------------------
def load_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def build_anomaly_features(df: pd.DataFrame) -> pd.DataFrame:
    return df[FEATURES_ANOMALY].copy()


def build_forecast_target(df: pd.DataFrame) -> pd.Series:
    """
    For each reading, the target is the average power_watts over the
    NEXT 4 readings (i.e. next ~1 hour at 15-min intervals) for the
    same room. Rows without a full horizon are dropped.
    """
    results = []
    for room_id, grp in df.groupby("room_id", sort=False):
        grp = grp.sort_values("timestamp").reset_index(drop=True)
        # rolling forward mean of next 4 rows (shift -1 to -4)
        future_power = (
            grp["power_watts"].shift(-1) +
            grp["power_watts"].shift(-2) +
            grp["power_watts"].shift(-3) +
            grp["power_watts"].shift(-4)
        ) / 4.0
        grp["target_watts_next_hour"] = future_power
        results.append(grp)
    return pd.concat(results).dropna(subset=["target_watts_next_hour"])


# ---------------------------------------------------------------------------
def train_anomaly_model(df: pd.DataFrame) -> IsolationForest:
    X = build_anomaly_features(df)
    # contamination ≈ expected wastage fraction (8 %)
    model = IsolationForest(
        n_estimators=200,
        contamination=0.08,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)
    # compute real score distribution so main.py can calibrate against it
    scores = model.decision_function(X)
    wastage_mean  = scores[df["is_wastage"] == 1].mean()
    normal_mean   = scores[df["is_wastage"] == 0].mean()
    print(f"  IF anomaly score — wastage mean: {wastage_mean:.4f}  |  "
          f"normal mean: {normal_mean:.4f}  (lower = more anomalous)")
    print(f"  Score range on training data: min={scores.min():.6f}  max={scores.max():.6f}")
    # store bounds on the model object so train_models can pass them to meta
    model._score_min = float(scores.min())
    model._score_max = float(scores.max())
    return model


def train_forecast_model(df: pd.DataFrame) -> XGBRegressor:
    df_f = build_forecast_target(df)
    X = df_f[FEATURES_FORECAST]
    y = df_f["target_watts_next_hour"]

    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    # simple temporal split: first 80 % for training, last 20 % for eval
    split = int(len(X) * 0.8)
    X_train, X_val = X.iloc[:split], X.iloc[split:]
    y_train, y_val = y.iloc[:split], y.iloc[split:]
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    preds = model.predict(X_val)
    mae = np.mean(np.abs(preds - y_val.values))
    print(f"  XGBoost forecast MAE on held-out 20 %: {mae:.1f} W")
    return model


# ---------------------------------------------------------------------------
def main():
    os.makedirs(MODEL_DIR, exist_ok=True)
    print("Loading data ...")
    df = load_data()
    print(f"  {len(df):,} rows loaded")

    print("\nTraining Isolation Forest (anomaly detection) ...")
    if_model = train_anomaly_model(df)
    joblib.dump(if_model, f"{MODEL_DIR}/isolation_forest.pkl")
    print(f"  Saved -> {MODEL_DIR}/isolation_forest.pkl")

    print("\nTraining XGBoost (next-hour power forecast) ...")
    xgb_model = train_forecast_model(df)
    joblib.dump(xgb_model, f"{MODEL_DIR}/xgboost_forecast.pkl")
    print(f"  Saved -> {MODEL_DIR}/xgboost_forecast.pkl")

    # also save the feature column lists so main.py never hardcodes them
    meta = {
        "features_anomaly":  FEATURES_ANOMALY,
        "features_forecast": FEATURES_FORECAST,
        # data-driven calibration bounds for anomaly_score normalization
        "score_min": if_model._score_min,
        "score_max": if_model._score_max,
    }
    joblib.dump(meta, f"{MODEL_DIR}/model_meta.pkl")
    print(f"  Saved -> {MODEL_DIR}/model_meta.pkl")
    print(f"  Calibration bounds saved: score_min={if_model._score_min:.6f}  "
          f"score_max={if_model._score_max:.6f}")
    print("\nDone. All models pickled and ready for main.py to load.")


if __name__ == "__main__":
    main()
