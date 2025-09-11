"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ============= API-Root: über Next-Rewrite /api → http://localhost:5517 ============= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_ORDERS || ""; // leer = relativer Proxy
const ROOT = API_BASE ? API_BASE : "/api"; // z.B. "/api"

/* ================= Helpers ================= */

// Token aus LocalStorage lesen (Owner & generische Keys)
const readTokenFromStorage = () => {
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
};

// Erstbeste Array-Liste aus beliebigen Response-Formaten ziehen
const pickFirstArray = (obj) => {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const preferred = ["orders", "items", "data", "results", "list"];
    for (const k of preferred) {
      if (Array.isArray(obj?.[k])) return obj[k];
      if (Array.isArray(obj?.[k]?.items)) return obj[k].items;
    }
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v;
      if (v && typeof v === "object" && Array.isArray(v.items)) return v.items;
    }
  }
  return [];
};

const safeText = (v) => {
  if (v == null) return "";
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return String(v);
  if (t === "object") {
    return (
      v.name ||
      v.fullName ||
      v.restaurantName ||
      v.email ||
      v.title ||
      v._id ||
      JSON.stringify(v)
    );
  }
  return String(v);
};

const formatAddress = (a) =>
  typeof a === "string"
    ? a
    : [a?.street, a?.city, a?.postalCode, a?.country]
        .filter(Boolean)
        .join(", ");

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
  } catch {
    return iso || "";
  }
};

const getStatusBadge = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("pending")) return "bg-gray-100 text-gray-700";
  if (s.includes("confirm")) return "bg-blue-100 text-blue-700";
  if (s.includes("prepar")) return "bg-yellow-100 text-yellow-700";
  if (s.includes("ready")) return "bg-indigo-100 text-indigo-700";
  if (s.includes("out for delivery")) return "bg-purple-100 text-purple-700";
  if (s.includes("deliver")) return "bg-green-100 text-green-700";
  if (s.includes("cancel")) return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

const apiToUiStatus = (s) => {
  const x = String(s || "").toLowerCase();
  switch (x) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready for Pickup";
    case "out_for_delivery":
      return "Out for Delivery";
    case "delivered":
      return "Delivered";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    default:
      return "Pending";
  }
};

/* =============== Login Box =============== */
function LoginBox({ onSuccess }) {
  const [role, setRole] = useState("owner");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const endpoints = {
    owner: `${ROOT}/owner/login`,
    user: `${ROOT}/user/login`,
    admin: `${ROOT}/admin/login`,
  };

  const doLogin = async () => {
    setBusy(true);
    setMsg("");
    try {
      const path = endpoints[role] || endpoints.owner;
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Cookie-Login unterstützen
        body: JSON.stringify({ email, password: pw }),
      });

      const ctype = res.headers.get("content-type") || "";
      const isJson = ctype.includes("application/json");
      const data = isJson ? await res.json() : {};

      if (!res.ok) {
        const serverMsg = data?.message || data?.error || `HTTP ${res.status}`;
        throw new Error(serverMsg);
      }

      // Token, falls vorhanden
      const token =
        data?.token ||
        data?.accessToken ||
        data?.jwt ||
        data?.data?.token ||
        data?.result?.token ||
        "";

      if (token) localStorage.setItem("ownerToken", token);

      setMsg("Login erfolgreich.");
      onSuccess(token || null); // Orders neu laden
    } catch (e) {
      setMsg(e.message || "Login fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const clearTokens = () => {
    [
      "ownerToken",
      "adminToken",
      "token",
      "accessToken",
      "jwt",
      "authToken",
      "restaurantToken",
    ].forEach((k) => localStorage.removeItem(k));
    setMsg("Token gelöscht.");
    onSuccess(null);
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base font-semibold text-gray-900">
          Login (Owner/User/Admin)
        </h2>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="owner">owner</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Passwort"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={doLogin}
          disabled={busy || !email || !pw}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded"
        >
          {busy ? "Einloggen…" : "Einloggen"}
        </button>
        <button
          onClick={clearTokens}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm px-3 py-2 rounded"
        >
          Token löschen
        </button>
      </div>

      {msg && <div className="mt-2 text-sm text-gray-700">{msg}</div>}

      <div className="mt-1 text-xs text-gray-500">
        Hinweis: Wenn euer Backend nur ein Cookie setzt (kein Token im Body),
        reicht der Login trotzdem – Requests senden{" "}
        <code>credentials: "include"</code>.
      </div>
    </div>
  );
}

/* ================= Page ================= */

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false);

  // Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [details, setDetails] = useState(null);
  const [modalType, setModalType] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /* ===== Orders laden ===== */
  const fetchOrders = async (tk) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${ROOT}/orders`, {
        headers: tk ? { Authorization: `Bearer ${tk}` } : {},
        credentials: "include",
        cache: "no-store",
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (!res.ok) {
        if (res.status === 401)
          throw new Error(
            "401: Nicht eingeloggt (Token/Cookie fehlt oder abgelaufen)."
          );
        if (res.status === 403) {
          const msg =
            (Array.isArray(data) ? null : data?.message) || text || "Forbidden";
          throw new Error(`403: ${msg}`);
        }
        if (res.status === 404)
          throw new Error("404: Pfad /orders nicht gefunden (Backend prüfen).");
        throw new Error(
          (!Array.isArray(data) && data?.message) ||
            text ||
            `HTTP ${res.status}`
        );
      }

      const list = pickFirstArray(data);
      const mapped = list.map((o, i) => {
        const customerObj = o?.customer || o?.user;
        const restaurantObj = o?.restaurant;
        return {
          id: o?._id || o?.id || `row-${i}`,
          customer: safeText(
            o?.customerName ?? customerObj ?? o?.userName ?? o?.userEmail
          ),
          restaurant: safeText(
            o?.restaurantName ?? restaurantObj ?? o?.restaurantId
          ),
          date: formatDate(
            o?.createdAt ||
              o?.orderTime ||
              o?.updatedAt ||
              new Date().toISOString()
          ),
          status: apiToUiStatus(o?.status || o?.orderStatus || "pending"),
        };
      });
      setOrders(mapped);
    } catch (e) {
      setErr(e.message || "Orders could not be loaded");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Token laden + auf Änderungen reagieren
  useEffect(() => {
    const t = readTokenFromStorage();
    if (t) setToken(t);
    setTokenChecked(true);
    const onStorage = () => setToken(readTokenFromStorage());
    const onFocus = onStorage;
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onFocus);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onFocus);
      }
    };
  }, []);

  // Laden sobald Token geprüft
  useEffect(() => {
    if (!tokenChecked) return;
    fetchOrders(token || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenChecked, token]);

  // Paging ableiten
  const totalItems = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    setPage((p) => clamp(p, 1, totalPages));
  }, [totalItems, pageSize]);

  const start = (page - 1) * pageSize;
  const pageRows = useMemo(
    () => orders.slice(start, start + pageSize),
    [orders, start, pageSize]
  );

  // Details
  const openDetailsModal = async (order) => {
    setSelectedOrder(order);
    setModalType("details");
    setDetails(null);
    try {
      const res = await fetch(`${ROOT}/orders/details/${order.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        if (res.status === 403) {
          const msg = data?.message || text || "Forbidden";
          throw new Error(`403: ${msg}`);
        }
        throw new Error(data?.message || text || `HTTP ${res.status}`);
      }
      setDetails(data);
    } catch (e) {
      setDetails({ error: e.message || "Details could not be loaded" });
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setDetails(null);
  };

  /* ===== UI ===== */
  if (!tokenChecked) return <div className="p-4">Checking…</div>;
  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="min-h-screen ">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 max-[1200px]:text-[16px]">
        Owner – Order Management
      </h1>

      {/* Login/Registrieren anzeigen, wenn kein Token oder 401 */}
      {(!token || /401/.test(err)) && (
        <LoginBox
          onSuccess={(tk) => {
            if (tk) setToken(tk); // JWT merken, falls vorhanden
            fetchOrders(tk || ""); // Orders neu laden (JWT oder Cookie)
          }}
        />
      )}

      {err && (
        <div className="p-3 mb-4 rounded bg-red-50 text-red-700 border border-red-200">
          {err}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm text-gray-800">Rows :</label>
        <select
          className="border rounded px-2 py-1"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {[6, 12, 24, 48].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-800 ml-auto">
          Page <span className="font-semibold">{page}</span>&nbsp;/&nbsp;
          {totalPages}&nbsp;•&nbsp;
          <span className="font-semibold">{totalItems}</span>&nbsp;items
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm text-left text-gray-900">
          <thead className="bg-gray-100 text-base font-semibold max-[1200px]:text-[14px]">
            <tr>
              <th className="px-6 py-4 border-b">Order ID</th>
              <th className="px-6 py-4 border-b">Customer</th>
              <th className="px-6 py-4 border-b">Restaurant</th>
              <th className="px-6 py-4 border-b">Date</th>
              <th className="px-6 py-4 border-b">Status</th>
              <th className="px-6 py-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageRows.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-gray-600" colSpan={6}>
                  No orders.
                </td>
              </tr>
            ) : (
              pageRows.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition max-[1200px]:text-[14px]"
                >
                  <td className="px-6 py-4">{safeText(order.id)}</td>
                  <td className="px-6 py-4">{safeText(order.customer)}</td>
                  <td className="px-6 py-4">{safeText(order.restaurant)}</td>
                  <td className="px-6 py-4">{safeText(order.date)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {safeText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openDetailsModal(order)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium px-3 py-1 rounded"
                    >
                      Details
                    </button>
                    {/* Kein Update: Backend-Route PUT /orders/:id erlaubt evtl. nicht Owner.
                        Wenn gewünscht, später leicht ergänzen. */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <PaginationControls
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalItems={totalItems}
      />

      {/* Modal */}
      {selectedOrder && modalType === "details" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Order Details
            </h2>
            {details?.error ? (
              <div className="text-red-600">{details.error}</div>
            ) : !details ? (
              <div className="text-gray-600">Loading…</div>
            ) : (
              <div className="text-gray-800 space-y-2">
                <p>
                  <strong>Order ID:</strong> {safeText(selectedOrder.id)}
                </p>
                <p>
                  <strong>Customer:</strong>{" "}
                  {safeText(
                    details.customer ||
                      details.customerName ||
                      selectedOrder.customer
                  )}
                </p>
                <p>
                  <strong>Restaurant:</strong>{" "}
                  {safeText(
                    details.restaurant ||
                      details.restaurant?.restaurantName ||
                      details.restaurantName ||
                      selectedOrder.restaurant
                  )}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {safeText(
                    formatDate(
                      details.createdAt ||
                        details.orderTime ||
                        selectedOrder.date
                    )
                  )}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {safeText(apiToUiStatus(details.status || "pending"))}
                </p>

                {details.phone && (
                  <p>
                    <strong>Phone:</strong> {safeText(details.phone)}
                  </p>
                )}
                {details.address && (
                  <p>
                    <strong>Address:</strong>{" "}
                    {safeText(formatAddress(details.address))}
                  </p>
                )}

                {Array.isArray(details.items) && details.items.length > 0 && (
                  <div className="pt-2">
                    <strong>Items:</strong>
                    <ul className="list-disc ml-5">
                      {details.items.map((it, idx) => (
                        <li key={idx}>
                          {safeText(it?.name || it?.productId)} ×{" "}
                          {safeText(it?.quantity)}{" "}
                          {it?.total != null
                            ? `— ${safeText(it.total)}`
                            : it?.price != null
                            ? `— ${safeText(it.price)}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!details.items &&
                  Array.isArray(details.cart) &&
                  details.cart.length > 0 && (
                    <div className="pt-2">
                      <strong>Items:</strong>
                      <ul className="list-disc ml-5">
                        {details.cart.map((it, idx) => (
                          <li key={idx}>
                            {safeText(it?.menuItem?.name || it?.menuItemId)} ×{" "}
                            {safeText(it?.quantity)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Pagination Controls  ===== */
function PaginationControls({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const getPageButtons = (current, total) => {
    if (total <= 1) return [1];
    current = Math.max(1, Math.min(current, total));
    if (total === 2) return [1, 2];
    if (total === 3) return Array.from(new Set([1, current, total]));
    if (current === 1 || current === total) return [1, "…", total];

    const out = [1];
    if (current > 2) out.push("…");
    out.push(current);
    if (current < total - 1) out.push("…");
    out.push(total);
    return out;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white mt-4 rounded-lg">
      <div className="flex items-center gap-2 text-gray-800">
        <button
          type="button"
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {getPageButtons(page, totalPages).map((n, idx) =>
            n === "…" ? (
              <span key={`ellipsis-${idx}`} className="px-2 select-none">
                …
              </span>
            ) : (
              <button
                key={`pg-${n}`}
                type="button"
                aria-current={page === n ? "page" : undefined}
                className={`px-3 py-1 border rounded ${
                  page === n ? "bg-gray-800 text-white" : "hover:bg-gray-100"
                }`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
