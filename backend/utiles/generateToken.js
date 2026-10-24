const jwt  = require("jsonwebtoken");
require("dotenv").config();

const generateToken = (userId)=> {
    return jwt.sign(
        {userId},process.env.SECRET_CODE,{expiresIn:"1d"}
    );
}


module.exports = generateToken;
