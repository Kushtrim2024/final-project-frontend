// app/(example)/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { API_BASE } from "../../lib/api.js";
/**
 * Notes:
 * - 100% Tailwind (no inline styles).
 * - Single component: list, search, pagination, modal form (create/update) all here.
 * - Pagination shows: Prev, 1, 2, …, current, …, last, Next (current page always visible).
 * - Page size options: 9/18/27.
 * - Sizes: presets (Small/Medium/Large) + optional custom sizes; edit correctly pre-fills & updates.
 * - Add-ons editable.
 * - Restaurant ID resolution via /owner/restaurants/my-restaurant; fallback to session/localStorage.
 */

export default function Page() {
  const { data: session, status } = useSession();

  const CATEGORY_ENUM = [
    "Starters",
    "Main Courses",
    "Desserts",
    "Drinks",
    "Specials",
  ];
  const STATUS_ENUM = ["available", "unavailable"];
  const PRESET_SIZES = ["Small", "Medium", "Large"];
  const PAGE_SIZE_OPTIONS = [9, 18, 27];

  // --- mount guard (hydration-safe) ---
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // --- id inference (session/localStorage) ---
  const id = useMemo(() => {
    const norm = (raw) => {
      if (raw == null) return null;
      const n = Number(raw);
      return Number.isFinite(n) && String(n) === String(raw) ? n : String(raw);
    };
    const fromSession = session?.user?.restaurantId ?? session?.user?.id;
    if (!mounted && !fromSession) return null;
    if (fromSession != null) return norm(fromSession);
    try {
      const rawAuth = localStorage.getItem("auth");
      if (rawAuth) {
        const auth = JSON.parse(rawAuth);
        const fromLS = auth?.user?.restaurantId ?? auth?.user?.id ?? null;
        if (fromLS != null) return norm(fromLS);
      }
    } catch {}
    return null;
  }, [mounted, session?.user?.restaurantId, session?.user?.id]);

  const [restaurantIdResolved, setRestaurantIdResolved] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const isObjectId = (val) =>
      typeof val === "string" && /^[a-fA-F0-9]{24}$/.test(val);

    (async () => {
      try {
        setResolving(true);
        setRestaurantIdResolved(null);
        const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE;
        const headers = {};
        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt");
          if (token) headers["Authorization"] = `Bearer ${token}`;
        } catch {}

        const meRes = await fetch(`${BASE}/owner/restaurants/my-restaurant`, {
          method: "GET",
          credentials: "include",
          headers,
          cache: "no-store",
        });

        if (meRes.ok) {
          const myRestaurant = await meRes.json();
          if (myRestaurant?._id) {
            setRestaurantIdResolved(String(myRestaurant._id));
            return;
          }
        }

        if (isObjectId(id)) {
          setRestaurantIdResolved(String(id));
          return;
        }

        setRestaurantIdResolved(null);
      } catch {
        const isObjectId = (val) =>
          typeof val === "string" && /^[a-fA-F0-9]{24}$/.test(val);
        if (isObjectId(id)) setRestaurantIdResolved(String(id));
      } finally {
        setResolving(false);
      }
    })();
  }, [mounted, id]);

  // --- data state ---
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- filters / pagination ---
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);

  // --- modal form state (create/update) ---
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Form fields (schema-aligned)
  const [fName, setFName] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fCategory, setFCategory] = useState(CATEGORY_ENUM[0]);
  const [fBasePrice, setFBasePrice] = useState("");
  const [fStatus, setFStatus] = useState("available");

  // Sizes (presets + custom)
  const [presetEnabled, setPresetEnabled] = useState({
    Small: false,
    Medium: false,
    Large: false,
  });
  const [presetPrices, setPresetPrices] = useState({
    Small: "",
    Medium: "",
    Large: "",
  });
  const [customSizes, setCustomSizes] = useState([]);

  // Add-ons
  const [addOns, setAddOns] = useState([]);

  useEffect(() => {
    if (!mounted) return;
    if (!restaurantIdResolved) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE;
        const API_URL = `${BASE}/owner/restaurants/${restaurantIdResolved}/menu-items`;
        const headers = {};
        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt");
          if (token) headers["Authorization"] = `Bearer ${token}`;
        } catch {}

        const res = await fetch(API_URL, {
          signal: controller.signal,
          cache: "no-store",
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          if (res.status === 401)
            throw new Error("401 Unauthorized — token missing/invalid.");
          if (res.status === 403)
            throw new Error("403 Forbidden — not enough permissions.");
          if (res.status === 404)
            throw new Error("404 Not Found — wrong restaurantId.");
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const json = await res.json();

        // Flatten grouped object -> array
        let flat = [];
        if (Array.isArray(json)) {
          flat = json;
        } else if (json && typeof json === "object") {
          Object.entries(json).forEach(([cat, items]) => {
            (items || []).forEach((i) =>
              flat.push({ ...i, category: i.category ?? cat })
            );
          });
        }
        flat.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setList(flat);
        setPage(1);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e.message || String(e));
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [mounted, status, restaurantIdResolved]);

  // filter + pagination
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) => {
      const name = (i.name || "").toLowerCase();
      const cat = (i.category || "").toLowerCase();
      const desc = (i.description || "").toLowerCase();
      return name.includes(q) || cat.includes(q) || desc.includes(q);
    });
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  // --- actions ---
  function openCreate() {
    setEditing(null);
    setFName("");
    setFDescription("");
    setFCategory(CATEGORY_ENUM[0]);
    setFBasePrice("");
    setFStatus("available");
    setPresetEnabled({ Small: false, Medium: false, Large: false });
    setPresetPrices({ Small: "", Medium: "", Large: "" });
    setCustomSizes([]);
    setAddOns([]);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setFName(item.name || "");
    setFDescription(item.description || "");
    setFCategory(item.category || CATEGORY_ENUM[0]);
    setFBasePrice(
      typeof item.basePrice === "number" ? String(item.basePrice) : ""
    );
    setFStatus(item.status || "available");

    // sizes -> presets + custom
    const normalize = (s) =>
      String(s || "")
        .trim()
        .toLowerCase();
    const initEnabled = { Small: false, Medium: false, Large: false };
    const initPrices = { Small: "", Medium: "", Large: "" };
    const customs = [];

    (item.sizes || []).forEach((s) => {
      const label = String(s.label || "");
      const price = s.price ?? "";
      const presetHit = PRESET_SIZES.find(
        (p) => normalize(p) === normalize(label)
      );
      if (presetHit) {
        initEnabled[presetHit] = true;
        initPrices[presetHit] = String(price);
      } else {
        customs.push({ label, price: String(price) });
      }
    });

    setPresetEnabled(initEnabled);
    setPresetPrices(initPrices);
    setCustomSizes(customs);

    setAddOns(
      Array.isArray(item.addOns)
        ? item.addOns.map((a) => ({
            name: a.name || "",
            price: String(a.price ?? ""),
          }))
        : []
    );

    setShowForm(true);
  }

  async function handleDelete(item) {
    if (!confirm(`Delete “${item.name}”?`)) return;
    try {
      setLoading(true);
      const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE;
      const headers = {};
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt");
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(
        `${BASE}/owner/restaurants/${restaurantIdResolved}/menu-items/${item._id}`,
        { method: "DELETE", credentials: "include", headers }
      );
      if (!res.ok) throw new Error("Delete failed");
      setList((prev) => prev.filter((x) => x._id !== item._id));
    } catch (e) {
      alert(e.message || "Delete error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE;
      const url = editing
        ? `${BASE}/owner/restaurants/${restaurantIdResolved}/menu-items/${editing._id}`
        : `${BASE}/owner/restaurants/${restaurantIdResolved}/menu-items`;
      const method = editing ? "PUT" : "POST";

      const headers = {};
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // build sizes payload from preset + custom
      const sizesFromPresets = PRESET_SIZES.flatMap((label) =>
        presetEnabled[label] && presetPrices[label] !== ""
          ? [{ label, price: Number(presetPrices[label]) }]
          : []
      );
      const sizesFromCustom = (customSizes || [])
        .filter((s) => s.label && s.price !== "")
        .map((s) => ({ label: s.label, price: Number(s.price) }));

      const payload = {
        name: fName,
        description: fDescription,
        category: fCategory,
        status: fStatus,
        ...(fBasePrice !== "" ? { basePrice: Number(fBasePrice) } : {}),
        sizes: [...sizesFromPresets, ...sizesFromCustom],
        addOns: (addOns || [])
          .filter((a) => a.name && a.price !== "")
          .map((a) => ({ name: a.name, price: Number(a.price) })),
      };

      const res = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let msg = `${res.status} Error`;
      try {
        const data = await res.clone().json();
        if (!res.ok) msg = data?.message || data?.error || msg;
        else {
          const saved = data;
          // update local list
          if (editing) {
            setList((prev) =>
              prev.map((x) => (x._id === saved._id ? saved : x))
            );
          } else {
            setList((prev) => [saved, ...prev]);
          }
          setShowForm(false);
          return;
        }
      } catch {
        if (!res.ok) throw new Error(msg);
        setShowForm(false);
        return;
      }

      if (!res.ok) throw new Error(msg);
    } catch (e) {
      alert(e.message || "Save error");
    }
  }

  // --- UI helpers inside component (no external helpers) ---
  const minSizePrice = (sizes) => {
    const nums = (sizes || [])
      .map((s) => Number(s.price))
      .filter((n) => Number.isFinite(n));
    return nums.length ? Math.min(...nums) : 0;
  };

  // Pagination view: Prev, 1, 2, …, current, …, last, Next
  const Pager = () => {
    if (totalPages <= 1) return null;
    const first = 1;
    const second = 2;
    const last = totalPages;
    const showCurrent =
      page !== first && page !== second && page !== last && totalPages > 3;

    const baseBtn =
      "px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 disabled:cursor-not-allowed";
    const active = "bg-black text-white border-black";
    const normal = "bg-white text-black border-slate-200";

    return (
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className={`${baseBtn} ${normal}`}
        >
          ‹ Prev
        </button>

        <button
          onClick={() => setPage(first)}
          className={`${baseBtn} ${page === first ? active : normal}`}
        >
          {first}
        </button>

        {totalPages >= 2 && (
          <button
            onClick={() => setPage(second)}
            className={`${baseBtn} ${page === second ? active : normal}`}
          >
            {second}
          </button>
        )}

        {showCurrent && page > 3 && (
          <span className="px-1 text-slate-500">…</span>
        )}

        {showCurrent && (
          <button className={`${baseBtn} ${active}`} disabled>
            {page}
          </button>
        )}

        {showCurrent && last - page > 1 && (
          <span className="px-1 text-slate-500">…</span>
        )}

        {totalPages > 2 && (
          <button
            onClick={() => setPage(last)}
            className={`${baseBtn} ${page === last ? active : normal}`}
          >
            {last}
          </button>
        )}

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className={`${baseBtn} ${normal}`}
        >
          Next ›
        </button>
      </div>
    );
  };

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Menu Management</h1>

      {!mounted ? (
        <p className="mt-2 text-slate-600" suppressHydrationWarning>
          Loading…
        </p>
      ) : (
        <>
          {status === "loading" && <p className="mt-2">Loading session…</p>}
          {!resolving && !restaurantIdResolved && (
            <p className="mt-2 text-red-600">
              Couldn’t resolve restaurant ID — check your session/role or
              restaurant record.
            </p>
          )}
          {resolving && (
            <p className="mt-2 text-slate-600">Resolving restaurant ID…</p>
          )}

          {/* Toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={openCreate}
              className="rounded-xl border border-black bg-black px-3 py-2 text-white"
            >
              + New Item
            </button>

            <div className="text-sm text-slate-600">
              Total items: <strong>{filtered.length}</strong>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="search" className="text-sm text-slate-600">
                Search:
              </label>
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to filter…"
                className="min-w-[220px] rounded-lg border border-slate-200 px-3 py-1.5 outline-none"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-slate-600">Page size:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <p className="mt-4">Loading…</p>}
          {err && <p className="mt-4 text-red-600">Error: {String(err)}</p>}

          {/* TABLE */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Name
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Category
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Price
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Sizes
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Add-ons
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Status
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Created
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((i) => (
                  <tr key={i._id} className="border-t border-slate-200">
                    <td className="px-3 py-2 align-top">
                      <div className="font-semibold">{i.name}</div>
                      {i.description ? (
                        <div className="text-xs text-slate-500">
                          {i.description?.slice(0, 80)}
                          {i.description?.length > 80 ? "…" : ""}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 align-top">{i.category}</td>
                    <td className="px-3 py-2 align-top">
                      {typeof i.basePrice === "number"
                        ? `€${i.basePrice.toFixed(2)}`
                        : i.sizes?.length
                        ? `€${minSizePrice(i.sizes).toFixed(2)}+`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {Array.isArray(i.sizes) && i.sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {i.sizes.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs"
                            >
                              {s.label} · €{Number(s.price).toFixed(2)}
                            </span>
                          ))}
                          {i.sizes.length > 4 && (
                            <span className="text-xs text-slate-500">
                              +{i.sizes.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {Array.isArray(i.addOns) && i.addOns.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {i.addOns.slice(0, 4).map((a, idx) => (
                            <span
                              key={idx}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs"
                            >
                              {a.name} · €{Number(a.price).toFixed(2)}
                            </span>
                          ))}
                          {i.addOns.length > 4 && (
                            <span className="text-xs text-slate-500">
                              +{i.addOns.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          i.status === "available"
                            ? "border-cyan-100 bg-cyan-50"
                            : "border-amber-100 bg-amber-50"
                        }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {i.createdAt
                        ? new Date(i.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(i)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(i)}
                          className="rounded-lg border border-red-500 bg-red-500 px-3 py-1.5 text-sm text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pager />

          {/* Modal Form */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 ">
              <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 p-4">
                  <h2 className="font-semibold">
                    {editing ? "Edit Item" : "New Item"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-3 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Name
                      </label>
                      <input
                        value={fName}
                        onChange={(e) => setFName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Category
                      </label>
                      <select
                        value={fCategory}
                        onChange={(e) => setFCategory(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                      >
                        {CATEGORY_ENUM.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-500">
                      Description
                    </label>
                    <textarea
                      value={fDescription}
                      onChange={(e) => setFDescription(e.target.value)}
                      className="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Base Price (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={fBasePrice}
                        onChange={(e) => setFBasePrice(e.target.value)}
                        placeholder="e.g., 59.90"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Status
                      </label>
                      <select
                        value={fStatus}
                        onChange={(e) => setFStatus(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                      >
                        {STATUS_ENUM.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preset Sizes */}
                  <div>
                    <div className="mb-1 text-xs font-semibold text-slate-500">
                      Sizes (presets)
                    </div>
                    <div className="grid gap-2">
                      {PRESET_SIZES.map((lab) => (
                        <div
                          key={lab}
                          className="grid grid-cols-[minmax(140px,240px)_1fr] items-center gap-2"
                        >
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={!!presetEnabled[lab]}
                              onChange={() =>
                                setPresetEnabled((p) => ({
                                  ...p,
                                  [lab]: !p[lab],
                                }))
                              }
                            />
                            {lab}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={presetPrices[lab]}
                            onChange={(e) =>
                              setPresetPrices((p) => ({
                                ...p,
                                [lab]: e.target.value,
                              }))
                            }
                            className={`w-full rounded-lg border px-3 py-2 outline-none ${
                              presetEnabled[lab]
                                ? "border-slate-200"
                                : "border-slate-100 opacity-60"
                            }`}
                            disabled={!presetEnabled[lab]}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Sizes */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs text-slate-500">
                        Additional sizes (optional)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomSizes((p) => [
                            ...p,
                            { label: "", price: "" },
                          ])
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      >
                        + Add custom
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {customSizes.map((s, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[1fr_1fr_96px] items-center gap-2"
                        >
                          <input
                            placeholder="Label"
                            value={s.label}
                            onChange={(e) =>
                              setCustomSizes((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, label: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={s.price}
                            onChange={(e) =>
                              setCustomSizes((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, price: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCustomSizes((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="rounded-lg border border-red-500 bg-red-500 px-3 py-1.5 text-sm text-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {customSizes.length === 0 && (
                        <p className="text-xs text-slate-500">
                          Use this if you need sizes other than
                          Small/Medium/Large.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs text-slate-500">
                        Add-ons (optional)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setAddOns((p) => [...p, { name: "", price: "" }])
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {addOns.map((a, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-[1fr_1fr_96px] items-center gap-2"
                        >
                          <input
                            placeholder="Name"
                            value={a.name}
                            onChange={(e) =>
                              setAddOns((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, name: e.target.value } : x
                                )
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={a.price}
                            onChange={(e) =>
                              setAddOns((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? { ...x, price: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAddOns((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="rounded-lg border border-red-500 bg-red-500 px-3 py-1.5 text-sm text-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {addOns.length === 0 && (
                        <p className="text-xs text-slate-500">
                          Add optional extras customers can select.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg border border-black bg-black px-3 py-1.5 text-sm text-white"
                    >
                      {editing ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
