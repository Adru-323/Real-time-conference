const express = require("express");
const { Register, Login, Logout } = require("../controllers/authController.js");
const { getProfile } = require("../controllers/getProfile.js");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const searchUser = require("../controllers/searchUser.js");
const userModel = require("../models/userModel.js");
const Message = require("../models/messageModel.js");
const mongoose = require("mongoose");

 
router.post("/register",Register);
router.post("/login",Login)
router.post("/logout", Logout);
router.get("/profile",authMiddleware,getProfile);
router.post("/search-user", authMiddleware, searchUser);
// backend/routes/auth.routes.js (ya user.routes.js)
router.get("/user/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await userModel.findById(req.params.id).select("username email");
    if (!user) {
      return res.status(404).json({ message: "User nahi mila" });
    }
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const currentUserId = req.user.userId;
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch messages" });
  }
});
module.exports = router;
