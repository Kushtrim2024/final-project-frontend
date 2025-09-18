import { API_BASE } from "../../lib/api.js";
const API_BASEx = process.env.NEXT_PUBLIC_API_URL || API_BASE;

// optional: Token aus LocalStorage lesen (falls euer Backend JWT nutzt)
function readToken() {
  if (typeof window === "undefined") return "";
  const keys = [
    "ownerToken",
    "adminToken",
    "token",
    "accessToken",
    "jwt",
    "authToken",
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return "";
}

function authHeaders() {
  const tk = readToken();
  return tk ? { Authorization: `Bearer ${tk}` } : {};
}

/** Liste: GET /orders (erlaubt: user, owner, admin) */
export async function getAllOrders() {
  const res = await fetch(`${API_BASEx}/orders`, {
    method: "GET",
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Details: GET /orders/details/:id */
export async function getOrderDetails(id) {
  const res = await fetch(`${API_BASEx}/orders/details/${id}`, {
    method: "GET",
    headers: { ...authHeaders() },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Update: PUT /orders/:orderId  (Backend erlaubt hier NUR role "user") */
export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${API_BASEx}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
