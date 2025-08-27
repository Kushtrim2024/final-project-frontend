"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5517";

// (optional) If you want to read the role from JWT
function readRoleFromJWT(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded))?.role || null;
  } catch {
    return null;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // If already logged in, send it to dashboard
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) router.replace("/admin/dashboard");
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data?.message || "Login failed");
        return;
      }

      // Backend: { message, token, user: { id, name, email, role } }
      localStorage.setItem("token", data.token);

      // (optional) if you want to hide the role:
      const role = data?.user?.role || readRoleFromJWT(data.token);
      if (role) localStorage.setItem("role", role);

      // If login is successful → dashboard
      router.push("/admin/dashboard");
    } catch {
      setLoginError("Server error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const inputClass =
    "pl-2 w-4/5 max-[400px]:w-3/4 h-10 rounded-md bg-white text-sm text-gray-800 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const labelClass =
    "mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[500px]:w-2/5";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8 px-4">
      <section className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
          <h2 className="text-xl font-bold text-gray-800">Admin Login</h2>
          <p className="text-sm text-gray-500">Welcome back! Please log in.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-row items-center">
            <label htmlFor="login-email" className={labelClass}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="admin@gmail.com"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-row items-center">
            <label htmlFor="login-password" className={labelClass}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {loginError && (
            <p className="text-red-600 text-sm" role="alert">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loginLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}
