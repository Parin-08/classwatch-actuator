"""
Unit and Integration Tests for ClassWatch Decision Layer Microservice
"""

import pytest
from fastapi.testclient import TestClient
from main import app, ROOMS_DB, DECISION_LOGS, RoomRecord

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_in_memory_state():
    """Reset in-memory data structures before each test."""
    ROOMS_DB.clear()
    DECISION_LOGS.clear()


# ============================================================================
# 1. HEALTH CHECK TEST
# ============================================================================

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ============================================================================
# 2. NORMAL DECISION FLOW & EXACT JSON SHAPE
# ============================================================================

def test_decide_normal_auto_actuate_flow():
    payload = {
        "room_id": "R204",
        "rule_flags": ["idle_after_class"],
        "anomaly": {"is_anomaly": False, "anomaly_score": 0.2},
        "prediction": {"predicted_watts_next_hour": 300},
        "current_power": 1450,
    }

    response = client.post("/decide", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Exact field names and types validation
    assert data["room_id"] == "R204"
    assert data["decision"] in ["notify", "auto_actuate", "log_only"]
    assert "explanation" in data
    explanation = data["explanation"]
    assert "idle_time_weight" in explanation
    assert "off_schedule_weight" in explanation
    assert "anomaly_weight" in explanation
    assert "confidence" in data

    # Check weight sum equals 1.0 (or very close within float precision)
    total_weight = (
        explanation["idle_time_weight"]
        + explanation["off_schedule_weight"]
        + explanation["anomaly_weight"]
    )
    assert pytest.approx(total_weight, abs=0.01) == 1.0

    # High power gap + idle flag should trigger auto_actuate
    assert data["decision"] == "auto_actuate"
    assert data["confidence"] >= 0.70


def test_decide_notify_and_log_only_flows():
    # Weak signal -> log_only or notify
    payload_weak = {
        "room_id": "R101",
        "rule_flags": [],
        "anomaly": {"is_anomaly": False, "anomaly_score": 0.05},
        "prediction": {"predicted_watts_next_hour": 500},
        "current_power": 510,
    }
    resp_weak = client.post("/decide", json=payload_weak)
    assert resp_weak.status_code == 200
    assert resp_weak.json()["decision"] == "log_only"


# ============================================================================
# 3. SAFETY RULES & GUARDRAILS
# ============================================================================

def test_safety_rule_anomaly_alone_never_auto_actuates():
    """
    CRITICAL SAFETY RULE:
    auto_actuate must never fire on anomaly_score alone without at least one corroborating rule_flag.
    """
    payload_high_anomaly_no_flags = {
        "room_id": "R305",
        "rule_flags": [],  # No corroborating rule flag
        "anomaly": {"is_anomaly": True, "anomaly_score": 0.99},
        "prediction": {"predicted_watts_next_hour": 200},
        "current_power": 1800,
    }

    response = client.post("/decide", json=payload_high_anomaly_no_flags)
    assert response.status_code == 200
    data = response.json()

    # MUST NOT be auto_actuate
    assert data["decision"] != "auto_actuate"
    assert data["decision"] in ["notify", "log_only"]


def test_safety_rule_occupied_room_never_auto_actuates():
    """
    Occupancy safety should always take precedence over energy savings.
    If occupied flag is present, never auto_actuate.
    """
    payload_occupied = {
        "room_id": "R306",
        "rule_flags": ["occupied", "off_schedule_high_power"],
        "anomaly": {"is_anomaly": True, "anomaly_score": 0.9},
        "prediction": {"predicted_watts_next_hour": 100},
        "current_power": 2500,
    }

    response = client.post("/decide", json=payload_occupied)
    assert response.status_code == 200
    data = response.json()

    # MUST NOT be auto_actuate
    assert data["decision"] != "auto_actuate"
    assert data["decision"] == "notify"


# ============================================================================
# 4. MISSING / INVALID INPUT HANDLING (HTTP 422)
# ============================================================================

def test_missing_required_field_triggers_422():
    # Missing current_power
    invalid_payload = {
        "room_id": "R204",
        "rule_flags": ["idle_after_class"],
        "anomaly": {"is_anomaly": False, "anomaly_score": 0.2},
        "prediction": {"predicted_watts_next_hour": 300},
    }
    response = client.post("/decide", json=invalid_payload)
    assert response.status_code == 422
    assert "detail" in response.json()


def test_out_of_range_anomaly_score_triggers_422():
    # anomaly_score > 1.0
    invalid_payload = {
        "room_id": "R204",
        "rule_flags": [],
        "anomaly": {"is_anomaly": True, "anomaly_score": 1.5},
        "prediction": {"predicted_watts_next_hour": 300},
        "current_power": 1000,
    }
    response = client.post("/decide", json=invalid_payload)
    assert response.status_code == 422


# ============================================================================
# 5. TIER BOUNDARY EDGE CASES (0, 1, 2-3, 4+ FLAGS) & UNSEEN ROOMS
# ============================================================================

def test_unseen_room_initializes_clean():
    response = client.get("/rooms/R999/score")
    assert response.status_code == 200
    assert response.json() == {
        "room_id": "R999",
        "efficiency_score": 100,
        "tier": "clean",
        "flags_this_week": 0,
        "streak_days_clean": 0,
    }


def test_tier_boundary_edge_cases():
    # 0 flags -> clean (score 100)
    resp0 = client.get("/rooms/R100/score")
    assert resp0.json()["tier"] == "clean"
    assert resp0.json()["efficiency_score"] == 100

    # 1 flag -> notice (score 92)
    client.post("/rooms/R101/flag")
    resp1 = client.get("/rooms/R101/score")
    assert resp1.json()["tier"] == "notice"
    assert resp1.json()["flags_this_week"] == 1
    assert resp1.json()["efficiency_score"] == 92

    # 2 flags -> warning (score 84)
    client.post("/rooms/R102/flag", params={"count": 2})
    resp2 = client.get("/rooms/R102/score")
    assert resp2.json()["tier"] == "warning"
    assert resp2.json()["flags_this_week"] == 2
    assert resp2.json()["efficiency_score"] == 84

    # 3 flags -> warning (score 76)
    client.post("/rooms/R103/flag", params={"count": 3})
    resp3 = client.get("/rooms/R103/score")
    assert resp3.json()["tier"] == "warning"
    assert resp3.json()["flags_this_week"] == 3
    assert resp3.json()["efficiency_score"] == 76

    # 4 flags -> flagged (score 68)
    client.post("/rooms/R104/flag", params={"count": 4})
    resp4 = client.get("/rooms/R104/score")
    assert resp4.json()["tier"] == "flagged"
    assert resp4.json()["flags_this_week"] == 4
    assert resp4.json()["efficiency_score"] == 68


# ============================================================================
# 6. LEADERBOARD SORTING & DETERMINISTIC TIE-BREAKING
# ============================================================================

def test_leaderboard_sorting_and_tied_scores():
    # Initialize rooms with tied efficiency scores
    # Rooms R-B and R-A both have 0 flags (score 100)
    client.get("/rooms/R-B/score")
    client.get("/rooms/R-A/score")

    # Rooms R-D and R-C both have 2 flags (score 84)
    client.post("/rooms/R-D/flag", params={"count": 2})
    client.post("/rooms/R-C/flag", params={"count": 2})

    response = client.get("/leaderboard", params={"limit": 5})
    assert response.status_code == 200
    data = response.json()

    top_ids = [item["room_id"] for item in data["top"]]
    bottom_ids = [item["room_id"] for item in data["bottom"]]

    # Top tied rooms (R-A and R-B score 100) must be sorted alphabetically: R-A before R-B
    assert top_ids[0] == "R-A"
    assert top_ids[1] == "R-B"

    # Bottom tied rooms (R-C and R-D score 84) sorted alphabetically: R-C before R-D
    assert bottom_ids[0] == "R-C"
    assert bottom_ids[1] == "R-D"
