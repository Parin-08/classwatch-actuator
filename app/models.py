from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Action(str, Enum):
    POWER_ON = "power_on"
    POWER_OFF = "power_off"


class ActuationRequest(BaseModel):
    room_id: str = Field(min_length=1)
    device: str = Field(min_length=1)
    action: Action
    reason: str = Field(min_length=1)
    estimated_power_kw: float = Field(default=0.0, ge=0)
    duration_minutes: Optional[float] = Field(default=None, gt=0)


class ActuationResponse(BaseModel):
    action_id: str
    room_id: str
    device: str
    action: Action
    reason: str
    timestamp: datetime
    status: str
    estimated_power_kw: float
    duration_minutes: float
    kwh_saved: float
    rupees_saved: float
    co2_saved_kg: float


class ActionRecord(ActuationResponse):
    pass


class LedgerTotals(BaseModel):
    total_kwh_saved: float
    total_rupees_saved: float
    total_co2_saved_kg: float
    total_actions: int


class CounterfactualResponse(BaseModel):
    period_days: int
    baseline_kwh: float
    actual_kwh: float
    saved_kwh: float
    savings_percentage: float
    saved_rupees: float
    saved_co2_kg: float


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
