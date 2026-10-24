
const jwt = require("jsonwebtoken");

const socketMiddleware = (socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie || "";

  // 1. Cookie se token find karo
  const tokenCookie = cookieHeader
    .split("; ")
    .find((cookie) => cookie.startsWith("token="));

  // 2. Token nahi mila toh connection reject karo
  if (!tokenCookie) {
    return next(new Error("Token not found"));
  }

  // 3. Cookie se actual token nikalo
  const token = tokenCookie.split("=")[1];

  try {
    // 4. JWT verify karo
    const decoded = jwt.verify(token, process.env.SECRET_CODE);

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
