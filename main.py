"""
ClassWatch - Decision Layer Microservice
FastAPI service evaluating classroom energy signals, computing decisions,
and tracking room efficiency scores & leaderboards.
"""

from typing import List, Literal, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ============================================================================
# CONFIGURABLE CONSTANTS & THRESHOLDS
# ============================================================================

# Scoring Constants
WEIGHT_PER_FLAG: int = 8          # Penalty per flag received this week
STREAK_BONUS_PER_DAY: int = 2     # Score bonus awarded per consecutive clean day
MAX_STREAK_BONUS: int = 20        # Cap for streak bonus

# Decision Thresholds
AUTO_ACTUATE_THRESHOLD: float = 0.70  # Combined score required for auto_actuate
NOTIFY_THRESHOLD: float = 0.35        # Combined score required for notify

# Factor Weight Baselines (Sum to 1.0)
BASE_IDLE_WEIGHT: float = 0.50
BASE_OFF_SCHEDULE_WEIGHT: float = 0.30
BASE_ANOMALY_WEIGHT: float = 0.20

# Occunpancy / Safety Flag Constants
OCCUPIED_FLAGS = {"occupied", "class_in_session", "motion_detected", "manual_override", "in_use"}
IDLE_FLAGS = {"idle_after_class", "unoccupied_power_high", "idle", "no_occupancy", "idle_lights_on", "after_hours"}


# ============================================================================
# PYDANTIC INPUT / OUTPUT MODELS
# ============================================================================

class AnomalyInput(BaseModel):
    is_anomaly: bool
    anomaly_score: float = Field(..., ge=0.0, le=1.0)


class PredictionInput(BaseModel):
    predicted_watts_next_hour: float = Field(..., ge=0.0)


class DecideRequest(BaseModel):
    room_id: str = Field(..., min_length=1)
    rule_flags: List[str]
    anomaly: AnomalyInput
    prediction: PredictionInput
    current_power: float = Field(..., ge=0.0)


class Explanation(BaseModel):
    idle_time_weight: float
    off_schedule_weight: float
    anomaly_weight: float


class DecideResponse(BaseModel):
    room_id: str
    decision: Literal["notify", "auto_actuate", "log_only"]
    explanation: Explanation
    confidence: float


class RoomScoreResponse(BaseModel):
    room_id: str
    efficiency_score: int
    tier: Literal["clean", "notice", "warning", "flagged"]
    flags_this_week: int
    streak_days_clean: int


class LeaderboardItemTop(BaseModel):
    room_id: str
    efficiency_score: int
    streak_days_clean: int


class LeaderboardItemBottom(BaseModel):
    room_id: str
    efficiency_score: int
    flags_this_week: int


class LeaderboardResponse(BaseModel):
    top: List[LeaderboardItemTop]
    bottom: List[LeaderboardItemBottom]


# ============================================================================
# IN-MEMORY STATE DATA STRUCTURES
# ============================================================================

class RoomRecord:
    def __init__(self, room_id: str):
        self.room_id: str = room_id
        self.flags_this_week: int = 0
        self.streak_days_clean: int = 0

    def compute_efficiency_score(self) -> int:
        bonus = min(self.streak_days_clean * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS)
        penalty = self.flags_this_week * WEIGHT_PER_FLAG
        raw_score = 100 - penalty + bonus
        return max(0, min(100, raw_score))

    def get_tier(self) -> str:
        """
        Exact tier thresholds:
        - clean = 0 flags this week
        - notice = 1 flag
        - warning = 2-3 flags
        - flagged = 4+ flags
        """
        if self.flags_this_week == 0:
            return "clean"
        elif self.flags_this_week == 1:
            return "notice"
        elif self.flags_this_week in (2, 3):
            return "warning"
        else:
            return "flagged"

    def to_score_response(self) -> RoomScoreResponse:
        return RoomScoreResponse(
            room_id=self.room_id,
            efficiency_score=self.compute_efficiency_score(),
            tier=self.get_tier(),
            flags_this_week=self.flags_this_week,
            streak_days_clean=self.streak_days_clean,
        )


# In-memory storage for rooms & decision audit logs
ROOMS_DB: Dict[str, RoomRecord] = {}
DECISION_LOGS: List[Dict[str, Any]] = []


def get_or_create_room(room_id: str) -> RoomRecord:
    if room_id not in ROOMS_DB:
        ROOMS_DB[room_id] = RoomRecord(room_id=room_id)
    return ROOMS_DB[room_id]


# ============================================================================
# FASTAPI APP & EXCEPTION HANDLERS
# ============================================================================

app = FastAPI(
    title="ClassWatch Decision Layer Microservice",
    description="Evaluates classroom energy signals and manages room efficiency scores.",
    version="1.0.0",
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Ensure malformed requests return clean 422 JSON errors instead of raw stack traces."""
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Invalid input payload structure"},
    )


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/decide", response_model=DecideResponse)
def make_decision(req: DecideRequest):
    """
    Evaluates classroom signals and returns a decision ('auto_actuate', 'notify', 'log_only').
    Weights in explanation sum to 1.0.
    Enforces occupancy safety rules.
    """

    # 1. Update in-memory room tracking if rule flags are present
    room = get_or_create_room(req.room_id)
    if req.rule_flags:
        room.flags_this_week += len(req.rule_flags)
        room.streak_days_clean = 0  # Reset clean streak on rule flags

    # 2. Compute Individual Sub-signal Intensities (0.0 to 1.0)
    # Idle / Occupancy mismatch signal intensity from rule flags
    has_idle_flag = any(flag in IDLE_FLAGS or "idle" in flag.lower() or "unoccupied" in flag.lower() for flag in req.rule_flags)
    idle_signal = 1.0 if has_idle_flag else (0.5 if req.rule_flags else 0.0)

    # Off-schedule signal intensity (power gap ratio + off-schedule flag)
    power_diff = max(0.0, req.current_power - req.prediction.predicted_watts_next_hour)
    power_ratio = min(1.0, power_diff / max(req.current_power, 100.0))
    has_off_sched_flag = any("off_schedule" in flag.lower() or "after_hours" in flag.lower() for flag in req.rule_flags)
    off_schedule_signal = min(1.0, max(power_ratio, 0.8 if has_off_sched_flag else power_ratio))

    # Anomaly signal intensity
    anomaly_signal = max(0.0, min(1.0, req.anomaly.anomaly_score))

    # 3. Factor raw contributions
    contrib_idle = BASE_IDLE_WEIGHT * idle_signal
    contrib_sched = BASE_OFF_SCHEDULE_WEIGHT * off_schedule_signal
    contrib_anom = BASE_ANOMALY_WEIGHT * anomaly_signal

    total_contrib = contrib_idle + contrib_sched + contrib_anom

    # 4. Calculate explanation weights (normalizing so they sum to 1.0)
    if total_contrib > 0:
        w_idle = contrib_idle / total_contrib
        w_sched = contrib_sched / total_contrib
        w_anom = contrib_anom / total_contrib
    else:
        w_idle, w_sched, w_anom = BASE_IDLE_WEIGHT, BASE_OFF_SCHEDULE_WEIGHT, BASE_ANOMALY_WEIGHT

    # Round weights to 2 decimal places and adjust sum to exactly 1.00
    w_idle_r = round(w_idle, 2)
    w_sched_r = round(w_sched, 2)
    w_anom_r = round(w_anom, 2)
    weight_diff = round(1.0 - (w_idle_r + w_sched_r + w_anom_r), 2)
    
    # Adjust the largest weight by diff to preserve 1.00 exact sum
    if weight_diff != 0:
        weights = [("idle", w_idle_r), ("sched", w_sched_r), ("anom", w_anom_r)]
        weights.sort(key=lambda x: x[1], reverse=True)
        largest_key = weights[0][0]
        if largest_key == "idle":
            w_idle_r = round(w_idle_r + weight_diff, 2)
        elif largest_key == "sched":
            w_sched_r = round(w_sched_r + weight_diff, 2)
        else:
            w_anom_r = round(w_anom_r + weight_diff, 2)

    explanation = Explanation(
        idle_time_weight=w_idle_r,
        off_schedule_weight=w_sched_r,
        anomaly_weight=w_anom_r,
    )

    # 5. Combined Score & Confidence calculation
    combined_score = min(1.0, max(0.0, total_contrib))
    confidence = round(combined_score, 2)

    # 6. Safety Rule Evaluation
    # Check if any rule flag indicates room occupancy
    has_occupancy_signal = any(flag in OCCUPIED_FLAGS or "occupied" in flag.lower() or "motion" in flag.lower() for flag in req.rule_flags)

    # CRITICAL SAFETY RULE: auto_actuate must never fire on anomaly_score alone without at least one corroborating rule_flag.
    # Also: Occupancy safety takes precedence over energy savings.
    has_corroborating_rule_flag = len(req.rule_flags) > 0 and not has_occupancy_signal

    if combined_score >= AUTO_ACTUATE_THRESHOLD and has_corroborating_rule_flag:
        decision = "auto_actuate"
    elif combined_score >= NOTIFY_THRESHOLD or len(req.rule_flags) > 0 or req.anomaly.is_anomaly:
        decision = "notify"
    else:
        decision = "log_only"

    # 7. Audit Logging
    decision_log = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "room_id": req.room_id,
        "decision": decision,
        "confidence": confidence,
        "explanation": explanation.model_dump(),
        "rule_flags": req.rule_flags,
        "current_power": req.current_power,
    }
    DECISION_LOGS.append(decision_log)

    return DecideResponse(
        room_id=req.room_id,
        decision=decision,
        explanation=explanation,
        confidence=confidence,
    )


@app.get("/rooms/{room_id}/score", response_model=RoomScoreResponse)
def get_room_score(room_id: str):
    """
    Returns the efficiency score, tier, weekly flag count, and clean streak for a room.
    If room_id has never been seen before, initializes it with default clean record (score 100, tier "clean").
    """
    room = get_or_create_room(room_id)
    return room.to_score_response()


@app.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(limit: int = Query(default=5, ge=1)):
    """
    Returns top (highest score desc) and bottom (lowest score asc) rooms.
    Ties broken deterministically alphabetically by room_id.
    """
    all_rooms = list(ROOMS_DB.values())

    # Top rooms: highest score descending, then room_id ascending
    top_sorted = sorted(
        all_rooms,
        key=lambda r: (-r.compute_efficiency_score(), r.room_id)
    )[:limit]

    # Bottom rooms: lowest score ascending, then room_id ascending
    bottom_sorted = sorted(
        all_rooms,
        key=lambda r: (r.compute_efficiency_score(), r.room_id)
    )[:limit]

    top_items = [
        LeaderboardItemTop(
            room_id=r.room_id,
            efficiency_score=r.compute_efficiency_score(),
            streak_days_clean=r.streak_days_clean,
        )
        for r in top_sorted
    ]

    bottom_items = [
        LeaderboardItemBottom(
            room_id=r.room_id,
            efficiency_score=r.compute_efficiency_score(),
            flags_this_week=r.flags_this_week,
        )
        for r in bottom_sorted
    ]

    return LeaderboardResponse(top=top_items, bottom=bottom_items)


@app.post("/rooms/{room_id}/flag", response_model=RoomScoreResponse)
def manually_flag_room(room_id: str, count: int = Query(default=1, ge=1)):
    """
    INTERNAL HELPER: For local testing only. NOT called by team microservices.
    Manually increments a room's flag count to test scoring & tier boundaries.
    """
    room = get_or_create_room(room_id)
    room.flags_this_week += count
    room.streak_days_clean = 0
    return room.to_score_response()
