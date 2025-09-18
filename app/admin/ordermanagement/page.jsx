"use client";

import React, { useEffect, useMemo, useState } from "react";
import CSVExportButton from "../componentsadmin/CSVExportButton.jsx";
import { API_BASE } from "../../lib/api.js";

const BASE = process.env.NEXT_PUBLIC_API_BASE_ORDERS || API_BASE;

/* ================= Helpers ================= */

// Read token with possible keys in localStorage
const readTokenFromStorage = () => {
  if (typeof window === "undefined") return "";
  const keys = ["adminToken", "token", "accessToken", "jwt", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return "";
};

// Find the array wherever it is in the incoming data
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

// Text that can be written to the table; if an object arrives, select the appropriate fields or short JSON
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

// Şemanda address String; ama olası object dönüşlerini de nazikçe işleyelim
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

/** Backend -> UI status mapping (Order schema ile uyumlu) */
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

/** UI -> Backend status mapping (Order schema ile uyumlu) */
const uiToApiStatus = (s) => {
  const x = String(s || "").toLowerCase();
  if (x.includes("pending")) return "pending";
  if (x.includes("confirm")) return "confirmed";
  if (x.includes("prepar")) return "preparing";
  if (x.includes("ready")) return "ready";
  if (x.includes("out for delivery") || x.includes("out_for_delivery"))
    return "out_for_delivery";
  if (x.includes("deliver")) return "delivered";
  if (x.includes("cancel")) return "cancelled";
  return "pending"; // güvenli default
};

// Rozet renkleri
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

/* ================= Page ================= */

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]); // {id, customer, restaurant, date, status}
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false);

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [details, setDetails] = useState(null); // fetched details
  const [modalType, setModalType] = useState(null); // "update" | "details"
  const [newStatus, setNewStatus] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /* ===== Fetch Orders ===== */
  const fetchOrders = async (tk) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${BASE}/admin/orders`, {
        headers: { Authorization: `Bearer ${tk}` },
        cache: "no-store",
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }
      if (!res.ok)
        throw new Error(data?.message || text || `HTTP ${res.status}`);

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
    } finally {
      setLoading(false);
    }
  };

  // token load + react to changes/focus
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

  // fetch on token available
  useEffect(() => {
    if (!tokenChecked) return;
    if (!token) {
      setLoading(false);
      setErr("Error: Login (token) not found. Please log in as admin.");
      return;
    }
    fetchOrders(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenChecked, token]);

  // paging derive
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

  // --- Modal helpers ---
  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    // order.status UI metni; yine de güvenli olsun:
    setNewStatus(apiToUiStatus(order.status) || "Pending");
    setModalType("update");
  };

  const openDetailsModal = async (order) => {
    setSelectedOrder(order);
    setModalType("details");
    setDetails(null);
    try {
      const res = await fetch(`${BASE}/admin/orders/details/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok)
        throw new Error(data?.message || text || `HTTP ${res.status}`);
      setDetails(data);
    } catch (e) {
      setDetails({ error: e.message || "Details could not be loaded" });
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setNewStatus("");
    setDetails(null);
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.id;
    const apiStatus = uiToApiStatus(newStatus);

    // optimistic update
    const prev = orders;
    setOrders((p) =>
      p.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch(`${BASE}/admin/orders/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, newStatus: apiStatus }),
      });
      const t = await res.text();
      if (!res.ok) {
        let msg = "";
        try {
          msg = JSON.parse(t)?.message || t;
        } catch {
          msg = t;
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      closeModal();
    } catch (e) {
      // rollback
      setOrders(prev);
      alert(e.message || "Update failed");
    }
  };

  if (!tokenChecked) return <div className="p-4">Checking…</div>;
  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;

  // CSV export headers
  const csvHeaders = [
    { label: "Order ID", key: "id" },
    { label: "Customer", key: "customer" },
    { label: "Restaurant", key: "restaurant" },
    { label: "Date", key: "date" },
    { label: "Status", key: "status" },
  ];

  return (
    <div className="min-h-screen ">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 max-[1200px]:text-[16px]">
        Order Management
      </h1>

      <label className="text-sm text-gray-800 max-[750px]:hidden mr-2">
        Rows :
      </label>
      <select
        className="border rounded px-2 py-1 mb-4"
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

      <div className="text-sm text-gray-800 mb-4">
        Page <span className="font-semibold">{page}</span>&nbsp;/&nbsp;
        {totalPages}&nbsp;•&nbsp;
        <span className="font-semibold">{totalItems}</span>&nbsp;items
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
                      onClick={() => openUpdateModal(order)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetailsModal(order)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium px-3 py-1 rounded"
                    >
                      Details
                    </button>
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
      {selectedOrder && modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            {modalType === "update" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  Update Order Status
                </h2>
                <p className="mb-2 text-gray-800">
                  <strong>Order ID:</strong> {safeText(selectedOrder.id)}
                </p>
                <label className="block mb-4 text-gray-800">
                  <span className="text-gray-800">New Status:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option>Pending</option>
                    <option>Confirmed</option>
                    <option>Preparing</option>
                    <option>Ready for Pickup</option>
                    <option>Out for Delivery</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </label>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </>
            )}

            {modalType === "details" && (
              <>
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
                      {safeText(
                        apiToUiStatus(details.status || selectedOrder.status)
                      )}
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

                    {/* items (schema) */}
                    {Array.isArray(details.items) &&
                      details.items.length > 0 && (
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
                                {safeText(it?.menuItem?.name || it?.menuItemId)}
                                × {safeText(it?.quantity)}
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

                {/* CSV Export Button  */}
                <div className="mt-6">
                  <CSVExportButton data={orders} headers={csvHeaders} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CSV Export Button (page bottom) */}
      <div className="mt-6 max-[1200px]:text-[12px]">
        <CSVExportButton data={orders} headers={csvHeaders} />
      </div>
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

  // Standart: 1 … current … total
  const getPageButtons = (current, total) => {
    if (total <= 1) return [1];

    current = Math.max(1, Math.min(current, total));

    if (total === 2) return [1, 2];
    if (total === 3) return Array.from(new Set([1, current, total]));

    if (current === 1 || current === total) {
      return [1, "…", total];
    }

    const out = [1];
    if (current > 2) out.push("…");
    out.push(current);
    if (current < total - 1) out.push("…");
    out.push(total);
    return out;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3  bg-white mt-4 rounded-lg">
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
