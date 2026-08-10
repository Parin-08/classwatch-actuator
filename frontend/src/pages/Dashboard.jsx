import { useState, useCallback } from 'react'
import { useRooms } from '../hooks/useRooms'
import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import CampusMap from '../components/campus/CampusMap'
import DetailPanel from '../components/panel/DetailPanel'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function Dashboard() {
  const {
    rooms, alerts, loading, error,
    totalPower, flaggedCount, wastingCount, avgEfficiency, occupiedCount,
  } = useRooms()

  const [selectedRoom, setSelectedRoom] = useState(null)

  /** Click on a tile → open detail panel */
  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(prev => prev?.room_id === room.room_id ? null : room)
  }, [])

  /** Click alert → find room and open it */
  const handleAlertSelect = useCallback((roomId) => {
    const room = rooms.find(r => r.room_id === roomId)
    if (room) setSelectedRoom(room)
  }, [rooms])

  /** Keep selected room in sync with live updates */
  const liveSelectedRoom = selectedRoom
    ? rooms.find(r => r.room_id === selectedRoom.room_id) ?? selectedRoom
    : null

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient background layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="grid-mesh-drift absolute inset-0 opacity-40" />
      </div>
      <div className="bg-noise" aria-hidden />

      {/* Header */}
      <Header
        totalPower={totalPower}
        flaggedCount={flaggedCount}
        wastingCount={wastingCount}
        avgEfficiency={avgEfficiency}
        occupiedCount={occupiedCount}
        roomCount={rooms.length}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              className="flex flex-col items-center gap-4 text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 size={36} className="animate-spin text-blue-500" />
              <p className="text-sm">Connecting to campus telemetry…</p>
            </motion.div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              className="rounded-2xl px-8 py-6 text-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-red-400 font-semibold mb-1">Failed to load room data</p>
              <p className="text-xs text-slate-500">{error}</p>
            </motion.div>
          </div>
        )}

        {/* Campus map */}
        {!loading && !error && (
          <CampusMap
            rooms={rooms}
            selectedRoomId={liveSelectedRoom?.room_id}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {/* Alert sidebar */}
        <Sidebar alerts={alerts} onSelectRoom={handleAlertSelect} />
      </div>

      {/* Detail panel (portal-like fixed overlay) */}
      <DetailPanel room={liveSelectedRoom} onClose={() => setSelectedRoom(null)} />
    </div>
  )
}
