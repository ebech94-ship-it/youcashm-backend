const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const gameRoutes = require("./routes/gameRoutes");
const { startRound } = require("./game/roundEngine");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

global.io = io;

app.get("/", (req, res) => {
  res.send("🚀 youCashM Server Running (Realtime Enabled)");
});

app.use("/api", gameRoutes);

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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log("🚀 youCashM backend running on Render");

  console.log("🎮 Engine ready — waiting for manual/API trigger");
});