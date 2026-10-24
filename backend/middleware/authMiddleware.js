require("dotenv").config();
const jwt = require("jsonwebtoken");

const authMiddleware = (req,res,next)=>{
    try{
        const token = req.cookies?.token;

        if(!token){
            return res.status(400).json({message:"No token provided"});
        }

        const decode = jwt.verify( token , process.env.SECRET_CODE)
        req.user = decode;
        next();
    }catch(e){
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
module.exports = authMiddleware;


// JWT = Header + Payload + Signature
// Header = Kaunsa algorithm use hoga, jaise HS256. Ye hashing/signing algorithm hai.
// Payload = User ki information/claims, jaise userId, role, exp. Password store nahi karna.
// Header + Payload ko alag-alag Base64URL encode karte hain, phir dot (.) se join karte hain.
// Encoded Header + Encoded Payload + Secret Key ko HS256 algorithm mein use karke Signature generate hota hai.
// Final JWT mein teeno parts dot se separated hote hain.

