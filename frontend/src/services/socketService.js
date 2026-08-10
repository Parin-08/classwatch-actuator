/**
 * socketService.js
 * ─────────────────
 * Socket.IO client scaffolded for namespace /live at localhost:4000.
 * Uses autoConnect: false so it does NOT attempt to connect on import —
 * safe to run without a backend in mock mode.
 *
 * Usage:
 *   import { connectSocket, onRoomUpdate, onAlertNew } from './socketService'
 *   connectSocket()
 *   onRoomUpdate(room => dispatch({ type: 'PATCH_ROOM', payload: room }))
 *   onAlertNew(alert => dispatch({ type: 'ADD_ALERT', payload: alert }))
 */

import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

let socket = null

function getSocket() {
  if (!socket) {
    socket = io(`${BACKEND_URL}/live`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('[ClassWatch] Socket connected to /live —', socket.id)
    })
    socket.on('disconnect', reason => {
      console.warn('[ClassWatch] Socket disconnected —', reason)
    })
    socket.on('connect_error', err => {
      console.error('[ClassWatch] Socket connection error —', err.message)
    })
  }
  return socket
}

/** Connect to the /live namespace. Call this when switching from mock → live. */
export function connectSocket() {
  getSocket().connect()
}

/** Disconnect cleanly (e.g., on component unmount or app teardown). */
export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect()
  }
}

/**
 * Register a handler for "room:update" events.
 * The server emits the full updated room object.
 * @param {(room: object) => void} cb
 * @returns {() => void} cleanup function
 */
export function onRoomUpdate(cb) {
  const s = getSocket()
  s.on('room:update', cb)
  return () => s.off('room:update', cb)
}

/**
 * Register a handler for "alert:new" events.
 * @param {(alert: object) => void} cb
 * @returns {() => void} cleanup function
 */
export function onAlertNew(cb) {
  const s = getSocket()
  s.on('alert:new', cb)
  return () => s.off('alert:new', cb)
}

/** Returns true if socket is currently connected */
export function isConnected() {
  return socket ? socket.connected : false
}
