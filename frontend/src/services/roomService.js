/**
 * roomService.js
 * ──────────────
 * Thin data-source abstraction. Reads VITE_USE_MOCK from the environment:
 *   VITE_USE_MOCK=true  → returns mockData.js directly (no network)
 *   VITE_USE_MOCK=false → calls axios.get("http://localhost:4000/rooms")
 *
 * Components never import mockData.js directly — they always go through here.
 * To swap to a real backend, simply set VITE_USE_MOCK=false in .env.
 */

import axios from 'axios'
import { rooms as mockRooms } from '../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 8000,
})

/**
 * Fetch the current room list.
 * @returns {Promise<Room[]>}
 */
export async function fetchRooms() {
  if (USE_MOCK) {
    // Simulate a tiny async delay so usage feels realistic
    await new Promise(r => setTimeout(r, 120))
    return mockRooms
  }
  const { data } = await api.get('/rooms')
  return data
}

/**
 * Fetch history for a single room.
 * @param {string} roomId
 * @returns {Promise<HistoryPoint[]>}
 */
export async function fetchRoomHistory(roomId) {
  if (USE_MOCK) {
    const room = mockRooms.find(r => r.room_id === roomId)
    await new Promise(r => setTimeout(r, 80))
    return room ? room.history : []
  }
  const { data } = await api.get(`/rooms/${roomId}/history`)
  return data
}

export { USE_MOCK }
