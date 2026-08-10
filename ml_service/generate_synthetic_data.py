"""
generate_synthetic_data.py
--------------------------
Generates 90 days of synthetic per-minute classroom power/occupancy readings
for a set of rooms and writes them to data/synthetic_classroom_data.csv.

Seasonality rules
-----------------
- Weekday 09:00-17:00 → active hours (classes running, devices on)
- Weekday 17:00-21:00 → tapering off (some late usage)
- Night (21:00-07:00) and all weekend → near-zero
- ~8 % of active-hour readings are "wastage spikes":
    occupancy = 0  but power stays at active-hour levels
    (the anomaly detector must flag these)

Features per row
----------------
room_id, timestamp, power_watts, occupancy, occupancy_count,
hour, minute, day_of_week (0=Mon ... 6=Sun),
is_wastage (ground-truth label for evaluation only, not fed to the model)
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# -- reproducibility -----------------------------------------------------------
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# -- config --------------------------------------------------------------------
ROOMS = ["R101", "R102", "R103", "R201", "R202", "R203", "R204", "R205", "R301"]
DAYS = 90
START_DATE = datetime(2026, 5, 12, 0, 0, 0)          # 90 days of history
SAMPLE_INTERVAL_MINUTES = 15                          # one reading every 15 min
WASTAGE_PROB = 0.08                                   # 8 % of active-hour rows

# power profiles (watts) per zone
POWER_PROFILES = {
    "active":   {"base": 1200, "noise": 200},         # full class in session
    "tapering": {"base": 600,  "noise": 150},         # evening wind-down
    "idle":     {"base": 80,   "noise": 30},          # lights on, nothing else
    "off":      {"base": 15,   "noise": 10},          # standby / AC leak
}


def zone(hour: int, weekday: int) -> str:
    """Return power zone label for given hour and weekday (0=Mon)."""
    if weekday >= 5:                                   # weekend
        return "off"
    if 9 <= hour < 17:
        return "active"
    if 17 <= hour < 21:
        return "tapering"
    return "off"


def sample_power(z: str) -> float:
    p = POWER_PROFILES[z]
    return max(0.0, np.random.normal(p["base"], p["noise"]))


def sample_occupancy(z: str):
    """Return (occupancy_bool, occupancy_count)."""
    if z == "active":
        count = int(np.random.normal(28, 8))
        count = max(1, min(count, 60))
        return 1, count
    if z == "tapering":
        if random.random() < 0.3:
            count = int(np.random.normal(10, 5))
            return 1, max(1, count)
        return 0, 0
    return 0, 0


def generate() -> pd.DataFrame:
    records = []
    total_ts = (DAYS * 24 * 60) // SAMPLE_INTERVAL_MINUTES

    for room_id in ROOMS:
        ts = START_DATE
        for _ in range(total_ts):
            h = ts.hour
            wd = ts.weekday()
            z = zone(h, wd)

            occ_bool, occ_count = sample_occupancy(z)
            pwr = sample_power(z)

            is_wastage = 0
            # inject wastage spike: active-zone power but nobody in the room
            if z == "active" and occ_bool == 1 and random.random() < WASTAGE_PROB:
                occ_bool, occ_count = 0, 0
                pwr = sample_power("active")          # power stays high
                is_wastage = 1

            records.append({
                "room_id":         room_id,
                "timestamp":       ts.isoformat() + "Z",
                "power_watts":     round(pwr, 1),
                "occupancy":       occ_bool,
                "occupancy_count": occ_count,
                "hour":            h,
                "minute":          ts.minute,
                "day_of_week":     wd,                # 0 = Monday
                "is_wastage":      is_wastage,
            })
            ts += timedelta(minutes=SAMPLE_INTERVAL_MINUTES)

    return pd.DataFrame(records)


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    print("Generating synthetic data ...")
    df = generate()
    out = "data/synthetic_classroom_data.csv"
    df.to_csv(out, index=False)
    print(f"Saved {len(df):,} rows -> {out}")
    print(df.describe())
    wastage_pct = df["is_wastage"].mean() * 100
    print(f"\nWastage rows: {wastage_pct:.2f} % of all rows")
