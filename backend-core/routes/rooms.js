const express = require("express");
const store = require("../lib/store");
const { actuate } = require("../lib/services");

function buildRoomsRouter(io) {
  const router = express.Router();

  // GET /rooms
  router.get("/rooms", (req, res) => {
    res.json(Object.values(store.rooms));
  });

  // GET /rooms/:id  (single room + history)
  router.get("/rooms/:id", (req, res) => {
    const room = store.rooms[req.params.id];
    if (!room) return res.status(404).json({ error: "room not found" });
    res.json({ ...room, history: (store.history[req.params.id] || []).slice(-50) });
  });

  // GET /rooms/:id/history?range=7d
  router.get("/rooms/:id/history", (req, res) => {
    const room = store.rooms[req.params.id];
    if (!room) return res.status(404).json({ error: "room not found" });
    res.json({ room_id: req.params.id, points: store.history[req.params.id] || [] });
  });

  // GET /timetable
  router.get("/timetable", (req, res) => {
    res.json(store.timetable);
  });

  // GET /alerts?status=active
  router.get("/alerts", (req, res) => {
    const { status } = req.query;
    let result = store.alerts;
    if (status === "active") result = result.filter((a) => !a.resolved);
    res.json(result);
  });

  // POST /rooms/:id/override  — manual human action from dashboard
  router.post("/rooms/:id/override", async (req, res) => {
    const room = store.rooms[req.params.id];
    if (!room) return res.status(404).json({ error: "room not found" });

    const { action, device } = req.body || {};
    if (!action) return res.status(400).json({ error: "action is required" });

    const result = await actuate({
      room_id: room.room_id,
      action,
      source: "manual",
      reason: "facilities_override",
    });

    // reflect the override locally so /rooms stays consistent even if
    // the actuation service is a stub
    if (action === "power_off") {
      Object.keys(room.devices).forEach((d) => {
        if (device === "all" || device === d) room.devices[d] = false;
      });
      room.power_watts = 0;
      room.status = "normal";
    }
    room.updated_at = store.now();

    io.of("/live").emit("room:update", room);
    io.of("/live").emit("actuation:event", {
      room_id: room.room_id,
      action,
      source: "manual",
      timestamp: store.now(),
    });

    res.json({
      success: result.success !== false,
      room_id: room.room_id,
      actuated_at: result.actuated_at || store.now(),
    });
  });

  return router;
}

module.exports = buildRoomsRouter;
