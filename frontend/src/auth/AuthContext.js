import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null | object | false
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (mounted) {
          setUser(data.user);
          setProfile(data.profile);
        }
      } catch (e) {
        if (mounted) { setUser(false); setProfile(null); }
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.access_token) localStorage.setItem("red.token", data.access_token);
    setUser(data.user);
    // refresh profile
    try {
      const me = await api.get("/auth/me");
      setProfile(me.data.profile);
    } catch (err) {
      console.error("failed to fetch profile after login:", err);
    }
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register-entrepreneur", payload);
    if (data.access_token) localStorage.setItem("red.token", data.access_token);
    setUser(data.user);
    setProfile(data.profile);
    return data;
  };

  const registerClient = async (payload) => {
    const { data } = await api.post("/auth/register-client", payload);
    if (data.access_token) localStorage.setItem("red.token", data.access_token);
    setUser(data.user);
    setProfile(null);
    return data;
  };

  const logout = async () => {
    // Clear local state FIRST so UI reflects logout immediately,
    // even if the network request fails or is slow.
    localStorage.removeItem("red.token");
    setUser(false);
    setProfile(null);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("logout request failed (already cleared locally):", err);
    }
  };

  const refreshProfile = async () => {
    const { data } = await api.get("/auth/me");
    setProfile(data.profile);
    return data.profile;
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, register, registerClient, logout, refreshProfile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
