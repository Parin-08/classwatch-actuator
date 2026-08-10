/**
 * useRoomHistory.js
 *
 * Fetches power/occupancy history for a single room when a detail panel opens.
 * Appends live ticks in mock mode so the chart animates.
 */

import { useState, useEffect, useRef } from 'react'
import { fetchRoomHistory, USE_MOCK } from '../services/roomService'

export function useRoomHistory(room) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const liveTickRef = useRef(null)

  useEffect(() => {
    if (!room) {
      setHistory([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetchRoomHistory(room.room_id)
      .then((data) => {
        if (!cancelled) {
          setHistory(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [room?.room_id])

  // Mock mode: append a new data point every 5s so the chart animates
  useEffect(() => {
    if (!USE_MOCK || !room || history.length === 0) return

    liveTickRef.current = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1]
        const jitter = (Math.random() - 0.5) * 0.12
        const newWatts = Math.max(10, Math.round(last.watts * (1 + jitter)))
        const newOcc = Math.max(0, last.occupancy + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0))
        const tick = {
          t: new Date().toISOString(),
          watts: newWatts,
          occupancy: newOcc,
        }
        // Keep rolling window of 30 points
        return [...prev.slice(-29), tick]
      })
    }, 5000)

    return () => clearInterval(liveTickRef.current)
  }, [room?.room_id, history.length])

  return { history, loading }
}
