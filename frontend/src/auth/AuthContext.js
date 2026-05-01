import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null | object | false
  const [profile, setProfile] = useState(null);
  const [entity, setEntity] = useState(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (mounted) {
          setUser(data.user);
          setProfile(data.profile);
          setEntity(data.entity || null);
        }
      } catch (e) {
        if (mounted) { setUser(false); setProfile(null); setEntity(null); }
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.access_token) localStorage.setItem("red.token", data.access_token);
    setUser(data.user);
    try {
      const me = await api.get("/auth/me");
      setProfile(me.data.profile);
      setEntity(me.data.entity || null);
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

  const setAuthFromRegister = (u, p, e) => {
    setUser(u || false);
    setProfile(p || null);
    setEntity(e || null);
  };

  const logout = async () => {
    localStorage.removeItem("red.token");
    setUser(false);
    setProfile(null);
    setEntity(null);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("logout request failed (already cleared locally):", err);
    }
  };

  const refreshProfile = async () => {
    const { data } = await api.get("/auth/me");
    setProfile(data.profile);
    setEntity(data.entity || null);
    return data.profile;
  };

  return (
    <AuthContext.Provider value={{ user, profile, entity, login, register, registerClient, setAuthFromRegister, logout, refreshProfile, setProfile, setEntity, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
