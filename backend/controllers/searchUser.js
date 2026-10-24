const userModel = require("../models/userModel.js");

const searchUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await userModel
      .findOne({
        email: email.trim().toLowerCase(),
      })
      .select("_id username email");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = searchUser;


//user find by email hoome se then vo req backend se user find krege aur connection build hoge 
