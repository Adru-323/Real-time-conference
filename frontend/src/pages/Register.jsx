import React from "react";
import {useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";


function Register() {

    const navigate  = useNavigate();
    const [formData ,setFormData] = useState({
        username:"",
        email:"",
        password:"",
    });
    const handleChange = (e)=> {
        setFormData((prev) => ({
            ...prev,[e.target.name]:e.target.value
        }));
    };
    const url =`${import.meta.env.VITE_API_URL}/api/auth/register`;

    const handleSubmit =async (e)=>{
            e.preventDefault();
        try{
            const response = await axios.post(url,formData,{
                    withCredentials: true,
            })
          console.log("Backend response:", response.data);
          socket.connect();
          navigate("/");
        }catch (error) {
    console.error(error.response?.data || error.message);
}
    }



  return (
    <div className="container mt-5 py-5 justify-content-center ">
   <form onSubmit={handleSubmit}>
  <div className="mb-3">
    <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
    <input type="email" onChange={handleChange} name="email" value={formData.email} className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp"/>
    <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
  </div>

  <div className="mb-3">
    <label htmlFor="exampleInputEmail1" className="form-label">Username</label>
    <input type="username" onChange={handleChange} name="username" value={formData.username} className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp"/>
    <div className="form-text"></div>
  </div>



  <div className="mb-3">
    <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
    <input   type="password" onChange={handleChange} name="password" value={formData.password} className="form-control" id="exampleInputPassword1"/>
  </div>

  <button type="submit" className="btn btn-primary  mb-5">Submit</button>
</form>
<button type="button" className="btn btn-secondary" onClick={ ()=> navigate("/")}>Back</button>
    </div>
  );
}

export default Register;
