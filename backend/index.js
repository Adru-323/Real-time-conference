const express = require("express");
const app = express();
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const cors = require("cors");
const authRouter = require("./routes/authRoutes.js");
const cookieParser = require("cookie-parser");
const http = require("http");
const {Server} = require("socket.io");
const socketMiddleware = require("./middleware/socketMiddleware.js");
const connectToServer = require("./controllers/connectToServer.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);


app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use("/api/auth", authRouter);

const url = process.env.MONGODB_URL;


const server = http.createServer(app);  //created http server where App+io server are attach and work 


// io ko HTTP server se attach 
const io = new Server(server, {
  cors: {
      origin:allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
//io connect event 

// Step 1: Socket connection ko authenticate karo
io.use(socketMiddleware);
connectToServer(io);



// 4. Database connect karke server start karo

const startServer  = async() => {
  try{
    if (!url || !process.env.SECRET_CODE) {
      throw new Error("Missing required backend environment configuration");
    }
    await mongoose.connect(url);
    console.log("DB is connected");

    server.listen(process.env.PORT ||8080,"0.0.0.0",()=> {
      console.log("Listing to port 8080");
    })
  }catch(err){
    console.error("Server startup failed:", err.message);
  }
};

startServer();

