from uuid import uuid4

from fastapi import FastAPI

from .actuator import VirtualActuator
from .config import (
    ACTUATOR_MODE,
    CO2_KG_PER_KWH,
    DEFAULT_SAVED_MINUTES,
    ELECTRICITY_RATE_INR_PER_KWH,
)
from .ledger import SavingsLedger
from .models import (
    ActionRecord,
    ActuationRequest,
    ActuationResponse,
    CounterfactualResponse,
    LedgerTotals,
    utc_now,
)

app = FastAPI(
    title="ClassWatch Actuation & Savings Ledger",
    description="Hardware-agnostic actuation and counterfactual savings service.",
    version="0.1.0",
)

actuator = VirtualActuator()
ledger = SavingsLedger()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "classwatch-actuator",
        "actuator_mode": ACTUATOR_MODE,
    }


@app.post("/actuate", response_model=ActuationResponse)
def actuate(request: ActuationRequest):
    action_id = f"ACT-{uuid4().hex[:8].upper()}"
    timestamp = utc_now()

    success = actuator.execute(
        request.room_id,
        request.device,
        request.action,
    )

    duration = (
        request.duration_minutes
        if request.duration_minutes is not None
        else DEFAULT_SAVED_MINUTES
    )

    # Only switching a device OFF represents avoided energy.
    if request.action.value == "power_off":
        kwh_saved = request.estimated_power_kw * duration / 60
    else:
        kwh_saved = 0.0

    rupees_saved = kwh_saved * ELECTRICITY_RATE_INR_PER_KWH
    co2_saved = kwh_saved * CO2_KG_PER_KWH

    record = {
        "action_id": action_id,
        "room_id": request.room_id,
        "device": request.device,
        "action": request.action.value,
        "reason": request.reason,
        "timestamp": timestamp.isoformat(),
        "status": "success" if success else "failed",
        "estimated_power_kw": request.estimated_power_kw,
        "duration_minutes": duration,
        "kwh_saved": round(kwh_saved, 3),
        "rupees_saved": round(rupees_saved, 2),
        "co2_saved_kg": round(co2_saved, 3),
    }

    ledger.record_action(record)

    return record


@app.get("/actions", response_model=list[ActionRecord])
def get_actions():
    return ledger.actions


@app.get("/ledger", response_model=LedgerTotals)
def get_ledger():
    return ledger.totals()


@app.get(
    "/ledger/counterfactual",
    response_model=CounterfactualResponse,
)
def get_counterfactual():
    return ledger.counterfactual()


@app.get("/devices")
def get_devices():
    return actuator.all_states()


@app.post("/reset")
def reset():
    ledger.reset()
    actuator.device_states.clear()

    return {
        "status": "reset",
        "message": "Actuator state and ledger cleared.",
    }
