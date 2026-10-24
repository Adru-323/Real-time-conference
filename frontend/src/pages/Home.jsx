
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { socket } from "../socket";

function Home() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

useEffect(() => {
  axios
    .get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
      withCredentials: true,
    })
    .then(() => setIsLoggedIn(true))
    .catch(() => setIsLoggedIn(false))
    .finally(() => setCheckingAuth(false));
}, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    setError("");
    try {
      await axios.post( `${import.meta.env.VITE_API_URL}/api/auth/logout`, {}, { withCredentials: true });
      socket.disconnect();
      setIsLoggedIn(false);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log out");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
       `${import.meta.env.VITE_API_URL}/api/auth/search-user`,
        { email: email.trim() },
        { withCredentials: true }
      );

      const user = response.data.user;

      navigate(`/chat/${user._id}`,{state: {
    receiverName: user.username,
  },});//userID pass ki  //sath hi name etc using state
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to find user"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
  return (
    <div className="container mt-5">
      Checking login...
    </div>
  );
}

  return (
    <div className="container mt-5 py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow border-0">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center mb-2">
                Welcome to Chat App
              </h2>

              <p className="text-muted text-center mb-4">
                Find a user and start chatting
              </p>

              <form onSubmit={handleSearch}>
                <label
                  htmlFor="email"
                  className="form-label"
                >
                  Search user by email
                </label>

                <input
                  id="email"
                  type="email"
                  className="form-control mb-3"
                  placeholder="Enter user's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Find User & Chat"}
                </button>
              </form>

              {error && (
                <div className="alert alert-danger mt-3 mb-0">
                  {error}
                </div>
              )}

              <hr className="my-4" />

              <p className="text-center text-muted mb-3">
                Don't have an account or need to log in?
              </p>

              <div className="d-flex gap-3">
                <button
                  className="btn btn-outline-primary flex-fill"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>

                <button
                  className="btn btn-outline-success flex-fill"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </div>
              {isLoggedIn && (
                <button
                  className="btn btn-outline-danger w-100 mt-3"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
