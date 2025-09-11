"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ================= Helpers & Config ================= */

const BASE_REST =
  process.env.NEXT_PUBLIC_API_BASE_REST || "http://localhost:5517";
const BASE_ORDERS =
  process.env.NEXT_PUBLIC_API_BASE_ORDERS || "http://localhost:5517";

/** Try to read a token from typical localStorage keys. */
function readTokenFromStorage() {
  if (typeof window === "undefined") return "";
  const keys = ["adminToken", "token", "accessToken", "jwt", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return "";
}

/** Pick the first array field in a JSON response (orders, data, items, etc.). */

function pickFirstArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const preferred = [
      "orders",
      "restaurants",
      "users",
      "items",
      "data",
      "results",
      "list",
    ];
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
}

/** Normalize restaurant status. */
function normalizeStatus(s) {
  const val = (typeof s === "string" ? s : String(s || "")).toLowerCase();
  return val === "active" ? "active" : "inactive";
}

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_SHORT = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
  unknown: "Unknown",
};

const STATUS_COLORS = {
  pending: "#FBBF24",
  confirmed: "#34D399",
  preparing: "#A78BFA",
  ready: "#60A5FA",
  out_for_delivery: "#F472B6",
  delivered: "#10B981",
  cancelled: "#F87171",
  unknown: "#9CA3AF",
};

function pretty(n, fallback = "—") {
  return typeof n === "number" && isFinite(n) ? n.toLocaleString() : fallback;
}

/* ================= Component ================= */

export default function DashboardPage() {
  // Metrikler
  const [activeRestaurants, setActiveRestaurants] = useState(null);
  const [totalUsers, setTotalUsers] = useState(null);
  const [totalOrders, setTotalOrders] = useState(null);
  const [orders, setOrders] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // auth
  const [token, setToken] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false);

  // chart type toggle
  const [chartType, setChartType] = useState("bar");

  // --- track token
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

  // --- load metrics
  useEffect(() => {
    if (!tokenChecked) return;

    if (!token) {
      setLoading(false);
      setErr("Error: Login (token) not found. Please log in as admin.");
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setErr("");

      try {
        // 1) Active restaurants
        const pRestaurants = (async () => {
          const res = await fetch(`${BASE_REST}/admin/restaurant-owners`, {
            headers: { Authorization: `Bearer ${token}` },
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
          const arr = pickFirstArray(data);
          const count = arr.reduce((acc, r) => {
            const s = normalizeStatus(r?.status);
            return acc + (s === "active" ? 1 : 0);
          }, 0);
          return count;
        })();

        // 2) Total users
        const pUsers = (async () => {
          const res = await fetch(`${BASE_REST}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          const raw = await res.text();
          let data;
          try {
            data = raw ? JSON.parse(raw) : [];
          } catch {
            data = [];
          }
          if (!res.ok)
            throw new Error(data?.message || raw || `HTTP ${res.status}`);
          const list = Array.isArray(data)
            ? data
            : data?.users || pickFirstArray(data);
          return Array.isArray(list) ? list.length : 0;
        })();

        // 3) Orders (return the full list for charting)
        const pOrders = (async () => {
          const res = await fetch(`${BASE_ORDERS}/admin/orders`, {
            headers: { Authorization: `Bearer ${token}` },
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
          const arr = pickFirstArray(data);
          return Array.isArray(arr) ? arr : [];
        })();

        const [activeR, users, ordersArr] = await Promise.all([
          pRestaurants,
          pUsers,
          pOrders,
        ]);

        if (cancelled) return;
        setActiveRestaurants(activeR);
        setTotalUsers(users);
        setTotalOrders(ordersArr.length);
        setOrders(ordersArr);
      } catch (e) {
        if (cancelled) return;
        setErr(e.message || "Metrics could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [tokenChecked, token]);

  // ---- Chart data: order status distribution
  const statusData = useMemo(() => {
    const counts = {};
    for (const o of orders) {
      const s = (o?.status || "unknown").toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    }
    const order = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "unknown",
    ];
    const entries = Object.entries(counts).map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] || status.replace(/_/g, " "),
      shortLabel:
        STATUS_SHORT[status] || (STATUS_LABELS[status] || status).split(" ")[0],
      count,
    }));
    entries.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    return entries;
  }, [orders]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        {loading && (
          <span className="text-sm text-gray-500 animate-pulse">Loading…</span>
        )}
      </div>

      {err && (
        <div className="rounded border border-red-200 bg-red-50 text-red-700 p-3">
          {err}
        </div>
      )}

      {/* Cards --------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Orders */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Orders
          </h3>
          <p className="text-3xl font-bold text-orange-500">
            {pretty(totalOrders)}
          </p>
          <p className="text-sm text-gray-500 mt-1">All time</p>
        </div>

        {/* Active Restaurants (from backend) */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Active Restaurants
          </h3>
          <p className="text-3xl font-bold text-blue-500">
            {pretty(activeRestaurants)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Currently onboard</p>
        </div>

        {/* Users count */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Users</h3>
          <p className="text-3xl font-bold text-purple-500">
            {pretty(totalUsers)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Registered</p>
        </div>
      </div>

      {/* Chart ------------------------------------------------------------------------*/}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Orders by Status
          </h3>
          <div className="inline-flex rounded-md shadow-sm overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${
                chartType === "bar"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>
            <button
              className={`px-3 py-1 text-sm border-l ${
                chartType === "pie"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setChartType("pie")}
            >
              Pie
            </button>
          </div>
        </div>
        <div className="h-80">
          {statusData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 mb-6">
              No order data to display.
            </div>
          ) : chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="shortLabel"
                  interval={0}
                  angle={-90}
                  textAnchor="middle"
                  tickMargin={12}
                  height={80}
                  dx={-6}
                  dy={30}
                />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [value, "Orders"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, idx) => (
                    <Cell
                      key={`cell-bar-${idx}`}
                      fill={STATUS_COLORS[entry.status] || "#9CA3AF"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="shortLabel"
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                  label
                >
                  {statusData.map((entry, idx) => (
                    <Cell
                      key={`cell-pie-${idx}`}
                      fill={STATUS_COLORS[entry.status] || "#9CA3AF"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
