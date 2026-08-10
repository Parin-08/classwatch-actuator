// Server-to-server calls to ML / Decision / Actuation services.
// IMPORTANT: every call is wrapped so a downed/half-built teammate service
// never takes down the backend. Log and fall back instead of throwing.

const axios = require("axios");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const DECISION_URL = process.env.DECISION_SERVICE_URL || "http://localhost:8002";
const ACTUATION_URL = process.env.ACTUATION_SERVICE_URL || "http://localhost:8003";

const TIMEOUT_MS = 1500;

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
    // Safe default: never auto-actuate if the decision layer is down —
    // just log, so we don't cut power on unvetted logic.
    return {
      room_id: payload.room_id,
      decision: "log_only",
      explanation: { idle_time_weight: 0, off_schedule_weight: 0, anomaly_weight: 0 },
      confidence: 0,
    };
  }
}

async function actuate({ room_id, action, source, reason }) {
  try {
    const { data } = await axios.post(
      `${ACTUATION_URL}/actuate`,
      { room_id, action, source, reason },
      { timeout: TIMEOUT_MS }
    );
    return data;
  } catch (err) {
    console.warn(`[Actuation /actuate] unavailable, using fallback (${err.message})`);
    return { success: false, room_id, actuated_at: new Date().toISOString(), device_used: "unavailable" };
  }
}

async function getLedger() {
  try {
    const { data } = await axios.get(`${ACTUATION_URL}/ledger`, { timeout: TIMEOUT_MS });
    return data;
  } catch (err) {
    console.warn(`[Actuation /ledger] unavailable, using local fallback (${err.message})`);
    return null; // caller should fall back to local mock ledger
  }
}

module.exports = { getAnomaly, getPrediction, getDecision, actuate, getLedger };
