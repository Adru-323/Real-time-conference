const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");


const userSchema = new mongoose.Schema({
        username:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String
    }
});

userSchema.pre("save" , async function()     {
    if(!this.isModified("password")){
        return ;
    }


    this.password = await bcryptjs.hash(this.password,10);
});


const userModel = mongoose.model("User",userSchema);

module.exports = userModel;