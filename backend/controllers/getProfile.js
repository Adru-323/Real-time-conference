const userModel = require("../models/userModel.js");

const getProfile = async (req, res) => {
    try {
        const user = await userModel
            .findById(req.user.userId)
            .select("username email");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Could not fetch profile"
        });
    }
};

module.exports = { getProfile };