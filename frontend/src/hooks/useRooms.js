/**
 * useRooms.js
 * ───────────
 * Central state hook for all room data + alerts.
 *
 * Mock mode:
 *   - Loads rooms from roomService (which reads mockData.js)
 *   - Every 5 s, jitters power_watts ±8% to simulate live telemetry
 *   - Appends new history data point each tick
 *
 * Live mode:
 *   - Loads rooms via axios from /rooms
 *   - Wires socket.io events: room:update patches state, alert:new appends alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchRooms } from '../services/roomService'
import { connectSocket, onRoomUpdate, onAlertNew, disconnectSocket } from '../services/socketService'
import { mockAlerts } from '../data/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/** Deterministically jitter a room's wattage ±8% */
function jitterRoom(room) {
  const delta = (Math.random() - 0.5) * room.power_watts * 0.08
  const newWatts = Math.max(5, Math.round(room.power_watts + delta))
  const newPoint = {
    t: new Date().toISOString(),
    watts: newWatts,
    occupancy: room.occupancy_count,
  }
  return {
    ...room,
    power_watts: newWatts,
    updated_at: new Date().toISOString(),
    history: [...(room.history || []).slice(-39), newPoint],
  }
}

export function useRooms() {
  const [rooms, setRooms] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  /** Patch a single room by room_id (used by socket handler) */
  const patchRoom = useCallback((updatedRoom) => {
    setRooms(prev =>
      prev.map(r => r.room_id === updatedRoom.room_id ? { ...r, ...updatedRoom } : r)
    )
  }, [])

  /** Add a new alert to the feed */
  const addAlert = useCallback((alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 50))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await fetchRooms()
        if (!cancelled) {
          setRooms(data)
          setAlerts(mockAlerts)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    if (USE_MOCK) {
      // Simulate live telemetry with periodic jitter
      intervalRef.current = setInterval(() => {
        setRooms(prev => prev.map(jitterRoom))
      }, 5000)
    } else {
      // Wire up real socket
      connectSocket()
      const offRoomUpdate = onRoomUpdate(patchRoom)
      const offAlertNew = onAlertNew(addAlert)

      return () => {
        cancelled = true
        offRoomUpdate()
        offAlertNew()
        disconnectSocket()
      }
    }

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [patchRoom, addAlert])

  /** Derived global stats */
  const totalPower = rooms.reduce((sum, r) => sum + r.power_watts, 0)
  const flaggedCount = rooms.filter(r => r.status === 'flagged').length
  const wastingCount = rooms.filter(r => r.status === 'wasting').length
  const avgEfficiency = rooms.length
    ? Math.round(rooms.reduce((s, r) => s + r.efficiency_score, 0) / rooms.length)
    : 0
  const occupiedCount = rooms.filter(r => r.occupancy === 1).length

  return {
    rooms,
    alerts,
    loading,
    error,
    totalPower,
    flaggedCount,
    wastingCount,
    avgEfficiency,
    occupiedCount,
    patchRoom,
    addAlert,
  }
}
