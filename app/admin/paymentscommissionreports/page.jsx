"use client";

import React, { useEffect, useMemo, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5517";

/* ================= Helpers ================= */

// Read token from localStorage (flexible for different key names)
const readTokenFromStorage = () => {
  if (typeof window === "undefined") return "";
  const keys = ["adminToken", "token", "accessToken", "jwt", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return "";
};

// Safe text (select the meaningful field from the objects; otherwise short JSON)
const safeText = (v) => {
  if (v == null) return "";
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return String(v);
  if (t === "object") {
    return (
      v.restaurantName ||
      v.name ||
      v.fullName ||
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

const pickArray = (obj) => {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const preferred = ["restaurants", "items", "data", "results", "list"];
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

// Backend status -> UI status
const toUiStatus = (s) => {
  const x = String(s || "").toLowerCase();
  return x === "active" ? "approved" : "pending";
};

/* ============ Dummy Payments / Invoices  ============ */
const payments = [
  {
    id: 1,
    restaurant: "CHN Vegetarian Burger",
    amount: 300,
    method: "Bank Transfer",
    date: "2025-08-10",
  },
  {
    id: 2,
    restaurant: "RDY Pizza",
    amount: 960,
    method: "PayPal",
    date: "2025-08-01",
  },
];

const invoices = [
  {
    id: "INV-001",
    restaurant: "CHN Vegetarian Burger",
    amount: 300,
    date: "2025-08-05",
    status: "Sent",
  },
  {
    id: "INV-002",
    restaurant: "RDY Pizza",
    amount: 960,
    date: "2025-08-02",
    status: "Paid",
  },
];

/* ================= Page ================= */

export default function AdminPanelPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tab, setTab] = useState("order");

  const [data, setData] = useState([]); // restaurants from the backend
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [token, setToken] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false);

  // --- PAGINATION state ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // Actions (commission dummy) — defined early to avoid TDZ in useMemo below
  function markAsPaid(id) {
    setData((prev) =>
      prev.map((res) =>
        res.id === id
          ? {
              ...res,
              paidCommission:
                Number(res.totalSales || 0) * Number(res.commissionRate || 0),
            }
          : res
      )
    );
  }

  // Read token and watch for changes
  useEffect(() => {
    const t = readTokenFromStorage();
    if (t) setToken(t);
    setTokenChecked(true);
    const onStorageOrFocus = () => setToken(readTokenFromStorage());
    window.addEventListener("storage", onStorageOrFocus);
    window.addEventListener("focus", onStorageOrFocus);
    document.addEventListener("visibilitychange", onStorageOrFocus);
    return () => {
      window.removeEventListener("storage", onStorageOrFocus);
      window.removeEventListener("focus", onStorageOrFocus);
      document.removeEventListener("visibilitychange", onStorageOrFocus);
    };
  }, []);

  // Fetch restaurants
  const fetchRestaurants = async (tk) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${BASE}/admin/restaurants`, {
        headers: { Authorization: `Bearer ${tk}` },
        cache: "no-store",
      });
      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : [];
      } catch {
        json = [];
      }
      if (!res.ok)
        throw new Error(json?.message || text || `HTTP ${res.status}`);

      const list = pickArray(json);
      const mapped = list.map((r, i) => ({
        id: r?._id || r?.id || `row-${i}`,
        name: r?.owner?.name || r?.ownerName || r?.ownerId || "-",
        restaurantName: r?.restaurantName || r?.name || "-",
        email: r?.email || r?.contactEmail || "-",
        website: r?.website || "-",
        phone: r?.phone || "-",
        category: Array.isArray(r?.categories)
          ? r.categories.join(", ")
          : r?.category || "-",
        createdAt: r?.createdAt
          ? new Date(r.createdAt).toLocaleDateString("en-CA")
          : "-",
        deliveryType:
          r?.deliveryAvailable && r?.takeawayAvailable
            ? "Package + Onsite"
            : r?.deliveryAvailable
            ? "Package Only"
            : r?.takeawayAvailable
            ? "Onsite"
            : "-",
        address: formatAddress(r?.address) || "-",
        status: toUiStatus(r?.status),
        // Placeholder in commission (backend does not provide these fields)
        totalSales: 0,
        commissionRate: 0,
        paidCommission: 0,
      }));

      setData(mapped);
    } catch (e) {
      setErr(e.message || "Restaurants could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  // If the token is ready, withdraw it.
  useEffect(() => {
    if (!tokenChecked) return;
    if (!token) {
      setLoading(false);
      setErr("Error: Login (token) not found. Please log in as admin.");
      return;
    }
    fetchRestaurants(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenChecked, token]);

  // Filtered restaurant list (used in ORDER tab)
  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      const matchesSearch =
        !q ||
        safeText(r.restaurantName).toLowerCase().includes(q) ||
        safeText(r.name).toLowerCase().includes(q) ||
        safeText(r.email).toLowerCase().includes(q) ||
        safeText(r.phone).toLowerCase().includes(q) ||
        safeText(r.address).toLowerCase().includes(q);
      const matchesStatus = statusFilter === "" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  // Tab headers
  const tabs = [
    { key: "order", label: "Order Management" },
    { key: "commission", label: "Commission Tracking" },
    { key: "payments", label: "Payment Reports" },
    { key: "invoices", label: "Invoice Management" },
    { key: "history", label: "Payment History" },
  ];

  // Generate headers & rows based on active tab
  const { headers, rows } = useMemo(() => {
    if (tab === "order") {
      return {
        headers: [
          "#",
          "Restaurant",
          "Owner",
          "Phone",
          "Delivery",
          "Status",
          "Actions",
        ],
        rows: filteredRestaurants.map((res) => [
          safeText(res.id),
          safeText(res.restaurantName),
          safeText(res.name),
          safeText(res.phone),
          safeText(res.deliveryType),
          <span
            key={`status-${res.id}`}
            className={`px-2 py-1 rounded text-xs font-medium uppercase ${
              res.status === "pending"
                ? "bg-yellow-200 text-yellow-800"
                : "bg-green-200 text-green-800"
            }`}
          >
            {safeText(res.status)}
          </span>,
          <button
            key={`btn-${res.id}`}
            className="text-blue-600 hover:underline"
            onClick={() => setSelected((s) => (s === res.id ? null : res.id))}
          >
            {selected === res.id ? "Hide" : "Details"}
          </button>,
        ]),
      };
    }

    if (tab === "commission") {
      return {
        headers: [
          "Restaurant",
          "Sales",
          "Rate",
          "Commission",
          "Paid",
          "Actions",
        ],
        rows: data.map((res) => {
          const commission =
            Number(res.totalSales || 0) * Number(res.commissionRate || 0);
          return [
            safeText(res.restaurantName),
            `€${Number(res.totalSales || 0)}`,
            `${Math.round(Number(res.commissionRate || 0) * 100)}%`,
            `€${commission}`,
            `€${Number(res.paidCommission || 0)}`,
            <button
              key={`mark-${res.id}`}
              className="text-blue-600 hover:underline"
              onClick={() => markAsPaid(res.id)}
            >
              Mark as Paid
            </button>,
          ];
        }),
      };
    }

    if (tab === "payments") {
      return {
        headers: ["Restaurant", "Amount", "Method", "Date"],
        rows: payments.map((p) => [
          safeText(p.restaurant),
          `€${p.amount}`,
          safeText(p.method),
          safeText(p.date),
        ]),
      };
    }

    if (tab === "invoices") {
      return {
        headers: ["Invoice #", "Restaurant", "Amount", "Date", "Status"],
        rows: invoices.map((inv) => [
          safeText(inv.id),
          safeText(inv.restaurant),
          `€${inv.amount}`,
          safeText(inv.date),
          safeText(inv.status),
        ]),
      };
    }

    // history
    return {
      headers: ["Restaurant", "Amount", "Method", "Date"],
      rows: payments.map((p) => [
        safeText(p.restaurant),
        `€${p.amount}`,
        safeText(p.method),
        safeText(p.date),
      ]),
    };
  }, [tab, filteredRestaurants, data, selected]);

  // total and page
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Prevent overflow
  useEffect(() => {
    setPage((p) => clamp(p, 1, totalPages));
  }, [totalItems, pageSize]);

  // Reset page to 1 when tab changes or filters change
  useEffect(() => {
    setPage(1);
  }, [tab, search, statusFilter]);

  // active page rows
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  if (!tokenChecked) return <div className="p-6">Checking…</div>;
  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  const selectedObj = data.find((r) => r.id === selected);

  return (
    <div className="p-6 text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded transition ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "order" && (
        <>
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search restaurant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-4 py-2 rounded w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border px-4 py-2 rounded"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
            <button
              type="button"
              onClick={() => fetchRestaurants(token)}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Refresh
            </button>
          </div>

          <Table headers={headers} rows={pageRows} />

          {/* Pagination Controls */}
          <PaginationControls
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />

          {selectedObj && <DetailsCard restaurant={selectedObj} />}
        </>
      )}

      {tab !== "order" && (
        <>
          <Table headers={headers} rows={pageRows} />
          <PaginationControls
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />
        </>
      )}
    </div>
  );
}

/* ================= Reusable Table ================= */
function Table({ headers, rows, emptyText = "No data." }) {
  return (
    <div className="relative rounded bg-white border border-gray-200">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full border bg-white text-sm">
          <thead className="bg-gray-200 text-gray-900 sticky top-0">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 border text-center text-gray-600"
                  colSpan={headers.length}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 border align-top">
                      {typeof cell === "object" && !React.isValidElement(cell)
                        ? safeText(cell)
                        : cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= Pagination Controls (ellipsis style) ================= */

// Pagination buttons array: 1 … current … total
const getPageButtons = (current, total) => {
  if (total <= 1) return [1];

  // safety clamp
  current = Math.max(1, Math.min(current, total));

  // short cases
  if (total === 2) return [1, 2];
  if (total === 3) return Array.from(new Set([1, current, total]));

  // same template for first/last: 1 … total
  if (current === 1 || current === total) {
    return [1, "…", total];
  }

  // general case
  const out = [1];
  if (current > 2) out.push("…"); // gap between 1 and current
  out.push(current); // active page
  if (current < total - 1) out.push("…"); // gap between current and last
  out.push(total); // last page
  return out;
};

function PaginationControls({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white mt-4">
      <div className="text-sm text-gray-800">
        Page <b>{page}</b> / {totalPages} • <b>{totalItems}</b> items
      </div>

      <div className="flex items-center gap-2 text-gray-800">
        <label className="text-sm text-gray-800 max-[750px]:hidden">
          Rows:
        </label>
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

        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          type="button"
        >
          Prev
        </button>

        {/* Dynamic page buttons */}
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
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ================= Details Card ================= */
function DetailsCard({ restaurant }) {
  if (!restaurant) return null;
  return (
    <div className="bg-gray-100 p-4 rounded border text-sm mt-4">
      <h2 className="text-lg font-semibold mb-2">
        {safeText(restaurant.restaurantName)} Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong>Owner:</strong> {safeText(restaurant.name)}
        </div>
        <div>
          <strong>Email:</strong> {safeText(restaurant.email)}
        </div>
        <div>
          <strong>Website:</strong>{" "}
          {restaurant.website && restaurant.website !== "-" ? (
            <a
              href={restaurant.website}
              className="text-blue-600 underline"
              target="_blank"
              rel="noreferrer"
            >
              Visit
            </a>
          ) : (
            "-"
          )}
        </div>
        <div>
          <strong>Phone:</strong> {safeText(restaurant.phone)}
        </div>
        <div>
          <strong>Address:</strong> {safeText(restaurant.address)}
        </div>
        <div>
          <strong>Created At:</strong> {safeText(restaurant.createdAt)}
        </div>
        <div>
          <strong>Status:</strong> {safeText(restaurant.status)}
        </div>
      </div>
    </div>
  );
}
