import json
from pathlib import Path

DATA_DIR = Path("data")
LEDGER_FILE = DATA_DIR / "ledger.json"


class SavingsLedger:
    def __init__(self):
        DATA_DIR.mkdir(exist_ok=True)
        self.actions: list[dict] = []
        self._load()

    def _load(self):
        if not LEDGER_FILE.exists():
            return

        try:
            data = json.loads(LEDGER_FILE.read_text())
            self.actions = data.get("actions", [])
        except (json.JSONDecodeError, OSError):
            self.actions = []

    def _save(self):
        LEDGER_FILE.write_text(
            json.dumps({"actions": self.actions}, indent=2)
        )

    def record_action(self, record: dict) -> dict:
        self.actions.append(record)
        self._save()
        return record

    def successful_actions(self) -> list[dict]:
        return [
            action
            for action in self.actions
            if action["status"] == "success"
        ]

    def totals(self) -> dict:
        actions = self.successful_actions()

        kwh = sum(a["kwh_saved"] for a in actions)
        rupees = sum(a["rupees_saved"] for a in actions)
        co2 = sum(a["co2_saved_kg"] for a in actions)

        return {
            "total_kwh_saved": round(kwh, 3),
            "total_rupees_saved": round(rupees, 2),
            "total_co2_saved_kg": round(co2, 3),
            "total_actions": len(actions),
        }

    def counterfactual(self) -> dict:
        """
        Counterfactual model:

        baseline = actual energy + energy avoided by ClassWatch

        This represents the estimated consumption if ClassWatch had
        not performed its successful power-off actions.
        """

        totals = self.totals()
        saved = totals["total_kwh_saved"]

        # For the standalone service, actual consumption is not measured
        # by a physical meter yet. We therefore represent the avoided
        # energy separately and use the baseline relationship:
        #
        # baseline = actual + avoided
        #
        # A future smart-meter integration can replace actual_kwh with
        # measured data without changing the API contract.

        actual_kwh = sum(
            a["estimated_power_kw"] * a["duration_minutes"] / 60
            for a in self.successful_actions()
        )

        baseline_kwh = actual_kwh + saved

        percentage = (
            (saved / baseline_kwh) * 100
            if baseline_kwh > 0
            else 0
        )

        return {
            "period_days": 30,
            "baseline_kwh": round(baseline_kwh, 3),
            "actual_kwh": round(actual_kwh, 3),
            "saved_kwh": round(saved, 3),
            "savings_percentage": round(percentage, 2),
            "saved_rupees": totals["total_rupees_saved"],
            "saved_co2_kg": totals["total_co2_saved_kg"],
        }

    def reset(self):
        self.actions = []
        self._save()
