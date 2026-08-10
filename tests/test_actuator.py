from fastapi.testclient import TestClient

from app.main import app, ledger, actuator

client = TestClient(app)


def setup_function():
    ledger.reset()
    actuator.device_states.clear()


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["actuator_mode"] == "virtual"


def test_power_off_creates_savings():
    response = client.post(
        "/actuate",
        json={
            "room_id": "204",
            "device": "ac",
            "action": "power_off",
            "reason": "occupancy_mismatch",
            "estimated_power_kw": 1.2,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert data["action"] == "power_off"
    assert data["kwh_saved"] == 0.4
    assert data["rupees_saved"] == 3.2
    assert data["co2_saved_kg"] == 0.316


def test_power_on_creates_no_savings():
    response = client.post(
        "/actuate",
        json={
            "room_id": "204",
            "device": "ac",
            "action": "power_on",
            "reason": "class_starting",
            "estimated_power_kw": 1.2,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert data["action"] == "power_on"
    assert data["kwh_saved"] == 0.0
    assert data["rupees_saved"] == 0.0
    assert data["co2_saved_kg"] == 0.0


def test_device_state_changes():
    response = client.post(
        "/actuate",
        json={
            "room_id": "105",
            "device": "lights",
            "action": "power_off",
            "reason": "empty_room",
            "estimated_power_kw": 0.5,
        },
    )

    assert response.status_code == 200

    states = client.get("/devices").json()

    assert states["105:lights"] == "power_off"


def test_ledger_accumulates_multiple_actions():
    payload = {
        "room_id": "204",
        "device": "ac",
        "action": "power_off",
        "reason": "occupancy_mismatch",
        "estimated_power_kw": 1.2,
    }

    first = client.post("/actuate", json=payload)
    second = client.post("/actuate", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200

    ledger_response = client.get("/ledger")

    assert ledger_response.status_code == 200

    data = ledger_response.json()

    assert data["total_actions"] == 2
    assert data["total_kwh_saved"] == 0.8
    assert data["total_rupees_saved"] == 6.4
    assert data["total_co2_saved_kg"] == 0.632


def test_counterfactual():
    client.post(
        "/actuate",
        json={
            "room_id": "204",
            "device": "ac",
            "action": "power_off",
            "reason": "idle_after_class",
            "estimated_power_kw": 1.2,
        },
    )

    response = client.get("/ledger/counterfactual")

    assert response.status_code == 200

    data = response.json()

    assert data["baseline_kwh"] == 0.8
    assert data["actual_kwh"] == 0.4
    assert data["saved_kwh"] == 0.4
    assert data["savings_percentage"] == 50.0


def test_invalid_action_is_rejected():
    response = client.post(
        "/actuate",
        json={
            "room_id": "204",
            "device": "ac",
            "action": "explode",
            "reason": "test",
            "estimated_power_kw": 1.2,
        },
    )

    assert response.status_code == 422
