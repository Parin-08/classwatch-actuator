const express = require("express");
const axios = require("axios");

const DECISION_URL = process.env.DECISION_SERVICE_URL || "http://localhost:8002";
const ACTUATION_URL = process.env.ACTUATION_SERVICE_URL || "http://localhost:8003";
const TIMEOUT_MS = 1500;

function buildProxyRouter() {
  const router = express.Router();

  router.get("/leaderboard", async (req, res) => {
    try {
      const { data } = await axios.get(`${DECISION_URL}/leaderboard`, { timeout: TIMEOUT_MS });
      res.json(data);
    } catch (err) {
      console.warn(`[proxy /leaderboard] decision service unavailable (${err.message})`);
      res.status(502).json({ error: "decision service unavailable", top: [], bottom: [] });
    }
  });

  router.get("/rooms/:id/score", async (req, res) => {
    try {
      const { data } = await axios.get(`${DECISION_URL}/rooms/${req.params.id}/score`, { timeout: TIMEOUT_MS });
      res.json(data);
    } catch (err) {
      console.warn(`[proxy /rooms/:id/score] decision service unavailable (${err.message})`);
      res.status(502).json({ error: "decision service unavailable" });
    }
  });

  router.get("/ledger", async (req, res) => {
    try {
      const { data } = await axios.get(`${ACTUATION_URL}/ledger`, { timeout: TIMEOUT_MS });
      res.json(data);
    } catch (err) {
      console.warn(`[proxy /ledger] actuation service unavailable (${err.message})`);
      res.status(502).json({ error: "actuation service unavailable", total_kwh_saved: 0, total_rupees_saved: 0, total_co2_kg_saved: 0, events: [] });
    }
  });

  return router;
}

module.exports = buildProxyRouter;