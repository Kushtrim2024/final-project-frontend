// lib/cartApi.js
import { getAuth } from "./auth";
import { API_BASE } from "../lib/api.js";
const API_CART_BASE = process.env.NEXT_PUBLIC_CART_API_BASE || API_BASE;

async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const { token } = getAuth();
  const h = { "Content-Type": "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_CART_BASE}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const txt = await res.text();
  let json = null;
  try {
    json = txt ? JSON.parse(txt) : null;
  } catch {}
  if (!res.ok) {
    throw new Error(json?.message || res.statusText || "Request failed");
  }
  return json;
}

export function addToCart({ userId, menuItemId, quantity, size, addOns }) {
  return apiFetch("/cart/add", {
    method: "POST",
    body: { userId, menuItemId, quantity, size, addOns },
  });
}

export async function getCart(userId) {
  return apiFetch(`/cart/${userId}`, { method: "GET" });
}

export function choosePayment({ userId, paymentMethod }) {
  return apiFetch("/cart/choose-payment", {
    method: "POST",
    body: { userId, paymentMethod },
  });
}

export function checkoutCart(payload) {
  // {userId, restaurantId, customerName, phone, address, deliveryType, paymentMethod, paymentDetails?}
  return apiFetch("/cart/checkout", { method: "POST", body: payload });
}
