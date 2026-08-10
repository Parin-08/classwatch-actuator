/**
 * mockData.js
 *
 * Canonical mock room definitions — easy to swap out for a real API call.
 * Swap: set VITE_USE_MOCK=false and wire roomService.js to your real endpoint.
 */

export const MOCK_ROOMS = [
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
  },
]

/**
 * Generates a plausible 30-point power history for a room over the past 2.5 hours.
 * Uses the room_id as a seed for consistency across renders.
 * Shape: Array<{ t: ISO string, watts: number, occupancy: number }>
 */
export function generateMockHistory(room) {
  const now = Date.now()
  const INTERVAL_MS = 5 * 60 * 1000 // 5-minute buckets
  const POINTS = 30

  // Deterministic-ish jitter seed from room_id chars
  const seed = room.room_id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const pseudoRand = (i) => {
    const x = Math.sin(seed + i * 9301 + 49297) * 233280
    return x - Math.floor(x)
  }

  const baseWatts = room.power_watts

  return Array.from({ length: POINTS }, (_, i) => {
    const t = new Date(now - (POINTS - 1 - i) * INTERVAL_MS).toISOString()

    // Simulate a power ramp: rising at class start, dropping when class ends
    const phase = i / POINTS
    let watts
    if (phase < 0.3) {
      // Warming up / standby
      watts = baseWatts * 0.3 + pseudoRand(i) * baseWatts * 0.15
    } else if (phase < 0.7) {
      // Peak usage
      watts = baseWatts * (0.75 + pseudoRand(i) * 0.35)
    } else {
      // Cooling down / idle
      watts = baseWatts * (0.6 + pseudoRand(i) * 0.25)
    }

    // Current point anchors to actual live value
    if (i === POINTS - 1) watts = baseWatts

    const occupancy =
      i === POINTS - 1
        ? room.occupancy_count
        : Math.round(room.occupancy_count * (0.7 + pseudoRand(i + 100) * 0.6))

    return { t, watts: Math.round(watts), occupancy: Math.max(0, occupancy) }
  })
}

/** Pre-built mock alerts seeded from the mock rooms */
export const MOCK_ALERTS = [
  {
    id: 'alert-1',
    room_id: 'R305',
    severity: 'critical',
    message: 'All devices running with 0 occupancy for 85 min — 2.1 kW wasted.',
    ts: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-2',
    room_id: 'R204',
    severity: 'warning',
    message: 'AC + lights on, no students detected. Efficiency: 62.',
    ts: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-3',
    room_id: 'R401',
    severity: 'warning',
    message: 'AC running 90 min past last class. Consider auto-off.',
    ts: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-4',
    room_id: 'R101',
    severity: 'info',
    message: 'Room 101 operating within normal parameters. Score: 94.',
    ts: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
]
