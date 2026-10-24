// const userModel  = require("../models/userModel.js");
// const bcryptjs = require("bcryptjs");
// const generateToken = require("../utiles/generateToken.js");

// const Register =async (req,res)=> {
//     try{
//         const {username , email , password } = req.body;
//         const existingUser = await userModel.findOne({email});

//         if(existingUser){
//             return res.status(400).json({
//                 success: false,
//                 message:"User already exists"
//             });
//         }

//             const newUser = await userModel.create({
//                 username,
//                 email,
//                 password
//             });
//             const token  =generateToken(newUser._id);

//             res.cookie("token",token ,{
//                 httpOnly:true,
//                 secure: true, // true in production https
//                 sameSite: "none",
//                 path: "/",
//                 maxAge: 24 * 60 * 60 * 1000,
//             })


//             res.status(200).json({
//                 message:"User created successfully!"
//             });
//     }catch (error) {
//     console.error("Register error:", error);

//     return res.status(400).json({
//         success: false,
//         message: error.message || "Registration failed"
//     });
// }
// };


// const Login = async(req,res) => {
//     try {
//         const {email , password} = req.body;
//         const existingUser = await userModel.findOne({email})
        
//         if(!existingUser){
//             return res.status(404).json({
//                 message:"User not found!"
//             });
//         }

//         const isMatch =await  bcryptjs.compare(password,existingUser.password );
//         if(!isMatch){
//             return res.status(400).json({
//                 message:"Invalid password or email"
//             });
//         };

//         const token =  generateToken(existingUser._id);
//         res.cookie("token", token, {
//         httpOnly: true,
//         secure: true, // true in production https
//         sameSite: "none",
//         path: "/",
//         maxAge: 24 * 60 * 60 * 1000,
// });

//         res.status(200).json({
//             message:"user login successfull",success:true
//         });

//     }    catch(error){

//             console.error("Login error:", error.message);

//     return res.status(400).json({
//         success: false,
//         message: error.message || "Registration failed"
//     });
//     }
// }



// const Logout = (req, res) => {
//     res.clearCookie("token", {
//         httpOnly: true,
//         secure: true,
//         sameSite: "none",
//         path: "/",
//     });

//     return res.status(200).json({
//         success: true,
//         message: "Logged out successfully",
//     });
// };

// module.exports = {Register , Login, Logout};




const userModel = require("../models/userModel.js");
const bcryptjs = require("bcryptjs");
const generateToken = require("../utils/generateToken.js");

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

const Register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Remove this line if your model already hashes in a pre("save") hook
    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await userModel.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "User created successfully!",
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const existingUser = await userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    // If your schema uses `select: false` on password, use .select("+password") above
    const isMatch = existingUser
      ? await bcryptjs.compare(password, existingUser.password)
      : false;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(existingUser._id);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "User login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const Logout = (req, res) => {
  // clearCookie must use the same options (minus maxAge) used when setting
  const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie("token", clearOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = { Register, Login, Logout };
