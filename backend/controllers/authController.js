const userModel  = require("../models/userModel.js");
const bcryptjs = require("bcryptjs");
const generateToken = require("../utiles/generateToken.js");

const Register =async (req,res)=> {
    try{
        const {username , email , password } = req.body;
        const existingUser = await userModel.findOne({email});

        if(existingUser){
            return res.status(400).json({
                success: false,
                message:"User already exists"
            });
        }

            const newUser = await userModel.create({
                username,
                email,
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


            res.status(200).json({
                message:"User created successfully!"
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
        const {email , password} = req.body;
        const existingUser = await userModel.findOne({email})
        
        if(!existingUser){
            return res.status(404).json({
                message:"User not found!"
            });
        }

        const isMatch =await  bcryptjs.compare(password,existingUser.password );
        if(!isMatch){
            return res.status(400).json({
                message:"Invalid password or email"
            });
        };

        const token =  generateToken(existingUser._id);
        res.cookie("token", token, {
        httpOnly: true,
        secure: false, // true in production https
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
});

        res.status(200).json({
            message:"user login successfull",success:true
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
