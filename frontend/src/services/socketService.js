/**
 * socketService.js
 *
 * Scaffolded Socket.io client for the ClassWatch live telemetry namespace.
 *
 * Namespace : /live
 * Server    : http://localhost:4000  (VITE_SOCKET_URL)
 * Events listened:
 *   - "room:update"  → payload: Room object (same shape as GET /rooms item)
 *   - "alert:new"    → payload: Alert object { id, room_id, severity, message, ts }
 *
 * IMPORTANT: connect() is NOT called automatically. It is called only from
 * useRooms.js when VITE_USE_MOCK === 'false', so mock mode never opens a socket.
 */

import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
const NAMESPACE = '/live'

let socket = null

/**
 * Returns (and lazily creates) the singleton socket instance.
 * The socket is created with autoConnect: false so nothing happens until
 * connect() is explicitly called.
 */
function getSocket() {
  if (!socket) {
    socket = io(`${SOCKET_URL}${NAMESPACE}`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.info('[ClassWatch Socket] Connected to', SOCKET_URL + NAMESPACE)
    })

    socket.on('disconnect', (reason) => {
      console.warn('[ClassWatch Socket] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('[ClassWatch Socket] Connection error:', err.message)
    })
  }
  return socket
}

/**
 * Initiates the socket connection (call from useRooms when live mode is active).
 */
export function connect() {
  getSocket().connect()
}

/**
 * Cleanly disconnects and destroys the socket instance.
 */
export function disconnect() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Registers a listener for "room:update" events.
 * @param {(room: object) => void} handler
 * @returns {() => void} cleanup function — call this in useEffect cleanup
 */
export function onRoomUpdate(handler) {
  const s = getSocket()
  s.on('room:update', handler)
  return () => s.off('room:update', handler)
}

/**
 * Registers a listener for "alert:new" events.
 * @param {(alert: object) => void} handler
 * @returns {() => void} cleanup function
 */
export function onAlertNew(handler) {
  const s = getSocket()
  s.on('alert:new', handler)
  return () => s.off('alert:new', handler)
}

/** Expose raw socket for advanced consumers */
export { getSocket }
