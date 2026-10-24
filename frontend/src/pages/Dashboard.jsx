
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:8080/api/auth/profile",
                    { withCredentials: true }
                );

                setUser(response.data.user);
            } catch (error) {
                console.error(
                    error.response?.data?.message || error.message
                );
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await axios.post(
                  `${import.meta.env.VITE_API_URL}/api/auth/logout`,
                {},
                { withCredentials: true }
            );

            navigate("/login");
        } catch (error) {
            console.error(
                error.response?.data?.message || error.message
            );
        }
    };

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2">Loading dashboard...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow border-0">
                        <div className="card-header bg-primary text-white p-4">
                            <h3 className="mb-1">User Dashboard</h3>
                            <p className="mb-0">
                                Welcome back, {user.username}!
                            </p>
                        </div>

                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <div
                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto"
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        fontSize: "32px"
                                    }}
                                >
                                    {user.username?.charAt(0).toUpperCase()}
                                </div>

                                <h4 className="mt-3">{user.username}</h4>
                                <span className="badge bg-success">
                                    Logged In
                                </span>
                            </div>

                            <hr />

                            <div className="mb-3">
                                <label className="form-label text-secondary">
                                    Username
                                </label>
                                <p className="fw-semibold">
                                    {user.username}
                                </p>
                            </div>

                            <div className="mb-3">
                                <label className="form-label text-secondary">
                                    Email Address
                                </label>
                                <p className="fw-semibold">
                                    {user.email}
                                </p>
                            </div>

                            <button
                                className="btn btn-danger w-100 mt-3"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
