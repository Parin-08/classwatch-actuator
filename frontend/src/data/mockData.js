/**
 * mockData.js — Swap this file (or set VITE_USE_MOCK=false) to connect a real backend.
 * Each room has a `history` array of 20 synthetic data points spanning the last 20 minutes.
 */

/** Generate a synthetic power history for a room */
function generateHistory(basePower, occupancy) {
  const now = Date.now()
  return Array.from({ length: 20 }, (_, i) => {
    const t = new Date(now - (19 - i) * 60 * 1000).toISOString()
    // Slight random walk around basePower; occupied rooms dip during breaks
    const jitter = (Math.random() - 0.5) * basePower * 0.12
    const watts = Math.max(10, Math.round(basePower + jitter))
    return { t, watts, occupancy }
  })
}

/** @type {import('../services/roomService').Room[]} */
export const rooms = [
  {
    room_id: 'R101',
    name: 'Room 101',
    building: 'CSE Block',
    power_watts: 180,
    occupancy: 1,
    occupancy_count: 32,
    devices: { light: true, fan: true, ac: false, projector: true },
    status: 'normal',
    efficiency_score: 94,
    last_class_end: '2026-08-10T11:00:00Z',
    next_class_start: '2026-08-10T12:00:00Z',
    updated_at: '2026-08-10T09:22:00Z',
    history: generateHistory(180, 32),
  },
  {
    room_id: 'R204',
    name: 'Room 204',
    building: 'CSE Block',
    power_watts: 1450,
    occupancy: 0,
    occupancy_count: 0,
    devices: { light: true, fan: true, ac: false, projector: false },
    status: 'wasting',
    efficiency_score: 62,
    last_class_end: '2026-08-10T09:00:00Z',
    next_class_start: '2026-08-10T11:00:00Z',
    updated_at: '2026-08-10T09:22:00Z',
    history: generateHistory(1450, 0),
  },
  {
    room_id: 'R305',
    name: 'Room 305',
    building: 'ECE Block',
    power_watts: 2100,
    occupancy: 0,
    occupancy_count: 0,
    devices: { light: true, fan: true, ac: true, projector: true },
    status: 'flagged',
    efficiency_score: 38,
    last_class_end: '2026-08-10T08:00:00Z',
    next_class_start: '2026-08-10T14:00:00Z',
    updated_at: '2026-08-10T09:22:00Z',
    history: generateHistory(2100, 0),
  },
  {
    room_id: 'R102',
    name: 'Room 102',
    building: 'CSE Block',
    power_watts: 40,
    occupancy: 0,
    occupancy_count: 0,
    devices: { light: false, fan: false, ac: false, projector: false },
    status: 'normal',
    efficiency_score: 100,
    last_class_end: '2026-08-10T08:00:00Z',
    next_class_start: '2026-08-10T13:00:00Z',
    updated_at: '2026-08-10T09:22:00Z',
    history: generateHistory(40, 0),
  },
  {
    room_id: 'R210',
    name: 'Room 210',
    building: 'CSE Block',
    power_watts: 980,
    occupancy: 1,
    occupancy_count: 45,
    devices: { light: true, fan: true, ac: true, projector: true },
    status: 'normal',
    efficiency_score: 88,
    last_class_end: '2026-08-10T10:00:00Z',
    next_class_start: '2026-08-10T11:00:00Z',
    updated_at: '2026-08-10T09:22:00Z',
    history: generateHistory(980, 45),
  },
  {
    room_id: 'R401',
    name: 'Room 401',
    building: 'ECE Block',
    power_watts: 1600,
    occupancy: 0,
    occupancy_count: 0,
    devices: { light: true, fan: false, ac: true, projector: false },
    status: 'wasting',
    efficiency_score: 55,
    last_class_end: '2026-08-10T09:30:00Z',
    next_class_start: '2026-08-10T12:00:00Z',
    updated_at: '2026-08-10T09:22:00Z',
    history: generateHistory(1600, 0),
  },
]

/** Mock alert feed — used to seed the sidebar */
export const mockAlerts = [
  {
    id: 'a1',
    room_id: 'R305',
    message: 'AC + projector running 90 min after last class ended.',
    severity: 'critical',
    ts: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'a2',
    room_id: 'R204',
    message: 'Lights & fan on — no occupancy detected for 2h 22m.',
    severity: 'warning',
    ts: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'a3',
    room_id: 'R401',
    message: 'AC running at full load with zero occupants.',
    severity: 'warning',
    ts: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
  },
]
