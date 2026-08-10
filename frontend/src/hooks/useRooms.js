/**
 * useRooms.js
 *
 * Master hook — fetches rooms + alerts, wires live socket updates,
 * and computes derived dashboard stats.
 *
 * In mock mode: loads from roomService (which returns mockData), then
 *   simulates live jitter every 5 s so the UI feels alive.
 * In live mode: connects socket.io, listens for room:update + alert:new.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchRooms, fetchAlerts, USE_MOCK } from '../services/roomService'
import * as socket from '../services/socketService'

export function useRooms() {
  const [rooms, setRooms] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const jitterRef = useRef(null)

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [roomData, alertData] = await Promise.all([fetchRooms(), fetchAlerts()])
        if (!cancelled) {
          setRooms(roomData)
          setAlerts(alertData)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load room data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── Mock mode: simulate live updates ────────────────────────────────────────
  useEffect(() => {
    if (!USE_MOCK || loading) return

    jitterRef.current = setInterval(() => {
      setRooms((prev) =>
        prev.map((room) => {
          // ±5% power jitter
          const delta = (Math.random() - 0.5) * 0.1
          const newWatts = Math.max(10, Math.round(room.power_watts * (1 + delta)))
          return { ...room, power_watts: newWatts, updated_at: new Date().toISOString() }
        })
      )
    }, 5000)

    return () => clearInterval(jitterRef.current)
  }, [loading])

  // ── Live mode: socket.io ──────────────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK) return

    // Connect only when in live mode
    socket.connect()

    const cleanupRoom = socket.onRoomUpdate((updatedRoom) => {
      setRooms((prev) =>
        prev.map((r) => (r.room_id === updatedRoom.room_id ? { ...r, ...updatedRoom } : r))
      )
    })

    const cleanupAlert = socket.onAlertNew((alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50)) // keep max 50
    })

    return () => {
      cleanupRoom()
      cleanupAlert()
      socket.disconnect()
    }
  }, [])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPower = rooms.reduce((s, r) => s + r.power_watts, 0)
  const flaggedCount = rooms.filter((r) => r.status === 'flagged').length
  const wastingCount = rooms.filter((r) => r.status === 'wasting').length
  const occupiedCount = rooms.filter((r) => r.occupancy === 1).length
  const avgEfficiency =
    rooms.length > 0
      ? Math.round(rooms.reduce((s, r) => s + r.efficiency_score, 0) / rooms.length)
      : 0

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
  }
}
