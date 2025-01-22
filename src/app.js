// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import campusConnectRouter from "./routes/campus-connect.route.js";
import campusStoreRouter from "./routes/campus-store.route.js";
import chatRouter from "./routes/chat.route.js";
import adminRouter from './routes/admin.routes.js'
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// campus connect routes
app.use("/api/v1/campus-connect", campusConnectRouter);
app.use("/api/v1/campus-connect/admin", adminRouter);
// campus store routes
app.use("/api/v1/campus-store", campusStoreRouter);

app.use("/api/v1/chat", chatRouter);

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('leave chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User left chat: ${chatId}`);
  });

  socket.on('new message', (message) => {
    io.to(message.chatId).emit('message received', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

export { httpServer as app };