const express = require("express");
const store = require("../lib/store");
const { evaluateRules } = require("../lib/rules");
const { getAnomaly, getPrediction, getDecision, actuate } = require("../lib/services");

function buildIngestRouter(io) {
  const router = express.Router();

  // POST /ingest — internal only, called by the Simulator (or MQTT bridge later)
  router.post("/ingest", async (req, res) => {
    const { room_id, power_watts, occupancy, devices, timestamp } = req.body || {};
    if (!room_id) return res.status(400).json({ error: "room_id is required" });

    const room = store.rooms[room_id];
    if (!room) return res.status(404).json({ error: "unknown room_id" });

    // 1. update live state
    room.power_watts = power_watts ?? room.power_watts;
    room.occupancy = occupancy ?? room.occupancy;
    room.occupancy_count = occupancy ? room.occupancy_count : 0;
    if (devices) room.devices = { ...room.devices, ...devices };
    room.updated_at = timestamp || store.now();

    store.history[room_id] = store.history[room_id] || [];
    store.history[room_id].push({ t: room.updated_at, watts: room.power_watts, occupancy: room.occupancy });
    if (store.history[room_id].length > 50) store.history[room_id].shift();

    // 2. run rules engine
    const ruleFlags = evaluateRules(room);

    // 3. call ML service (anomaly + forecast) — both fall back gracefully
    const dayOfWeek = new Date(room.updated_at).toLocaleDateString("en-US", { weekday: "short" });
    const [anomaly, prediction] = await Promise.all([
      getAnomaly({ room_id, power_watts: room.power_watts, occupancy: room.occupancy, timestamp: room.updated_at }),
      getPrediction({ room_id, timestamp: room.updated_at, day_of_week: dayOfWeek }),
    ]);

    // 4. call Decision Layer if anything looks off
    let decision = null;
    if (ruleFlags.length > 0 || anomaly.is_anomaly) {
      decision = await getDecision({
        room_id,
        rule_flags: ruleFlags,
        anomaly,
        prediction,
        current_power: room.power_watts,
      });

      // create/update alert
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

      // 5. auto-actuate if the decision layer says so
      if (decision.decision === "auto_actuate") {
        const actResult = await actuate({ room_id, action: "power_off", source: "auto", reason: ruleFlags[0] || "anomaly" });
        Object.keys(room.devices).forEach((d) => (room.devices[d] = false));
        room.power_watts = 0;
        io.of("/live").emit("actuation:event", { room_id, action: "power_off", source: "auto", timestamp: store.now() });
      }
    } else {
      room.status = "normal";
    }

    // 6. push live update regardless
    io.of("/live").emit("room:update", room);

    res.json({ success: true, room_id, rule_flags: ruleFlags, anomaly, prediction, decision });
  });

  return router;
}

module.exports = buildIngestRouter;
