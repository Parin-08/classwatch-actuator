/**
 * roomService.js
 *
 * Data-access layer for room information.
 * Checks VITE_USE_MOCK to decide between mock data and live API calls.
 *
 * Live API assumed shape:
 *   GET  /rooms         → Room[]
 *   GET  /rooms/:id     → Room
 *   GET  /rooms/:id/history → { history: HistoryPoint[] }
 */

import axios from 'axios'
import { MOCK_ROOMS, MOCK_ALERTS, generateMockHistory } from '../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Rooms ───────────────────────────────────────────────────────────────────

/**
 * Fetch all rooms.
 * @returns {Promise<Room[]>}
 */
export async function fetchRooms() {
  if (USE_MOCK) {
    // Simulate a small network latency so loading state is visible
    await delay(400)
    return structuredClone(MOCK_ROOMS)
  }
  const { data } = await api.get('/rooms')
  return data
}

/**
 * Fetch a single room by ID.
 * @param {string} roomId
 * @returns {Promise<Room>}
 */
export async function fetchRoom(roomId) {
  if (USE_MOCK) {
    await delay(100)
    const room = MOCK_ROOMS.find((r) => r.room_id === roomId)
    if (!room) throw new Error(`Room ${roomId} not found in mock data`)
    return structuredClone(room)
  }
  const { data } = await api.get(`/rooms/${roomId}`)
  return data
}

// ─── History ─────────────────────────────────────────────────────────────────

/**
 * Fetch power+occupancy history for a room.
 * @param {string} roomId
 * @returns {Promise<HistoryPoint[]>}  Array of { t: ISO, watts: number, occupancy: number }
 */
export async function fetchRoomHistory(roomId) {
  if (USE_MOCK) {
    await delay(150)
    const room = MOCK_ROOMS.find((r) => r.room_id === roomId)
    if (!room) return []
    return generateMockHistory(room)
  }
  const { data } = await api.get(`/rooms/${roomId}/history`)
  return data.history ?? data
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

/**
 * Fetch current alerts.
 * @returns {Promise<Alert[]>}
 */
export async function fetchAlerts() {
  if (USE_MOCK) {
    await delay(200)
    return structuredClone(MOCK_ALERTS)
  }
  const { data } = await api.get('/alerts')
  return data
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms))
}

export { USE_MOCK }
