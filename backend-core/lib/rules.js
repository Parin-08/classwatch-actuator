// Rules engine — cheap, fast, synchronous checks run on every /ingest.
// These flags get passed to the Decision Layer (:8002/decide) as rule_flags.

function evaluateRules(room) {
  const flags = [];
  const nowMs = Date.now();
  const classEndMs = room.last_class_end ? new Date(room.last_class_end).getTime() : null;
  const classStartMs = room.next_class_start ? new Date(room.next_class_start).getTime() : null;

  // idle_after_class: power draw high, no occupancy, class already ended
  if (room.occupancy === 0 && room.power_watts > 200 && classEndMs && nowMs > classEndMs) {
    flags.push("idle_after_class");
  }

  // occupancy_mismatch: devices on but sensor shows zero occupancy while a class should be running
  const anyDeviceOn = Object.values(room.devices || {}).some(Boolean);
  if (anyDeviceOn && room.occupancy === 0 && classStartMs && classEndMs && nowMs > classEndMs && nowMs < classStartMs) {
    flags.push("occupancy_mismatch");
  }

  // off_peak: meaningful power draw outside typical class hours (before 7am / after 9pm)
  const hour = new Date(room.updated_at || nowMs).getUTCHours();
  if (room.power_watts > 150 && (hour < 2 || hour > 15)) {
    // NOTE: adjust UTC offset for IST (UTC+5:30) once real timestamps are wired in
    flags.push("off_peak");
  }

  return flags;
}

module.exports = { evaluateRules };
