import { useState } from 'react';
import api from "../api";
import { useAuth } from "../authContext.js";
import { useNavigate } from 'react-router-dom';


function Login() {

    const [formData , setFormData] = useState({
        email :"",password:""
    })

    const [error , setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,[e.target.name]:e.target.value
        }));
    };

    const navigate = useNavigate();
    const { refreshAuth } = useAuth();

    const handleSubmit = async(e) => {
        try{
            e.preventDefault();
            setError("");
            setSubmitting(true);
            const response = await api.post("/api/auth/login", formData);
            if (!response.data.token) throw new Error("The server did not return an authentication token");
            localStorage.setItem("token", response.data.token);
            const user = await refreshAuth();
            if (!user) throw new Error("Login succeeded, but your profile could not be verified. Please try again.");
            navigate("/", { replace: true });
        }catch (error) {
            setError(error.response?.data?.message || error.message || "Unable to log in");
        } finally {
            setSubmitting(false);
}
    }


    return (
    <div className="container mt-5 py-5 justify-content-center ">
   <form onSubmit={handleSubmit}>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
  <div className="mb-3">
    <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
    <input type="email" onChange={handleChange} name="email" value={formData.email} className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp"/>
    <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
  </div>

  <div className="mb-3">
    <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
    <input   type="password" onChange={handleChange} name="password" value={formData.password} className="form-control" id="exampleInputPassword1"/>
  </div>

  <button type="submit" className="btn btn-primary mb-5" disabled={submitting}>{submitting ? "Logging in..." : "Login"}</button>
</form>
<button type="button" className="btn btn-secondary" onClick={ ()=> navigate("/")}>Back</button>
    </div>
      );
}

export default Login;
