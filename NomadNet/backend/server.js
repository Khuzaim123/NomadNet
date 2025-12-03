import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";

import {
  CORS_OPTIONS,
  MAX_JSON_SIZE,
} from "./src/constants/config.js";

import { requestLogger } from "./src/middlewares/logging.js";
import { errorHandler } from "./src/middlewares/error.js";

import registerRoutes from "./src/routes/index.js";
import cleanupJob from "./src/jobs/cleanupJob.js";

import socketHandlers from "./src/config/socket.js";

// ---------------------------------------------------------------------
// INITIAL SETUP
// ---------------------------------------------------------------------
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CORS_OPTIONS.origin || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

// ---------------------------------------------------------------------
// DATABASE
// ---------------------------------------------------------------------
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB ERROR:", err);
    process.exit(1);
  });

// ---------------------------------------------------------------------
// MIDDLEWARE
// ---------------------------------------------------------------------
app.use(helmet());
app.use(cors(CORS_OPTIONS));

app.use(express.json({ limit: MAX_JSON_SIZE }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(requestLogger);

// ---------------------------------------------------------------------
// HEALTH + DEBUG ROUTES
// ---------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/debug/request-info", (req, res) => {
  res.json({
    method: req.method,
    origin: req.headers.origin,
    path: req.path,
    body: req.body,
    query: req.query,
  });
});

// ---------------------------------------------------------------------
// ROUTES (ALL ROUTES LOADED FROM ROUTE INDEX)
// ---------------------------------------------------------------------
registerRoutes(app);

// ---------------------------------------------------------------------
// SOCKET.IO — COMBINED VERSION
// Includes: join rooms, messages, typing, online status, workspace chat
// ---------------------------------------------------------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Standard socket handlers (from socket.js)
  socketHandlers(io, socket);

  // Chat join room
  socket.on("join_chat", ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // Chat message send
  socket.on("send_message", (data) => {
    const { conversationId, message } = data;
    if (!conversationId || !message) return;

    console.log("Message sent:", data);
    io.to(conversationId).emit("message_received", data);
  });

  // Typing indicator
  socket.on("typing", ({ conversationId, userId }) => {
    io.to(conversationId).emit("typing", { userId });
  });

  // Stop typing
  socket.on("stop_typing", ({ conversationId, userId }) => {
    io.to(conversationId).emit("stop_typing", { userId });
  });

  // Workspace status updates
  socket.on("workspace_status", (data) => {
    io.emit("workspace_status_update", data);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ---------------------------------------------------------------------
// ERROR HANDLER
// ---------------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------------
// CRON JOBS
// ---------------------------------------------------------------------
cleanupJob();

// ---------------------------------------------------------------------
// START SERVER
// ---------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
