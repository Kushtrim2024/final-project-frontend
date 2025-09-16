"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Frontend-only Order History page
 * - Fetches ALL orders once from /orders/history with a Bearer token (no backend changes).
 * - Client-side search: restaurant name(s), status, and any line item name.
 * - Client-side pagination with the style: 1 … current … last (+ Prev/Next).
 * - Rows per page selector: 4 / 6 / 8 / 10.
 * - Robust restaurant label extraction to avoid "Unknown Restaurant" whenever possible.
 * - Inline order details panel that toggles open under a card.
 * - Cancel button when order is received but no action has started yet (pending/confirmed).
 * - No TypeScript.
 */

/* ---------- Status presentation ---------- */
const STATUS_META = {
  pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", cls: "bg-indigo-100 text-indigo-700" },
  ready: { label: "Ready for Pickup", cls: "bg-teal-100 text-teal-700" },
  out_for_delivery: { label: "On the Way", cls: "bg-sky-100 text-sky-700" },
  delivered: { label: "Delivered", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status || "Unknown",
    cls: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

/* ---------- Restaurant name helpers ---------- */
/**
 * Collect unique restaurant "names" from an order, handling many shapes:
 * - order.restaurantName (string)
 * - order.restaurant.name (populated object)
 * - order.restaurantId as array/object/string (populated or raw id)
 * - item.restaurantId.name / item.restaurant.name
 * - item.productId.restaurantId.name (if product is populated with restaurant)
 *
 * If only a raw id-like string is available, we show a short hash like "#1a2b"
 * to avoid "Unknown Restaurant".
 */
function getUniqueRestaurantNames(order) {
  const names = new Set();

  const pushName = (val) => {
    if (!val) return;
    if (typeof val === "string") {
      // If it looks like a plain ObjectId-like id, show a short hash.
      const looksLikeId = /^[a-f0-9]{10,}$/i.test(val);
      names.add(looksLikeId ? `#${val.slice(-4)}` : val);
      return;
    }
    if (typeof val === "object") {
      if (typeof val.name === "string" && val.name) {
        names.add(val.name);
        return;
      }
      if (typeof val._id === "string" && val._id) {
        names.add(`#${val._id.slice(-4)}`);
        return;
      }
    }
  };

  // Order level
  if (order?.restaurantName) pushName(order.restaurantName);
  if (order?.restaurant) pushName(order.restaurant);

  if (Array.isArray(order?.restaurantId)) {
    order.restaurantId.forEach((r) => pushName(r));
  } else if (order?.restaurantId) {
    pushName(order.restaurantId);
  }

  // Line items level
  const lineItems = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.cart)
    ? order.cart
    : [];

  lineItems.forEach((it) => {
    if (it?.restaurant) pushName(it.restaurant);
    if (it?.restaurantId) pushName(it.restaurantId);
    if (it?.productId?.restaurantId) pushName(it.productId.restaurantId);
  });

  return Array.from(names);
}

/**
 * Single label for the card header:
 * - 1 found name => that name
 * - >1 names    => "Multiple Restaurants"
 * - no names    => "Unknown Restaurant"
 */
function extractRestaurantLabel(order) {
  const names = getUniqueRestaurantNames(order);
  if (names.length === 1) return names[0];
  if (names.length > 1) return "Multiple Restaurants";
  return "Unknown Restaurant";
}

/* ---------- Small helpers ---------- */
function fmtEuro(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

function canCancel(status) {
  // "order received but not yet processed" → allow for early statuses only
  return status === "pending" || status === "confirmed";
}

/* ---------- Pagination component ---------- */
/**
 * Minimal pagination that renders: 1 … current … last
 * Includes Prev/Next controls.
 */
function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const items = [];
  const pushBtn = (p, label = String(p)) =>
    items.push(
      <button
        key={label + p}
        onClick={() => onPageChange(p)}
        disabled={p === page}
        className={`px-3 h-9 rounded-lg border text-sm transition
          ${
            p === page
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white hover:bg-gray-50 border-gray-200"
          }`}
      >
        {label}
      </button>
    );

  // First page
  pushBtn(1);

  // Left ellipsis
  if (page > 3) {
    items.push(
      <span key="left-ellipsis" className="px-2 select-none">
        …
      </span>
    );
  }

  // Neighbors around the active page
  [page - 1, page, page + 1]
    .filter((p) => p > 1 && p < totalPages)
    .forEach((p) => pushBtn(p));

  // Right ellipsis
  if (page < totalPages - 2) {
    items.push(
      <span key="right-ellipsis" className="px-2 select-none">
        …
      </span>
    );
  }

  // Last page
  if (totalPages > 1) pushBtn(totalPages);

  return (
    <div className="flex items-center gap-2 justify-center mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-3 h-9 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        Prev
      </button>
      {items}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-3 h-9 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

/* ---------- Main page component ---------- */
export default function OrderHistoryPage() {
  // One-time API data
  const [rawOrders, setRawOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Client-side search (debounced) + pagination + rows per page
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(4); // Rows per page: 4 / 6 / 8 / 10

  // Inline details state
  const [openId, setOpenId] = useState(null); // which order's details are expanded
  const [cancelingId, setCancelingId] = useState(null); // show spinner/disable during cancel

  /* Debounce the search input (400ms) */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch all orders once — no backend changes required */
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          setRawOrders([]);
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5517/orders/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch orders: ${res.status} ${text}`);
        }

        const payload = await res.json();
        // Support both array response and { data: [] } response
        const arr = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
        setRawOrders(arr);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unknown error");
        setRawOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  /* Client-side filtering by search query */
  const filtered = useMemo(() => {
    if (!debouncedSearch) return rawOrders;

    const q = debouncedSearch.toLowerCase();
    const contains = (v) =>
      typeof v === "string" ? v.toLowerCase().includes(q) : false;

    return rawOrders.filter((order) => {
      const restaurantName = extractRestaurantLabel(order);
      const statusStr = String(order?.status || "");
      const itemsArr = Array.isArray(order?.items)
        ? order.items
        : Array.isArray(order?.cart)
        ? order.cart
        : [];

      const itemHit = itemsArr.some((it) =>
        contains(it?.name || it?.menuItemName || "")
      );

      return contains(restaurantName) || contains(statusStr) || itemHit;
    });
  }, [rawOrders, debouncedSearch]);

  /* Sort newest first by createdAt */
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return copy;
  }, [filtered]);

  /* Pagination math (client-side) */
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, rows)));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const paged = useMemo(() => {
    const r = Math.max(1, rows);
    const start = (pageSafe - 1) * r;
    return sorted.slice(start, start + r);
  }, [sorted, pageSafe, rows]);

  // Reset to page 1 when search or rows per page changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, rows]);

  async function cancelOrder(order) {
    if (!order?._id) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );
    if (!confirmed) return;

    try {
      setCancelingId(order._id);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `http://localhost:5517/orders/${order._id}/cancel`,
        {
          method: "POST", // change to PATCH if your backend expects PATCH
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Cancel failed: ${res.status} ${text}`);
      }

      // optimistic update – mark local order as cancelled
      setRawOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, status: "cancelled" } : o
        )
      );
    } catch (e) {
      alert(e.message || "Error occurred while cancelling.");
    } finally {
      setCancelingId(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order History</h1>
          <p className="text-sm text-gray-500">
            Review and manage your past and ongoing orders.
          </p>
        </div>

        {/* Controls: Search + Rows per page */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-72">
            <label htmlFor="search" className="sr-only">
              Search orders
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by restaurant, item, or status…"
              className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none ring-0 focus:border-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="rows"
              className="text-sm text-gray-600 whitespace-nowrap"
            >
              Rows:
            </label>
            <select
              id="rows"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value, 10))}
              className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none ring-0 focus:border-gray-400"
            >
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Meta */}
      {!loading && (
        <p className="mb-4 text-sm text-gray-500">
          {totalItems} result{totalItems === 1 ? "" : "s"} • Page {pageSafe} of{" "}
          {totalPages}
        </p>
      )}

      {/* Body */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading your orders...</p>
      ) : paged.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {paged.map((order, index) => {
              const restaurantHeader = extractRestaurantLabel(order);
              const allRestaurantNames = getUniqueRestaurantNames(order);
              const created = order?.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : "—";
              const total =
                typeof order?.total === "number"
                  ? order.total
                  : typeof order?.totalPrice === "number"
                  ? order.totalPrice
                  : 0;

              const itemsArr = Array.isArray(order?.items)
                ? order.items
                : Array.isArray(order?.cart)
                ? order.cart
                : [];

              const isOpen = openId === (order?._id || `order-${index}`);
              const cardKey = order?._id || `order-${index}`;

              return (
                <div
                  key={cardKey}
                  className="bg-white/80 border rounded-xl shadow-sm p-4 hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {restaurantHeader}
                      </p>

                      {/* Optional badges when multiple restaurants exist */}
                      {allRestaurantNames.length > 1 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {allRestaurantNames.map((n, i) => (
                            <span
                              key={`${n}-${i}`}
                              className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-700"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-sm text-gray-500">{created}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order?.status} />
                      {canCancel(order?.status) && (
                        <button
                          onClick={() => cancelOrder(order)}
                          disabled={cancelingId === order?._id}
                          className={`text-sm px-3 h-9 rounded-lg border transition ${
                            cancelingId === order?._id
                              ? "bg-gray-200 border-gray-300 text-gray-500"
                              : "bg-white hover:bg-gray-50 border-gray-200 text-red-600"
                          }`}
                          title="You can cancel if processing hasn't started"
                        >
                          {cancelingId === order?._id
                            ? "Cancelling…"
                            : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items (compact list) */}
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    {itemsArr.length > 0 ? (
                      itemsArr.map((item, idx) => (
                        <p key={item?._id || `item-${idx}`}>
                          {item?.quantity ?? 1}×{" "}
                          {item?.name || item?.menuItemName || "Item"}
                        </p>
                      ))
                    ) : (
                      <p>No items in this order.</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">
                      Total: {fmtEuro(total)}
                    </p>
                    <button
                      className="text-orange-600 hover:underline text-sm"
                      onClick={() => setOpenId(isOpen ? null : cardKey)}
                      aria-expanded={isOpen}
                      aria-controls={`details-${cardKey}`}
                    >
                      {isOpen ? "Hide Details" : "View Details"}
                    </button>
                  </div>

                  {/* Details panel */}
                  {isOpen && (
                    <div
                      id={`details-${cardKey}`}
                      className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Order Info
                          </h3>
                          <dl className="text-sm text-gray-700 space-y-1">
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Order ID</dt>
                              <dd className="font-mono">{order?._id || "—"}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Status</dt>
                              <dd>
                                <StatusBadge status={order?.status} />
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Created</dt>
                              <dd>
                                {order?.createdAt
                                  ? new Date(order.createdAt).toLocaleString()
                                  : "—"}
                              </dd>
                            </div>
                            {order?.updatedAt && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Updated</dt>
                                <dd>
                                  {new Date(order.updatedAt).toLocaleString()}
                                </dd>
                              </div>
                            )}
                            {order?.paymentMethod && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Payment</dt>
                                <dd>{String(order.paymentMethod)}</dd>
                              </div>
                            )}
                            {(order?.address || order?.deliveryAddress) && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Delivery</dt>
                                <dd
                                  className="text-right max-w-[65%] truncate"
                                  title={
                                    order?.address || order?.deliveryAddress
                                  }
                                >
                                  {order?.address || order?.deliveryAddress}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            Items
                          </h3>
                          <ul className="text-sm text-gray-700 divide-y divide-gray-200 rounded-lg overflow-hidden border border-gray-200 bg-white">
                            {itemsArr.length > 0 ? (
                              itemsArr.map((it, i) => {
                                const lineTotal =
                                  (it?.price || it?.unitPrice || 0) *
                                  (it?.quantity ?? 1);
                                return (
                                  <li
                                    key={it?._id || `detail-item-${i}`}
                                    className="px-3 py-2 flex items-start justify-between gap-3"
                                  >
                                    <div>
                                      <p className="font-medium">
                                        {it?.name || it?.menuItemName || "Item"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {it?.options &&
                                        Array.isArray(it.options) &&
                                        it.options.length
                                          ? it.options
                                              .map((o) => o?.name || o)
                                              .join(", ")
                                          : null}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-500">
                                        {it?.quantity ?? 1} ×{" "}
                                        {fmtEuro(
                                          it?.price || it?.unitPrice || 0
                                        )}
                                      </p>
                                      <p className="font-medium">
                                        {fmtEuro(lineTotal)}
                                      </p>
                                    </div>
                                  </li>
                                );
                              })
                            ) : (
                              <li className="px-3 py-2 text-sm text-gray-500">
                                No items found.
                              </li>
                            )}
                          </ul>
                          <div className="flex items-center justify-end gap-6 mt-3 text-sm">
                            {typeof order?.subtotal === "number" && (
                              <div className="flex gap-2">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">
                                  {fmtEuro(order.subtotal)}
                                </span>
                              </div>
                            )}
                            {typeof order?.deliveryFee === "number" && (
                              <div className="flex gap-2">
                                <span className="text-gray-500">Delivery</span>
                                <span className="font-medium">
                                  {fmtEuro(order.deliveryFee)}
                                </span>
                              </div>
                            )}
                            {typeof order?.tax === "number" && (
                              <div className="flex gap-2">
                                <span className="text-gray-500">Tax</span>
                                <span className="font-medium">
                                  {fmtEuro(order.tax)}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <span className="text-gray-500">Total</span>
                              <span className="font-semibold">
                                {fmtEuro(total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Secondary actions in details */}
                      <div className="mt-4 flex items-center justify-end gap-2">
                        {canCancel(order?.status) && (
                          <button
                            onClick={() => cancelOrder(order)}
                            disabled={cancelingId === order?._id}
                            className={`px-4 h-10 rounded-xl border text-sm transition ${
                              cancelingId === order?._id
                                ? "bg-gray-200 border-gray-300 text-gray-500"
                                : "bg-white hover:bg-gray-100 border-red-200 text-red-600"
                            }`}
                          >
                            {cancelingId === order?._id
                              ? "Cancelling…"
                              : "Cancel Order"}
                          </button>
                        )}
                        <button
                          onClick={() => setOpenId(null)}
                          className="px-4 h-10 rounded-xl border border-gray-300 bg-white text-sm hover:bg-gray-100"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            page={pageSafe}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
}
