import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("connect_error", (error) => {
  console.log("SOCKET ERROR:", error.message);
});