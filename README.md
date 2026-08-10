# ClassWatch - Decision Layer Microservice

The **Decision Layer** service acts as the automated "judge" for the ClassWatch classroom energy monitoring system. It receives signals about classrooms (rule-based flags, ML anomaly scores, power predictions, and current power consumption), evaluates deterministic decisions (`auto_actuate`, `notify`, `log_only`), and maintains in-memory weekly efficiency scores and leaderboards.

---

## Startup & Installation

### Requirements
- Python 3.11+

### Installation
Install all dependencies with a single command:
```bash
pip install -r requirements.txt
```

### Running the Server
Start the Uvicorn server on port 8002:
```bash
uvicorn main:app --reload --port 8002
```

### Running Automated Tests
Run the pytest suite to verify all logic, edge cases, and safety rules:
```bash
python -m pytest -v test_main.py
```

---

## Configuration & Constants Rationale

The microservice defines the following constants at the top of `main.py`:

```python
# Scoring Constants
WEIGHT_PER_FLAG = 8          # Penalty deducted from efficiency score per rule flag
STREAK_BONUS_PER_DAY = 2     # Bonus score points awarded per consecutive clean day
MAX_STREAK_BONUS = 20        # Maximum cumulative streak bonus cap

# Decision Thresholds
AUTO_ACTUATE_THRESHOLD = 0.70  # Minimum combined confidence score required for auto_actuate
NOTIFY_THRESHOLD = 0.35        # Minimum combined confidence score required for notify

# Factor Weight Baselines
BASE_IDLE_WEIGHT = 0.50        # Priority weight for direct idle/unoccupied signals
BASE_OFF_SCHEDULE_WEIGHT = 0.30  # Weight for off-schedule power excess gaps
BASE_ANOMALY_WEIGHT = 0.20       # Weight for ML anomaly detection scores
```

### Why These Values Were Chosen
1. **`WEIGHT_PER_FLAG = 8`**: Deducting 8 points per flag allows a room to receive up to 3 flags before dropping into the `warning` tier (score 76). A 4th flag drops the room below 70 into `flagged` (score 68), creating clear, actionable tier separation (`clean`, `notice`, `warning`, `flagged`).
2. **`STREAK_BONUS_PER_DAY = 2` (Max 20)**: Provides positive reinforcement for clean classroom behavior without letting streak bonuses completely mask recent excessive flag penalties.
3. **`AUTO_ACTUATE_THRESHOLD = 0.70` & `NOTIFY_THRESHOLD = 0.35`**: A 0.70 cutoff ensures power cutoffs (`auto_actuate`) are only triggered when multiple high-confidence corroborating signals exist (e.g. idle flag + high power gap). A 0.35 cutoff captures moderate signals for proactive notification before automated power cuts.
4. **`BASE_IDLE_WEIGHT = 0.50`, `BASE_OFF_SCHEDULE_WEIGHT = 0.30`, `BASE_ANOMALY_WEIGHT = 0.20`**: Direct rule-based occupancy/idle flags are the most reliable indicators of wasted power (50%), followed by power gap metrics (30%), while ML anomaly scores serve as auxiliary corroborating signals (20%).

---

## Occupancy-Safety Rule for `auto_actuate`

**Occupancy safety always takes absolute precedence over energy savings.** Power cutoffs (`auto_actuate`) can disrupt classroom activity and pose physical safety risks if occupants are present. Therefore, `auto_actuate` will **NEVER** fire on an ML `anomaly_score` alone without at least one corroborating `rule_flag` confirming that the room is idle or unoccupied. Furthermore, if any input signal indicates room occupancy (such as `"occupied"`, `"class_in_session"`, or `"motion_detected"`), or if input data is ambiguous or missing, the microservice strictly defaults to a non-invasive action (`notify` or `log_only`).

---

## API Endpoints Summary

- **`POST /decide`**: Evaluates room state and returns deterministic decision (`auto_actuate`, `notify`, `log_only`) with weighted explanation breakdown.
- **`GET /rooms/{room_id}/score`**: Retrieves efficiency score, tier, flags this week, and clean streak days.
- **`GET /leaderboard`**: Returns `top` (highest scores) and `bottom` (lowest scores) rooms with deterministic alphabetical tie-breaking.
- **`GET /health`**: Health check returning `{"status": "ok"}`.
- **`POST /rooms/{room_id}/flag`**: *(Internal testing helper only)* Manually increments flag count for local verification.
