// lib/auth.js
export const TOKEN_KEY = "liefrik_token";
export const USER_ID_KEY = "liefrik_user_id";

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
