import express, { Express, NextFunction } from "express";
import { Socket } from "socket.io";

const http = require("http");

const socketIo = require("socket.io");

const app: Express = express();
const server = http.createServer(app);
const IO = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let PORT = process.env.PORT || 5000;

IO.use((socket: Socket, next: NextFunction) => {
  if (socket.handshake.query) {
    let callerId = socket.handshake.query.callerId;
    let roomName = socket.handshake.query.roomName;

    //@ts-ignore
    socket.user = callerId;
    //@ts-ignore
    socket.room = roomName;
    next();
  }
});

const rooms = {};

IO.on("connection", (socket: Socket) => {
  //@ts-ignore
  console.log(socket.user, "Connected");
  //@ts-ignore
  socket.join(socket.user);

  socket.on("createRoom", (data) => {
    let moderatorId = data.moderatorId;
    let roomName = data.room;

    Object(rooms)[roomName] = { owner: moderatorId, participants: [] };
    console.log(`Le salon ${roomName} a été créé par ${moderatorId}`);
    console.log(rooms);
    IO.to(moderatorId).emit("roomCreated", roomName);
  });

  socket.on("IceCandidate", (data) => {
    let calleeId = data.calleeId;
    let iceCandidate = data.iceCandidate;

    socket.to(calleeId).emit("IceCandidate", {
      //@ts-ignore
      sender: socket.user,
      iceCandidate: iceCandidate,
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
