import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../lib/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "repair_auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (auth?.access_token) {
      setAuthToken(auth.access_token);
    } else {
      setAuthToken(null);
    }
  }, [auth]);

  const value = useMemo(() => {
    async function login(email, password) {
      const res = await api.post("/auth/login", { email, password });
      setAuth(res.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    }

    async function registerCustomer(payload) {
      const res = await api.post("/auth/register/customer", payload);
      setAuth(res.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    }

    async function registerVendor(payload) {
      const res = await api.post("/auth/register/vendor", payload);
      setAuth(res.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    }

    function logout() {
      setAuth(null);
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    }

    return {
      auth,
      isLoggedIn: !!auth?.access_token,
      role: auth?.role || null,
      userId: auth?.user_id || null,
      name: auth?.name || null,
      login,
      registerCustomer,
      registerVendor,
      logout,
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
