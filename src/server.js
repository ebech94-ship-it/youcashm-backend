const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const gameRoutes = require("./routes/gameRoutes");

// 👇 IMPORTANT: import your engine here
const { startRound } = require("./game/gameEngine"); 
// example: "./engine/roundEngine" or "./src/game/gameEngine"

const app = express();
app.use(cors());
app.use(express.json());

// HTTP server (IMPORTANT for sockets)
const server = http.createServer(app);

// Socket server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io accessible globally
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
    id: socket.id
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log("🚀 youCashM backend running on Render");

  // ✅ START ENGINE ONLY AFTER SERVER IS FULLY UP
  setTimeout(() => {
    console.log("🎮 Starting game engine...");
    startRound();
  }, 1000);
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log("🚀 youCashM backend running on Render");
});