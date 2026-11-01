const userModel  = require("../models/userModel.js");
const bcryptjs = require("bcryptjs");
const generateToken = require("../utiles/generateToken.js");

const Register =async (req,res)=> {
    try{
        const { username, email, password } = req.body;
        if (!username?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ success: false, message: "Username, email, and password are required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await userModel.findOne({ email: normalizedEmail });

        if(existingUser){
            return res.status(400).json({
                success: false,
                message:"User already exists"
            });
        }

            const newUser = await userModel.create({
                username: username.trim(),
                email: normalizedEmail,
                password
            });
            const token  =generateToken(newUser._id);

            res.cookie("token",token ,{
                httpOnly:true,
                secure: true, // true in production https
                sameSite: "none",
                path: "/",
                maxAge: 24 * 60 * 60 * 1000,
            })


            res.status(201).json({
                success: true,
                message: "Registration successful",
                token,
            });
    }catch (error) {
    console.error("Register error:", error);

    return res.status(400).json({
        success: false,
        message: error.message || "Registration failed"
    });
}
};


const Login = async(req,res) => {
    try {
        const { email, password } = req.body;
        if (!email?.trim() || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        const existingUser = await userModel.findOne({ email: email.trim().toLowerCase() });
        
        if(!existingUser){
            return res.status(401).json({
                success: false,
                message:"Invalid email or password"
            });
        }

        const isMatch =await  bcryptjs.compare(password,existingUser.password );
        if(!isMatch){
            return res.status(401).json({
                success: false,
                message:"Invalid password or email"
            });
        };

        const token =  generateToken(existingUser._id);
        res.cookie("token", token, {
        httpOnly: true,
        secure: true, // true in production https
        sameSite: "none",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
});

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
        });

    }    catch(error){

            console.error("Login error:", error.message);

    return res.status(400).json({
        success: false,
        message: error.message || "Registration failed"
    });
    }
}



const Logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

module.exports = {Register , Login, Logout};


