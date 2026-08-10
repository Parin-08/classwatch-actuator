const express = require("express");
const store = require("../lib/store");
const { evaluateRules } = require("../lib/rules");
const { getAnomaly, getPrediction, getDecision, actuate, getLedger } = require("../lib/services");

function buildIngestRouter(io) {
  const router = express.Router();

  router.post("/ingest", async (req, res) => {
    const { room_id, power_watts, occupancy, devices, timestamp } = req.body || {};
    if (!room_id) return res.status(400).json({ error: "room_id is required" });

    const room = store.rooms[room_id];
    if (!room) return res.status(404).json({ error: "unknown room_id" });

    room.power_watts = power_watts ?? room.power_watts;
    room.occupancy = occupancy ?? room.occupancy;
    room.occupancy_count = occupancy ? room.occupancy_count : 0;
    if (devices) room.devices = { ...room.devices, ...devices };
    room.updated_at = timestamp || store.now();

    store.history[room_id] = store.history[room_id] || [];
    store.history[room_id].push({ t: room.updated_at, watts: room.power_watts, occupancy: room.occupancy });
    if (store.history[room_id].length > 50) store.history[room_id].shift();

    const ruleFlags = evaluateRules(room);

    const dayOfWeek = new Date(room.updated_at).toLocaleDateString("en-US", { weekday: "short" });
    const [anomaly, prediction] = await Promise.all([
      getAnomaly({ room_id, power_watts: room.power_watts, occupancy: room.occupancy, timestamp: room.updated_at }),
      getPrediction({ room_id, timestamp: room.updated_at, day_of_week: dayOfWeek }),
    ]);

    let decision = null;
    if (ruleFlags.length > 0 || anomaly.is_anomaly) {
      decision = await getDecision({
        room_id,
        rule_flags: ruleFlags,
        anomaly,
        prediction,
        current_power: room.power_watts,
      });

      const alert = {
        alert_id: store.nextAlertId(),
        room_id,
        type: ruleFlags[0] || "anomaly",
        severity: anomaly.is_anomaly ? "high" : ruleFlags.length > 1 ? "medium" : "low",
        created_at: store.now(),
        resolved: false,
        action_taken: decision.decision === "auto_actuate" ? "auto_actuated" : decision.decision === "notify" ? "notified" : "none",
      };
      store.alerts.push(alert);
      io.of("/live").emit("alert:new", alert);

      room.status = decision.decision === "auto_actuate" ? "flagged" : "wasting";

      // NOTE: Parin's live /actuate takes ONE device per call (device, action,
      // reason, estimated_power_kw, duration_minutes) — not a whole-room "all"
      // toggle like the original contract. So we call it once per device
      // that's currently on, and emit one actuation:event per call.
      if (decision.decision === "auto_actuate") {
        const devicesOn = Object.keys(room.devices).filter((d) => room.devices[d]);
        const estimatedPowerKw = room.power_watts > 0 ? +(room.power_watts / 1000 / Math.max(devicesOn.length, 1)).toFixed(2) : 0;

        for (const device of devicesOn) {
          const actResult = await actuate({
            room_id,
            device,
            action: "power_off",
            reason: ruleFlags[0] || "anomaly",
            estimated_power_kw: estimatedPowerKw,
            duration_minutes: 20,
          });
          room.devices[device] = false;
          io.of("/live").emit("actuation:event", actResult);
        }
        room.power_watts = 0;

        const ledger = await getLedger();
        if (ledger) {
          io.of("/live").emit("ledger:update", {
            total_kwh_saved: ledger.total_kwh_saved,
            total_rupees_saved: ledger.total_rupees_saved,
            total_co2_kg_saved: ledger.total_co2_kg_saved,
            updated_at: store.now(),
          });
        }
      }
    } else {
      room.status = "normal";
    }

    io.of("/live").emit("room:update", room);

    res.json({ success: true, room_id, rule_flags: ruleFlags, anomaly, prediction, decision });
  });

  return router;
}

module.exports = buildIngestRouter;