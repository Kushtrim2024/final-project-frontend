// lib/auth.js
import { signIn, signOut, getSession } from "next-auth/react";

export const TOKEN_KEY = "liefrik_token";
export const USER_ID_KEY = "liefrik_user_id";

// ===== Local Storage Token Helpers =====
export function getAuth() {
  if (typeof window === "undefined") return { token: null, userId: null };
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY) || null,
      userId: localStorage.getItem(USER_ID_KEY) || null,
    };
  } catch {
    return { token: null, userId: null };
  }
}

export function setAuth({ token, userId }) {
  try {
    if (token != null) localStorage.setItem(TOKEN_KEY, token);
    if (userId != null) localStorage.setItem(USER_ID_KEY, userId);
  } catch {}
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  } catch {}
}

// ===== Backend login/register helpers =====
export async function loginWithEmail(email, password) {
  const res = await fetch("http://localhost:5517/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");

  setAuth({ token: data.token, userId: data.userId || null });
  return data;
}

export async function registerWithEmail(userData) {
  const res = await fetch("http://localhost:5517/user/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}

// ===== Google login via NextAuth =====
export function loginWithGoogle() {
  // This will redirect the user to Google login
  return signIn("google");
}

// ===== Logout =====
export async function logout() {
  clearAuth(); // clear localStorage
  return signOut(); // call NextAuth signOut if used
}

// ===== Get current session (NextAuth) =====
export async function getCurrentSession() {
  return getSession();
}
