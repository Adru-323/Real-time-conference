const express = require("express");
const { Register, Login, Logout } = require("../controllers/authController.js");
const { getProfile } = require("../controllers/getProfile.js");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware.js");
const searchUser = require("../controllers/searchUser.js");
const userModel = require("../models/userModel.js");

 
router.post("/register",Register);
router.post("/login",Login)
router.post("/logout", Logout);
router.get("/profile",authMiddleware,getProfile);
router.post("/search-user", authMiddleware, searchUser);
// backend/routes/auth.routes.js (ya user.routes.js)
router.get("/user/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select("username email");
    if (!user) {
      return res.status(404).json({ message: "User nahi mila" });
    }
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});
module.exports = router;
