
const jwt = require("jsonwebtoken");

const socketMiddleware = (socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || "";
  const cookieToken = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="))
    ?.slice("token=".length);
  const token = socket.handshake.auth?.token || cookieToken;

  if (!token) return next(new Error("Authentication required"));

  try {
    // 4. JWT verify karo
    const decoded = jwt.verify(decodeURIComponent(token), process.env.SECRET_CODE);

    // 5. User ID socket par store karo
    socket.userId = decoded.userId;

    // 6. Authentication successful
    next();
  } catch (error) {
    console.log("JWT error:", error.message);
    next(new Error("Invalid token"));
  }
};

module.exports = socketMiddleware;
