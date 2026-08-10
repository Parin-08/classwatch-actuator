// In-memory store — no real DB needed for the hackathon.
// This is the single source of truth for live room state on the backend.
// Shape MUST match API_CONTRACT.md section 1 exactly — don't rename fields.

const now = () => new Date().toISOString();

const rooms = {
  R204: {
    room_id: "R204",
    name: "Room 204",
    building: "CSE Block",
    power_watts: 1450,
    occupancy: 0,
    occupancy_count: 0,
    devices: { light: true, fan: true, ac: false, projector: false },
    status: "wasting",
    efficiency_score: 62,
    last_class_end: "2026-08-10T09:00:00Z",
    next_class_start: "2026-08-10T11:00:00Z",
    updated_at: now(),
  },
  R101: {
    room_id: "R101",
    name: "Room 101",
    building: "CSE Block",
    power_watts: 300,
    occupancy: 1,
    occupancy_count: 42,
    devices: { light: true, fan: true, ac: true, projector: true },
    status: "normal",
    efficiency_score: 98,
    last_class_end: "2026-08-10T08:00:00Z",
    next_class_start: "2026-08-10T09:00:00Z",
    updated_at: now(),
  },
  R305: {
    room_id: "R305",
    name: "Room 305",
    building: "ECE Block",
    power_watts: 1800,
    occupancy: 0,
    occupancy_count: 0,
    devices: { light: true, fan: true, ac: true, projector: false },
    status: "flagged",
    efficiency_score: 42,
    last_class_end: "2026-08-10T08:30:00Z",
    next_class_start: "2026-08-10T13:00:00Z",
    updated_at: now(),
  },
  R110: {
    room_id: "R110",
    name: "Room 110",
    building: "ECE Block",
    power_watts: 20,
    occupancy: 0,
    occupancy_count: 0,
    devices: { light: false, fan: false, ac: false, projector: false },
    status: "normal",
    efficiency_score: 100,
    last_class_end: "2026-08-09T17:00:00Z",
    next_class_start: "2026-08-10T14:00:00Z",
    updated_at: now(),
  },
};

// last 50 power readings per room, for GET /rooms/:id and /rooms/:id/history
const history = {};
Object.keys(rooms).forEach((id) => {
  history[id] = Array.from({ length: 20 }).map((_, i) => ({
    t: new Date(Date.now() - (20 - i) * 5 * 60 * 1000).toISOString(),
    watts: rooms[id].power_watts + Math.round((Math.random() - 0.5) * 200),
    occupancy: rooms[id].occupancy,
  }));
});

const timetable = [
  { room_id: "R204", day: "Mon", start: "09:00", end: "10:00", course: "DBMS", faculty_id: "F12", department: "CSE" },
  { room_id: "R204", day: "Mon", start: "11:00", end: "12:00", course: "OS", faculty_id: "F07", department: "CSE" },
  { room_id: "R101", day: "Mon", start: "08:00", end: "09:00", course: "Maths", faculty_id: "F03", department: "CSE" },
  { room_id: "R305", day: "Mon", start: "08:30", end: "09:30", course: "Signals", faculty_id: "F19", department: "ECE" },
];

let alerts = [
  {
    alert_id: "A1029",
    room_id: "R204",
    type: "idle_after_class",
    severity: "medium",
    created_at: now(),
    resolved: false,
    action_taken: "none",
  },
  {
    alert_id: "A1030",
    room_id: "R305",
    type: "occupancy_mismatch",
    severity: "high",
    created_at: now(),
    resolved: false,
    action_taken: "none",
  },
];

let ledger = {
  total_kwh_saved: 142.5,
  total_rupees_saved: 1140,
  total_co2_kg_saved: 116.7,
  events: [],
};

let alertCounter = 1031;
function nextAlertId() {
  return `A${alertCounter++}`;
}

module.exports = { rooms, history, timetable, alerts, ledger, nextAlertId, now };
