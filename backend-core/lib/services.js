// Server-to-server calls to ML / Decision / Actuation services.
// IMPORTANT: every call is wrapped so a downed/half-built teammate service
// never takes down the backend. Log and fall back instead of throwing.

// Server-to-server calls to ML / Decision / Actuation services.
// IMPORTANT: every call is wrapped so a downed/half-built teammate service
// never takes down the backend. Log and fall back instead of throwing.

const axios = require("axios");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const DECISION_URL = process.env.DECISION_SERVICE_URL || "http://localhost:8002";
const ACTUATION_URL = process.env.ACTUATION_SERVICE_URL || "http://localhost:8003";

const TIMEOUT_MS = 4000;

async function getAnomaly({ room_id, power_watts, occupancy, timestamp }) {
  try {
    const { data } = await axios.post(
      `${ML_URL}/anomaly`,
      { room_id, power_watts, occupancy, timestamp },
      { timeout: TIMEOUT_MS }
    );
    return data;
  } catch (err) {
    console.warn(`[ML /anomaly] unavailable, using fallback (${err.message})`);
    return { room_id, is_anomaly: false, anomaly_score: 0, reason: "ml_service_unavailable" };
  }
}

async function getPrediction({ room_id, timestamp, day_of_week }) {
  try {
    const { data } = await axios.post(
      `${ML_URL}/predict`,
      { room_id, timestamp, day_of_week },
      { timeout: TIMEOUT_MS }
    );
    return data;
  } catch (err) {
    console.warn(`[ML /predict] unavailable, using fallback (${err.message})`);
    return { room_id, predicted_watts_next_hour: null, confidence: 0 };
  }
}

async function getDecision(payload) {
  try {
    const { data } = await axios.post(`${DECISION_URL}/decide`, payload, { timeout: TIMEOUT_MS });
    return data;
  } catch (err) {
    console.warn(`[Decision /decide] unavailable, using fallback (${err.message})`);
    return {
      room_id: payload.room_id,
      decision: "log_only",
      explanation: { idle_time_weight: 0, off_schedule_weight: 0, anomaly_weight: 0 },
      confidence: 0,
    };
  }
}

// Shravya's Decision Layer — score + leaderboard
async function getRoomScore(room_id) {
  try {
    const { data } = await axios.get(`${DECISION_URL}/rooms/${room_id}/score`, { timeout: TIMEOUT_MS });
    return data;
  } catch (err) {
    console.warn(`[Decision /rooms/:id/score] unavailable, using fallback (${err.message})`);
    return { room_id, efficiency_score: null, tier: "unknown", flags_this_week: 0, streak_days_clean: 0 };
  }
}

async function getLeaderboard(limit = 5) {
  try {
    const { data } = await axios.get(`${DECISION_URL}/leaderboard`, {
      params: { limit },
      timeout: TIMEOUT_MS,
    });
    return data;
  } catch (err) {
    console.warn(`[Decision /leaderboard] unavailable, using fallback (${err.message})`);
    return { top: [], bottom: [] };
  }
}

// Matches Parin's live actuator contract:
// request:  { room_id, device, action, reason, estimated_power_kw, duration_minutes }
// response: { action_id, room_id, device, action, reason, timestamp, status,
//             estimated_power_kw, duration_minutes, kwh_saved, rupees_saved, co2_saved_kg }
async function actuate({ room_id, device, action, reason, estimated_power_kw, duration_minutes }) {
  try {
    const { data } = await axios.post(
      `${ACTUATION_URL}/actuate`,
      { room_id, device, action, reason, estimated_power_kw, duration_minutes },
      { timeout: TIMEOUT_MS }
    );
    return data;
  } catch (err) {
    console.warn(`[Actuation /actuate] unavailable, using fallback (${err.message})`);
    return {
      action_id: null,
      room_id,
      device,
      action,
      reason,
      timestamp: new Date().toISOString(),
      status: "failed",
      kwh_saved: 0,
      rupees_saved: 0,
      co2_saved_kg: 0,
    };
  }
}

async function getLedger() {
  try {
    const { data } = await axios.get(`${ACTUATION_URL}/ledger`, { timeout: TIMEOUT_MS });
    return data;
  } catch (err) {
    console.warn(`[Actuation /ledger] unavailable, using local fallback (${err.message})`);
    return null;
  }
}

module.exports = {
  getAnomaly,
  getPrediction,
  getDecision,
  getRoomScore,
  getLeaderboard,
  actuate,
  getLedger,
};