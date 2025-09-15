"use client";

import { useEffect, useMemo, useState, Fragment } from "react";

export default function OrderManagementPage() {
  // ---------- State ----------
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4); // 4, 6, 8, 10

  // Inline details (between rows)
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({}); // { [orderId]: detail }
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // ---------- Config & helpers ----------
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5517";

  // Owner endpoints
  const ORDERS_ENDPOINTS = {
    list: "/owner/restaurants/my-restaurant/orders", // GET
    updateStatus: "/owner/restaurants/my-restaurant/orders/update-status", // PUT { orderId, newStatus }
    remove: (id) => `/owner/restaurants/my-restaurant/orders/${id}`, // DELETE
    details: (id) => `/owner/restaurants/my-restaurant/orders/details/${id}`, // GET
  };

  function getAuthToken() {
    if (typeof window === "undefined") return null;
    const fromLocal =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt");
    if (fromLocal) return fromLocal;
    const m = document.cookie.match(
      /(?:^|; )(?:token|accessToken|jwt)=([^;]+)/
    );
    return m ? decodeURIComponent(m[1]) : null;
  }

  function authHeaders() {
    const token = getAuthToken();
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }

  const STATUS_OPTIONS = [
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "ready",
    "delivered",
    "cancelled",
  ];

  function showToast(text, type = "success") {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2600);
  }

  // ---------- Fetch list ----------
  async function fetchOrders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}${ORDERS_ENDPOINTS.list}`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Failed to load orders (${res.status})`);
      }
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : data.orders || [];
      setOrders(normalized);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "An error has occurred.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Filter + Pagination ----------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus =
        statusFilter === "all" ||
        (o.status || "").toLowerCase() === statusFilter;

      if (!q) return matchesStatus;

      const id = o._id || o.id || "";
      const customer =
        o.user?.name ||
        o.user?.fullName ||
        o.customerName ||
        o.userId?.name ||
        "";
      const restaurantName = o.restaurantId?.name || o.restaurant?.name || "";
      const restaurantNames = Array.isArray(o.restaurants)
        ? o.restaurants.map((r) => r?.name || r).join(", ")
        : restaurantName;

      const itemsArr = Array.isArray(o.items) ? o.items : o.orderItems || [];
      const itemsText = itemsArr
        .map(
          (it) =>
            it?.name ||
            it?.title ||
            it?.menuItem?.name ||
            `${it?.quantity || 1}x item`
        )
        .join(", ");

      const blob =
        `${id} ${customer} ${restaurantNames} ${itemsText}`.toLowerCase();
      return matchesStatus && blob.includes(q);
    });
  }, [orders, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedOrderId(null); // collapse details when filters change
  }, [search, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);

  function buildPaginationModel(current, total) {
    if (total <= 1) return [];
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);
    const first = 1;
    const last = total;
    if (current <= 2) return [1, 2, "…", last];
    if (current >= total - 1) return [1, "…", total - 1, total];
    return [first, "…", current, "…", last];
  }

  // ---------- Mutations ----------
  async function updateStatus(orderId, newStatus) {
    try {
      const res = await fetch(`${API_BASE}${ORDERS_ENDPOINTS.updateStatus}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ orderId, newStatus }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Status could not be updated (${res.status}).`);
      }
      // Update list
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId || o.id === orderId
            ? {
                ...o,
                status: newStatus,
                items: Array.isArray(o.items)
                  ? o.items.map((it) => ({ ...it, status: newStatus }))
                  : o.items,
              }
            : o
        )
      );
      // Update details cache if visible
      setDetailsCache((prev) => {
        if (!prev[orderId]) return prev;
        return { ...prev, [orderId]: { ...prev[orderId], status: newStatus } };
      });
      showToast("Order status updated.");
    } catch (err) {
      showToast(err.message || "Update error", "error");
    }
  }

  async function removeOrder(orderId) {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(
        `${API_BASE}${ORDERS_ENDPOINTS.remove(orderId)}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Could not delete the order (${res.status}).`);
      }
      setOrders((prev) => prev.filter((o) => (o._id || o.id) !== orderId));
      setExpandedOrderId((prev) => (prev === orderId ? null : prev));
      showToast("The order has been deleted.");
    } catch (err) {
      showToast(err.message || "Delete error", "error");
    }
  }

  async function toggleDetails(orderId) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setDetailsError("");
      return;
    }
    setExpandedOrderId(orderId);
    setDetailsError("");

    if (detailsCache[orderId]) return;

    setDetailsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}${ORDERS_ENDPOINTS.details(orderId)}`,
        {
          headers: authHeaders(),
        }
      );

      if (res.ok) {
        const detail = await res.json();
        setDetailsCache((prev) => ({
          ...prev,
          [orderId]: detail?.order || detail,
        }));
      } else if (res.status === 403 || res.status === 404) {
        // Fallback to local row data, mark as limited
        const local = orders.find((o) => (o._id || o.id) === orderId);
        if (local) {
          setDetailsCache((prev) => ({
            ...prev,
            [orderId]: { ...local, _limited: true },
          }));
        } else {
          const t = await res.text();
          throw new Error(t || `Failed to load details (${res.status})`);
        }
      } else {
        const t = await res.text();
        throw new Error(t || `Failed to load details (${res.status})`);
      }
    } catch (err) {
      setDetailsError(err.message || "Failed to load details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  // ---------- Inline details renderer ----------
  function renderDetailsRow(orderId, colSpan) {
    if (expandedOrderId !== orderId) return null;
    const detail = detailsCache[orderId];

    return (
      <tr key={`${orderId}-details`}>
        <td colSpan={colSpan} className="bg-gray-50 px-4 py-4">
          {detailsLoading && (
            <div className="text-sm text-gray-600">Loading order details…</div>
          )}

          {!detailsLoading && !detailsError && detail && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-gray-500">Order ID</div>
                  <div className="font-medium">{detail._id || "-"}</div>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-medium capitalize">
                    {detail.status || "-"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-gray-500">Customer</div>
                  <div className="font-medium">
                    {detail.customerName || detail.userId?.name || "-"}
                  </div>
                </div>
              </div>

              {/* Items table */}
              <div className="rounded-2xl border bg-white">
                <div className="border-b px-4 py-3 font-medium">Items</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Size</th>
                        <th className="px-4 py-2 text-left">Add-ons</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.items || []).map((it, idx) => {
                        const name =
                          it.name || it.title || it.productId?.name || "Item";
                        const size =
                          it.size ||
                          it.sizeLabel ||
                          (typeof it.selectedSize === "string"
                            ? it.selectedSize
                            : "");
                        const addOnList = Array.isArray(it.addOns)
                          ? it.addOns
                          : [];
                        const addOnNames = addOnList
                          .map((a) => {
                            if (!a) return null;
                            if (typeof a === "string") return a; // fallback to id string
                            return (
                              a.name || a.label || a.title || a._id || null
                            );
                          })
                          .filter(Boolean)
                          .join(", ");
                        const qty = it.quantity || 1;
                        const unit =
                          typeof it.price === "number"
                            ? it.price
                            : typeof it.unitPrice === "number"
                            ? it.unitPrice
                            : null;
                        const subtotal =
                          typeof it.total === "number"
                            ? it.total
                            : unit != null
                            ? unit * qty
                            : null;

                        return (
                          <tr key={`item-${idx}`} className="border-t">
                            <td className="px-4 py-2">{name}</td>
                            <td className="px-4 py-2">{size || "-"}</td>
                            <td className="px-4 py-2">
                              {addOnNames ||
                                (addOnList.length
                                  ? `${addOnList.length} add-on(s)`
                                  : "-")}
                            </td>
                            <td className="px-4 py-2 text-right">{qty}</td>
                            <td className="px-4 py-2 text-right">
                              {unit != null ? `${unit.toFixed(2)} €` : "-"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {subtotal != null
                                ? `${subtotal.toFixed(2)} €`
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="flex flex-wrap items-center justify-end gap-3 border-t px-4 py-3 text-sm">
                  <div className="text-gray-600">Total:</div>
                  <div className="font-semibold">
                    {typeof detail.total === "number"
                      ? `${detail.total.toFixed(2)} €`
                      : detail.totalAmount ??
                        detail.amount ??
                        detail.price ??
                        detail.totalPrice ??
                        "-"}
                  </div>
                </div>
              </div>

              {/* Extra info */}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-gray-500">Payment</div>
                  <div className="font-medium">
                    {detail.paymentMethod || "-"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-gray-500">Delivery</div>
                  <div className="font-medium">
                    {detail.deliveryType || "-"}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-3">
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-medium">
                    {detail.createdAt
                      ? new Date(detail.createdAt).toLocaleString()
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </td>
      </tr>
    );
  }

  // ---------- Pagination Bar ----------
  const PaginationBar = () =>
    totalPages > 1 ? (
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-medium">{filtered.length ? start + 1 : 0}</span>{" "}
          to{" "}
          <span className="font-medium">{Math.min(end, filtered.length)}</span>{" "}
          of <span className="font-medium">{filtered.length}</span> orders
        </div>

        <nav className="flex items-center gap-2" aria-label="Pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Prev
          </button>

          {buildPaginationModel(currentPage, totalPages).map((token, i) =>
            token === "…" ? (
              <span key={`e-${i}`} className="px-2 text-gray-500">
                …
              </span>
            ) : (
              <button
                key={`p-${token}`}
                onClick={() => setCurrentPage(token)}
                className={`rounded-xl px-3 py-1.5 text-sm border ${
                  currentPage === token
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {token}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      </div>
    ) : null;

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Order Management
            </h1>
            <p className="text-sm text-gray-500">
              List, edit, and delete orders from the restaurant you are logged
              into.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition shadow"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: customer, item, orderId…"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Rows per page */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2">
            <span className="text-sm text-gray-600">Rows:</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="ml-2 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {[4, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TOP Pagination */}
      <div className="max-w-7xl mx-auto px-4">
        <PaginationBar />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Order</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Items</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((o, i) => {
                    const id = o._id || o.id;
                    const rowKey = id || `idx-${i}`;

                    const customer =
                      o.user?.name ||
                      o.user?.fullName ||
                      o.customerName ||
                      o.userId?.name ||
                      "-";

                    const items = Array.isArray(o.items)
                      ? o.items
                      : o.orderItems || [];
                    const itemsText = items.length
                      ? items
                          .map(
                            (it) =>
                              it?.name ||
                              it?.title ||
                              it?.menuItem?.name ||
                              `${it?.quantity || 1}x item`
                          )
                          .slice(0, 3)
                          .join(", ") + (items.length > 3 ? "…" : "")
                      : "-";

                    const total =
                      typeof o.total === "number"
                        ? o.total
                        : o.totalAmount ?? o.amount ?? o.price ?? o.totalPrice;

                    const status = o.status || "pending";
                    const created =
                      o.createdAt || o.orderTime || o.timestamp || o.updatedAt;

                    return (
                      <Fragment key={rowKey}>
                        <tr className="border-t">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {id ? id.slice(-6) : "-"}
                          </td>
                          <td className="px-4 py-3">{customer || "-"}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {itemsText}
                          </td>
                          <td className="px-4 py-3">
                            {typeof total === "number"
                              ? `${total.toFixed(2)} €`
                              : total || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="hidden md:inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
                                {status}
                              </span>
                              <select
                                value={status}
                                onChange={(e) =>
                                  updateStatus(id, e.target.value)
                                }
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {created ? new Date(created).toLocaleString() : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleDetails(id)}
                                className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
                              >
                                {expandedOrderId === id ? "Hide" : "Details"}
                              </button>
                              <button
                                onClick={() => removeOrder(id)}
                                className="rounded-xl bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline details row (between orders) */}
                        {renderDetailsRow(id, 7)}
                      </Fragment>
                    );
                  })}

                  {!pageRows.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No records found on this page.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BOTTOM Pagination */}
            <PaginationBar />
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-xl px-4 py-2 shadow-lg ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-900 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
