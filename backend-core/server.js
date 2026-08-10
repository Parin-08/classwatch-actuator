require("dotenv").config(); 
console.log(`[debug] GEMINI_API_KEY loaded, length: ${(process.env.GEMINI_API_KEY || "").length}, starts with: ${(process.env.GEMINI_API_KEY || "").slice(0, 4)}`);
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");

const store = require("./lib/store");
const { getLedger } = require("./lib/services");
const buildRoomsRouter = require("./routes/rooms");
const buildIngestRouter = require("./routes/ingest");
const buildProxyRouter = require("./routes/proxy");
const buildNlQueryRouter = require("./routes/nlquery");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const live = io.of("/live");

live.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`[socket] client disconnected: ${socket.id}`));
});

// ---- routes ----
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use(buildRoomsRouter(io));
app.use(buildIngestRouter(io));
app.use(buildProxyRouter());
app.use(buildNlQueryRouter());

// ---- background: simulate room:update heartbeat until real ingest is flowing ----
// This unblocks frontend dev immediately, even before Simulator/MQTT is wired.
setInterval(() => {
  Object.values(store.rooms).forEach((room) => {
    // small random jitter so the dashboard visibly "lives"
    room.power_watts = Math.max(0, room.power_watts + Math.round((Math.random() - 0.5) * 40));
    room.updated_at = store.now();
    live.emit("room:update", room);
  });
}, 4000);

// ---- background: relay ledger updates every 10s ----
cron.schedule("*/10 * * * * *", async () => {
  const remoteLedger = await getLedger();
  const ledger = remoteLedger || store.ledger;
  live.emit("ledger:update", {
    total_kwh_saved: ledger.total_kwh_saved,
    total_rupees_saved: ledger.total_rupees_saved,
    total_co2_kg_saved: ledger.total_co2_kg_saved,
    updated_at: store.now(),
  });
});

server.listen(PORT, () => {
  console.log(`ClassWatch Backend Core listening on http://localhost:${PORT}`);
  console.log(`Socket.io namespace: /live`);
});
