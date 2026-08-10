import { motion } from 'framer-motion'
import RoomTile from './RoomTile'

/** Groups rooms by building and lays them out as a grid of tiles */
export default function CampusMap({ rooms, selectedRoomId, onSelectRoom }) {
  // Group by building
  const buildings = {}
  rooms.forEach(room => {
    if (!buildings[room.building]) buildings[room.building] = []
    buildings[room.building].push(room)
  })

  const buildingEntries = Object.entries(buildings)

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Campus heading */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-slate-100">
          Digital Twin Campus Map
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Click any room tile to inspect live telemetry · Glow intensity = power usage
        </p>
      </motion.div>

      {/* Legend */}
      <motion.div
        className="flex items-center gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { status: 'normal',  label: 'Normal',  color: '#3b82f6' },
          { status: 'wasting', label: 'Wasting', color: '#f59e0b' },
          { status: 'flagged', label: 'Flagged', color: '#ef4444' },
        ].map(({ status, label, color }) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
        <div className="ml-auto text-xs text-slate-600 font-mono">
          {rooms.length} rooms monitored
        </div>
      </motion.div>

      {/* Building sections */}
      <div className="flex flex-col gap-10">
        {buildingEntries.map(([building, buildingRooms], bIdx) => (
          <motion.div
            key={building}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + bIdx * 0.12, duration: 0.5 }}
          >
            {/* Building label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-blue-900/60 to-transparent" />
              <span
                className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: '#60a5fa',
                }}
              >
                {building}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-blue-900/60 to-transparent" />
            </div>

            {/* SVG tile grid */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              }}
            >
              {buildingRooms.map((room, rIdx) => (
                <motion.div
                  key={room.room_id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.15 + bIdx * 0.1 + rIdx * 0.07,
                    type: 'spring',
                    stiffness: 260,
                    damping: 22,
                  }}
                >
                  <RoomTile
                    room={room}
                    isSelected={room.room_id === selectedRoomId}
                    onClick={() => onSelectRoom(room)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
