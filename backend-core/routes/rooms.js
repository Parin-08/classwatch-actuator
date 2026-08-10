const express = require("express");
const store = require("../lib/store");
const { actuate, getLedger, getRoomScore, getLeaderboard } = require("../lib/services");
function buildRoomsRouter(io) {
  const router = express.Router();
  router.get("/rooms", (req, res) => {
    res.json(Object.values(store.rooms));
  });
  router.get("/rooms/:id", (req, res) => {
    const room = store.rooms[req.params.id];
    if (!room) return res.status(404).json({ error: "room not found" });
    res.json({ ...room, history: (store.history[req.params.id] || []).slice(-50) });
  });
  router.get("/rooms/:id/history", (req, res) => {
    const room = store.rooms[req.params.id];
    if (!room) return res.status(404).json({ error: "room not found" });
    res.json({ room_id: req.params.id, points: store.history[req.params.id] || [] });
  });
  router.get("/rooms/:id/score", async (req, res) => {
    const room = store.rooms[req.params.id];
    if (!room) return res.status(404).json({ error: "room not found" });
    const score = await getRoomScore(req.params.id);
    res.json(score);
  });
  router.get("/leaderboard", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
    const leaderboard = await getLeaderboard(limit);
    res.json(leaderboard);
  });
  router.get("/timetable", (req, res) => {
    res.json(store.timetable);
  });
  router.get("/alerts", (req, res) => {
    const { status } = req.query;
    let result = store.alerts;
    if (status === "active") result = result.filter((a) => !a.resolved);
    res.json(result);
  });
  router.post("/rooms/:id/override", async (req, res) => {
    const room = store.rooms[req.params.id];
    if (!room) return res.status(404).json({ error: "room not found" });
    const { action, device } = req.body || {};
    if (!action) return res.status(400).json({ error: "action is required" });
    const targetDevices = device === "all"
      ? Object.keys(room.devices).filter((d) => room.devices[d])
      : [device];
    const estimatedPowerKw = room.power_watts > 0
      ? +(room.power_watts / 1000 / Math.max(targetDevices.length, 1)).toFixed(2)
      : 0;
    const results = [];
    for (const d of targetDevices) {
      const result = await actuate({
        room_id: room.room_id,
        device: d,
        action,
        reason: "facilities_override",
        estimated_power_kw: estimatedPowerKw,
        duration_minutes: 20,
      });
      results.push(result);
      io.of("/live").emit("actuation:event", result);
    }
    if (action === "power_off") {
      targetDevices.forEach((d) => { room.devices[d] = false; });
      room.power_watts = 0;
      room.status = "normal";
    } else if (action === "power_on") {
      targetDevices.forEach((d) => { room.devices[d] = true; });
    }
    room.updated_at = store.now();
    io.of("/live").emit("room:update", room);
    const ledger = await getLedger();
    if (ledger) {
      io.of("/live").emit("ledger:update", {
        total_kwh_saved: ledger.total_kwh_saved,
        total_rupees_saved: ledger.total_rupees_saved,
        total_co2_kg_saved: ledger.total_co2_saved_kg,
        updated_at: store.now(),
      });
    }
    const allSucceeded = results.every((r) => r.status && r.status !== "failed");
    res.json({
      success: allSucceeded,
      room_id: room.room_id,
      actuated_at: store.now(),
      results,
    });
  });
  return router;
}
module.exports = buildRoomsRouter;