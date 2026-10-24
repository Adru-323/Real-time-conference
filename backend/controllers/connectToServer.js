const mongoose = require("mongoose");


const Message = require("../models/messageModel.js");

const connectToServer = (io) => {
  io.on("connection", (socket) => {
    console.log("SOCKET CONNECTED");
    console.log("Authenticated socket connected:", { userId: socket.userId, socketId: socket.id });
    socket.join(socket.userId.toString()); //room create karta hai
    console.log("Socket joined user room:", socket.userId.toString());


  
        // ================= WEBRTC CALL SIGNALING =================

// 1. Caller calls receiver
socket.on("call-user", ({ to }) => {
  if (!mongoose.isValidObjectId(to)) return;

  io.to(to).emit("incoming-call", {
    from: socket.userId.toString(),
  });
});

// 2. Receiver accepts the call
socket.on("call-accepted", ({ to }) => {
  if (!mongoose.isValidObjectId(to)) return;

  io.to(to).emit("call-accepted", {
    from: socket.userId.toString(),
  });
});

// 3. Forward WebRTC offer
socket.on("webrtc-offer", ({ to, offer }) => { //jab frontend se call pick kiya toh frontend offer send krta hai along sab info 
  if (!mongoose.isValidObjectId(to) || !offer) return;

  io.to(to).emit("webrtc-offer", {
    from: socket.userId.toString(),
    offer,
  });
});

// 4. Forward WebRTC answer
socket.on("webrtc-answer", ({ to, answer }) => {
  if (!mongoose.isValidObjectId(to) || !answer) return;

  io.to(to).emit("webrtc-answer", {
    from: socket.userId.toString(),
    answer,
  });
});

// 5. Forward ICE candidates
socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
  if (!mongoose.isValidObjectId(to) || !candidate) return;

  io.to(to).emit("webrtc-ice-candidate", {
    from: socket.userId.toString(),
    candidate,
  });
});

// 6. End or reject call
socket.on("end-call", ({ to }) => {
  if (!mongoose.isValidObjectId(to)) return;

  io.to(to).emit("call-ended", {
    from: socket.userId.toString(),
  });
});














    socket.on("send-message", async (data) => {
      console.log("Message event received:", { from: socket.userId.toString() });

      try {
        const { to, text } = data; // frontend se ayega 

        if (
          typeof to !== "string" ||
          !mongoose.isValidObjectId(to) ||
          typeof text !== "string" ||
          !text.trim()
        ) {
          return;
        }

        // Sender ki ID authenticated socket se aayegi
        const message = await Message.create({
          sender: socket.userId,
          receiver: to,
          text: text.trim(),
        });

        // Receiver ke room mein message bhejo
        io.to(to).emit("receive-message", message);

        // Sender ko bhi saved message bhejo
        socket.emit("message-sent", message); // aar kudke upr kaam toh socket.on/emit if dusre k global level toh io.om/to(event name , data )
        console.log("Message saved and emitted:", { messageId: message._id.toString(), to });
      } catch (error) {
        console.error("Message error:", error);
        socket.emit("message-error", {
          message: "Message send nahi hua",
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected:", socket.userId, reason);
    });
  });
};

module.exports = connectToServer;
