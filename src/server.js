const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const gameRoutes = require("./routes/gameRoutes");

// 👇 IMPORTANT: import your engine here
const { startRound } = require("./game/roundEngine");

const app = express();
app.use(cors());
app.use(express.json());

// HTTP server (required for Socket.IO)
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Make io globally accessible
global.io = io;

// Routes
app.get("/", (req, res) => {
  res.send("🚀 youCashM Server Running (Realtime Enabled)");
});

app.use("/api", gameRoutes);

// Socket connection
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.emit("connected", {
    message: "youCashM backend connected",
    id: socket.id,
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ✅ IMPORTANT: DEFINE PORT BEFORE USING IT
const PORT = process.env.PORT || 5000;

// Start server ONLY ONCE
server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log("🚀 youCashM backend running on Render");

  // Start game engine after server is ready
  setTimeout(() => {
    console.log("🎮 Starting game engine...");
    startRound();
  }, 1000);
});