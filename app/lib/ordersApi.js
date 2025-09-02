// lib/ordersApi.js
import { getAuth } from "./auth";

const API_BASE =
  process.env.NEXT_PUBLIC_CART_API_BASE || "http://localhost:5517";

async function api(path, { method = "GET", body } = {}) {
  const { token } = getAuth();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const txt = await res.text();
  let json = null;
  try {
    json = txt ? JSON.parse(txt) : null;
  } catch {}
  if (!res.ok) throw new Error(json?.message || res.statusText);
  return json;
}

export const getOrders = () => api("/orders", { method: "GET" });
export const getOrderById = (id) => api(`/orders/${id}`, { method: "GET" });
