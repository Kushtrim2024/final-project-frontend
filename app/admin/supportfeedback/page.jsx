"use client";
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../lib/api.js";
// ---- Adjust this if your env var key differs ----
const API_BASEx = process.env.NEXT_PUBLIC_API_BASE || API_BASE;

// Try to read a JWT from cookies or localStorage (works in Next.js client components)
function getToken() {
  if (typeof document !== "undefined") {
    // 1) Cookie named "token" (Bearer)
    const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
    // 2) Or from localStorage
    try {
      const ls = localStorage.getItem("token");
      if (ls) return ls;
    } catch {}
  }
  return null;
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function RatingsManagerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState([]);

  const [query, setQuery] = useState("");
  const [minStars, setMinStars] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // New: extra filters
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  // For restaurant/user dropdown options
  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  // Simple confirm UI
  const [confirming, setConfirming] = useState(null); // {restaurantId, ratingId, label}

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Admin list of restaurants if available, fall back to public list
        const restaurantListEndpoints = [
          `${API_BASEx}/admin/restaurants`,
          `${API_BASEx}/restaurants`,
        ];
        let restaurants = [];
        for (const url of restaurantListEndpoints) {
          try {
            const res = await fetch(url, {
              cache: "no-store",
              headers: { "Content-Type": "application/json", ...authHeaders() },
            });
            if (res.ok) {
              restaurants = (await res.json()) || [];
              break;
            }
          } catch {}
        }

        // Normalize basic fields used in UI
        restaurants = (restaurants || [])
          .map((r) => ({
            id: String(r._id || r.id || ""),
            name: r.restaurantName || r.name || "Restaurant",
          }))
          .filter((r) => !!r.id);

        // Fetch ratings per restaurant. Prefer admin endpoint (includes ratingId),
        // fall back to public one.
        const perRestaurantRatings = await Promise.all(
          restaurants.map(async (r) => {
            const rid = r.id;
            const candidates = [
              `${API_BASEx}/admin/restaurants/${rid}/ratings`,
              `${API_BASEx}/restaurants/${rid}/ratings`,
            ];
            for (const url of candidates) {
              try {
                const rr = await fetch(url, {
                  cache: "no-store",
                  headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                  },
                });
                if (!rr.ok) continue;
                const data = await rr.json();
                const list = data?.ratings || data || [];
                return list.map((item) => ({
                  ratingSubId: item?._id ? String(item._id) : null,
                  restaurantId: rid,
                  restaurantName: r.name,
                  userId: item?.userId?._id
                    ? String(item.userId._id)
                    : item?.userId
                    ? String(item.userId)
                    : null,
                  userName: item?.userId?.name || item?.user?.name || "—",
                  userEmail: item?.userId?.email || item?.user?.email || "",
                  rating: Number(item?.rating ?? 0),
                  comment: item?.comment || "",
                  createdAt: item?.createdAt || null,
                }));
              } catch {}
            }
            return [];
          })
        );

        const all = perRestaurantRatings.flat();
        setRatings(all);

        // Build dropdown options
        const rOpts = Array.from(
          new Map(all.map((x) => [x.restaurantId, x.restaurantName])).entries()
        ).map(([id, name]) => ({ id, name }));
        setRestaurantOptions(rOpts);

        const uOptsMap = new Map();
        for (const x of all) {
          if (!x.userId) continue;
          const display =
            x.userName && x.userName !== "—"
              ? `${x.userName} (${x.userEmail || "no-email"})`
              : x.userEmail || x.userId;
          uOptsMap.set(x.userId, display);
        }
        setUserOptions(
          Array.from(uOptsMap.entries()).map(([id, label]) => ({ id, label }))
        );
      } catch (e) {
        setError(e?.message || "Unexpected error occurred");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ratings
      .filter((x) => (minStars ? x.rating >= Number(minStars) : true))
      .filter((x) =>
        selectedRestaurant === "all"
          ? true
          : x.restaurantId === selectedRestaurant
      )
      .filter((x) =>
        selectedUser === "all" ? true : x.userId === selectedUser
      )
      .filter((x) =>
        q
          ? [
              x.restaurantName,
              x.userName,
              x.userEmail,
              String(x.rating),
              x.comment,
            ]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q))
          : true
      );
  }, [ratings, query, minStars, selectedRestaurant, selectedUser]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    setPage((p) => clamp(p, 1, nextTotalPages));
  }, [totalItems, pageSize]);

  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  async function handleDelete({ restaurantId, ratingId }) {
    // Prefer admin endpoint if we have a ratingId
    const endpoints = ratingId
      ? [`${API_BASEx}/admin/restaurants/${restaurantId}/ratings/${ratingId}`]
      : [
          // fallback: delete my own rating (no ratingId on public route)
          `${API_BASEx}/restaurants/${restaurantId}/rating`,
        ];

    let lastErr = null;
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });
        if (!res.ok) {
          const t = await safeJson(res);
          throw new Error(t?.message || `Delete failed (${res.status})`);
        }

        // Remove locally
        setRatings((prev) =>
          prev.filter(
            (x) =>
              !(x.restaurantId === restaurantId && x.ratingSubId === ratingId)
          )
        );
        setConfirming(null);
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    setError(lastErr?.message || "Delete failed");
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Ratings & Reviews
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          className="border rounded px-3 py-2 text-gray-800 min-w-[260px]"
          placeholder="Search: restaurant, user, comment, stars…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />

        <label className="text-sm text-gray-700">Min ⭐</label>
        <select
          className="border rounded px-2 py-2 text-gray-800"
          value={minStars}
          onChange={(e) => {
            setMinStars(Number(e.target.value));
            setPage(1);
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <option key={String(n)} value={n}>
              {n}
            </option>
          ))}
        </select>

        {/* New: Restaurant filter */}
        <label className="text-sm text-gray-700">Restaurant</label>
        <select
          className="border rounded px-2 py-2 text-gray-800 min-w-[200px]"
          value={selectedRestaurant}
          onChange={(e) => {
            setSelectedRestaurant(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All</option>
          {restaurantOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {/* New: User filter */}
        <label className="text-sm text-gray-700">User</label>
        <select
          className="border rounded px-2 py-2 text-gray-800 min-w-[240px]"
          value={selectedUser}
          onChange={(e) => {
            setSelectedUser(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All</option>
          {userOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>

        <div className="ml-auto text-sm text-gray-700">
          Total: <span className="font-semibold">{totalItems}</span> items
        </div>
      </div>

      {/* Table */}
      <div className="relative rounded bg-white border border-gray-200">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-collapse border border-gray-300 text-gray-800">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="border p-2">Restaurant</th>
                <th className="border p-2">User</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Stars</th>
                <th className="border p-2">Comment</th>
                <th className="border p-2 w-[1%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border p-6 text-center text-gray-600"
                  >
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border p-6 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border p-6 text-center text-gray-600"
                  >
                    No records.
                  </td>
                </tr>
              ) : (
                pageItems.map((it, idx) => {
                  const base =
                    (it.ratingSubId && String(it.ratingSubId)) ||
                    String(it.restaurantId || "rest") +
                      "_" +
                      String(it.userId || "anon") +
                      "_" +
                      String(it.createdAt || "t");
                  const rowKey = base + "_" + String(start + idx);
                  return (
                    <tr key={rowKey}>
                      <td className="border p-2 align-top">
                        {it.restaurantName}
                      </td>
                      <td className="border p-2 align-top">{it.userName}</td>
                      <td className="border p-2 align-top">{it.userEmail}</td>
                      <td className="border p-2 align-top">{it.rating} ⭐</td>
                      <td className="border p-2 align-top whitespace-pre-wrap">
                        {it.comment}
                      </td>
                      <td className="border p-2 align-top">
                        <button
                          className="px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                          onClick={() =>
                            setConfirming({
                              restaurantId: it.restaurantId,
                              ratingId: it.ratingSubId || null,
                              label: `${it.userName || "User"} → ${
                                it.restaurantName
                              }`,
                            })
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalItems={totalItems}
      />

      {/* Confirm Delete Modal (simple) */}
      {confirming && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[min(520px,92vw)]">
            <h3 className="text-lg font-semibold mb-2">Delete rating?</h3>
            <p className="text-sm text-gray-700 mb-4">
              This will permanently remove the selected rating
              {confirming.label ? (
                <>
                  {" "}
                  (<span className="font-medium">{confirming.label}</span>)
                </>
              ) : null}
              .
            </p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1.5 border rounded hover:bg-gray-50"
                onClick={() => setConfirming(null)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 border rounded bg-red-600 text-white hover:opacity-90"
                onClick={() =>
                  handleDelete({
                    restaurantId: confirming.restaurantId,
                    ratingId: confirming.ratingId,
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Pagination (1 … current … last) ================= */
function getPageButtons(current, total) {
  if (total <= 1) return [1];
  current = Math.max(1, Math.min(current, total));
  const pages = [1];
  if (current > 2) pages.push("…");
  if (current !== 1 && current !== total) pages.push(current);
  if (current < total - 1) pages.push("…");
  if (total !== 1) pages.push(total);
  return pages;
}

function Pagination({ page, setPage, pageSize, setPageSize, totalItems }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const buttons = getPageButtons(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white mt-4 rounded text-gray-800">
      <div className="text-sm">
        Page <span className="font-semibold">{page}</span>/{totalPages} •{" "}
        <span className="font-semibold">{totalItems}</span> items
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm max-[750px]:hidden">Rows:</label>
        <select
          className="border rounded px-2 py-1"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {[12, 24, 48, 96].map((n) => (
            <option key={String(n)} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {buttons.map((b, i) =>
            b === "…" ? (
              <span key={`dots-${i}`} className="px-2 select-none">
                …
              </span>
            ) : (
              <button
                key={`p-${b}`}
                aria-current={page === b ? "page" : undefined}
                className={`px-3 py-1 border rounded ${
                  page === b ? "bg-gray-800 text-white" : "hover:bg-gray-100"
                }`}
                onClick={() => setPage(b)}
              >
                {b}
              </button>
            )
          )}
        </div>

        <button
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

/* ================= Helpers ================= */
function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
