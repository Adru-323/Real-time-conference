import { useCallback, useEffect, useMemo, useState } from "react";
import api from "./api";
import { socket } from "./socket";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/auth/profile");
      setUser(response.data.user);
      return response.data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      localStorage.removeItem("token");
      socket.disconnect();
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/api/auth/profile")
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
      socket.disconnect();
    };
    const handleStorage = (event) => {
      if (event.key === "token") void refreshAuth();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshAuth]);

  useEffect(() => {
    if (user) {
      if (!socket.connected) socket.connect();
    } else {
      socket.disconnect();
    }
  }, [user]);

  const value = useMemo(
    () => ({ user, loading, refreshAuth, logout }),
    [user, loading, refreshAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
