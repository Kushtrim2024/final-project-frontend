"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ===================== CONFIG ===================== */
const API_BASE = "http://localhost:5517";
// Fallback-Restaurant, von dem wir wissen, dass Items existieren
const DEFAULT_RESTAURANT_ID = "688f371b18a69156d2d8bb4c";
// Große Optionen, damit du viel/alles siehst
const PAGE_SIZE_OPTIONS = [50, 100, 200, 500, 1000];

/* ===================== HELPERS ===================== */

// Token aus localStorage
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}
function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// RestaurantId aus localStorage.auth holen (falls Login-Modul sie dort speichert)
function getRestaurantIdFromAuth() {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    return (
      auth?.user?.restaurantId ||
      auth?.user?.restaurant?._id ||
      auth?.user?.restaurant ||
      null
    );
  } catch {
    return null;
  }
}

// Zahl-Parser (für „12,99“ o.ä.)
function toNumberOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(
    String(v)
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".")
  );
  return Number.isFinite(n) ? n : null;
}

// Filter (Search + Kategorie)
function applyClientFilters(arr, search = "", filterCat = "") {
  const q = (search || "").toLowerCase().trim();
  const cat = (filterCat || "").toLowerCase().trim();
  return arr.filter((i) => {
    const inText =
      !q ||
      (i.name && i.name.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q));
    const inCat = !cat || (i.category && i.category.toLowerCase() === cat);
    return inText && inCat;
  });
}

// Pager-Anzeige (1 … 4 5 6 … 10)
function paginateRange(page, totalPages, span = 1) {
  const pages = new Set([1, totalPages, page]);
  for (let d = 1; d <= span; d++) {
    pages.add(page - d);
    pages.add(page + d);
  }
  const sorted = [...pages]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push("…");
  }
  return out;
}

// UI-Mapping -> deine DB-Struktur
function normalizeItem(x) {
  const priceNum = Number.isFinite(Number(x.price)) ? Number(x.price) : null;
  return {
    id: x._id,
    name: x.name,
    description: x.description ?? "",
    category: x.category,
    subcategory: x.subcategory,
    price: priceNum, // direkte Anzeige
    basePrice: priceNum ?? 0, // Fallback
    sizes: [], // deine DB nutzt keine sizes bei diesen Seeds
    sizesUI: "",
    image:
      Array.isArray(x.images) && x.images.length > 0
        ? x.images[0]
        : x.image || "",
    status: x.available ? "Active" : "Inactive",
  };
}

// Form -> Backend Payload (Add/Update)
function buildPayload(form) {
  const payload = {
    name: form.name,
    description: form.description,
    category: form.category,
    image: form.image || undefined,
    available: (form.status || "Active") === "Active",
  };

  // Größen vs. Single-Price
  const s = form.sizesEnabled
    ? [
        form.sizePrices.small
          ? { label: "Small", price: form.sizePrices.small }
          : null,
        form.sizePrices.medium
          ? { label: "Medium", price: form.sizePrices.medium }
          : null,
        form.sizePrices.large
          ? { label: "Large", price: form.sizePrices.large }
          : null,
      ].filter(Boolean)
    : [];

  if (s.length > 0) {
    payload.sizes = s.map((x) => ({
      label: x.label,
      price: Number(String(x.price).replace(",", ".")),
    }));
  } else {
    // deine Seeds nutzen "price"
    payload.price = form.price
      ? Number(String(form.price).replace(",", "."))
      : undefined;
  }

  return payload;
}

// Datei -> Base64 Fallback
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ===================== PAGE ===================== */

export default function MenuManagementPage() {
  // Daten & UI-State
  const [items, setItems] = useState([]); // Client-Mode (alle)
  const [pageItems, setPageItems] = useState([]); // Server-Mode (Seite)
  const [serverMode, setServerMode] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [lastBatchSize, setLastBatchSize] = useState(0);

  // groß starten, damit du „alles“ siehst
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);
  const [reloadTick, setReloadTick] = useState(0);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    category: "",
    price: "",
    sizesEnabled: false,
    sizePrices: { small: "", medium: "", large: "" },
    status: "Active",
    image: "",
    imageData: null,
    preview: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editingOriginalSizes, setEditingOriginalSizes] = useState([]);
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "table"

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Restaurant-ID bestimmen + Fallback
        let restaurantId = getRestaurantIdFromAuth();
        if (!restaurantId) {
          restaurantId = DEFAULT_RESTAURANT_ID;
          console.warn("Nutze Fallback restaurantId:", restaurantId);
        }

        // 2) URL bauen
        const url = new URL(
          `${API_BASE}/owner/restaurants/${restaurantId}/menu-items`
        );
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(pageSize));

        // 3) Fetch
        const res = await fetch(url.toString(), {
          cache: "no-store",
          headers: { "Content-Type": "application/json", ...authHeader() },
        });
        if (!res.ok) throw new Error(`Request failed ${res.status}`);
        const json = await res.json();

        // 4) Daten extrahieren
        let data = [];
        let total = 0;

        if (json && Array.isArray(json.items)) {
          data = json.items;
          total =
            typeof json.total === "number" ? json.total : json.items.length;
        } else if (Array.isArray(json)) {
          data = json;
          total = json.length;
        } else if (json && Array.isArray(json.data)) {
          data = json.data;
          total =
            typeof json.total === "number" ? json.total : json.data.length;
        }

        const norm = data.map(normalizeItem);

        // 5) States setzen – wir nutzen Client-Mode (alles im Speicher)
        setItems(norm);
        setPageItems(norm); // für späteren Server-Mode
        setTotalCount(total);
        setLastBatchSize(data.length);
        setServerMode(false);
      } catch (e) {
        console.error("Fetch error:", e);
        setError("Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, reloadTick]);

  // Filterwechsel -> Seite 1 (nur im Client-Mode)
  useEffect(() => {
    if (!serverMode) setPage(1);
  }, [search, filterCat, serverMode]);

  /* ---------- DERIVED ---------- */
  const filteredAll = useMemo(
    () => applyClientFilters(items, search, filterCat),
    [items, search, filterCat]
  );

  const totalPages = useMemo(() => {
    const count = serverMode ? totalCount ?? 0 : filteredAll.length;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [serverMode, totalCount, filteredAll.length, pageSize]);

  const dataForTable = useMemo(() => {
    if (serverMode) return pageItems;
    const start = (page - 1) * pageSize;
    return filteredAll.slice(start, start + pageSize);
  }, [serverMode, pageItems, filteredAll, page, pageSize]);

  const categories = useMemo(() => {
    const src = serverMode ? pageItems : items;
    return Array.from(
      new Set(src.map((i) => i.category).filter(Boolean))
    ).sort();
  }, [items, pageItems, serverMode]);

  const isPrevDisabled = loading || page <= 1;
  const isNextDisabled =
    loading ||
    (serverMode
      ? totalCount != null
        ? page >= totalPages
        : lastBatchSize < pageSize
      : page >= totalPages);

  /* ---------- HANDLERS ---------- */
  const handleInput = (e) => {
    const { name, value, checked } = e.target;
    if (name === "sizesEnabled") {
      setForm((p) => ({ ...p, sizesEnabled: checked }));
      return;
    }
    if (name.startsWith("sizePrices.")) {
      const key = name.split(".")[1];
      setForm((p) => ({ ...p, sizePrices: { ...p.sizePrices, [key]: value } }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onEdit = (x) => {
    const hasSizes = Array.isArray(x.sizes) && x.sizes.length > 0;
    const sizeMap = { small: "", medium: "", large: "" };
    if (hasSizes) {
      for (const s of x.sizes) {
        const lbl = (s.label || "").toLowerCase();
        const val = toNumberOrNull(s.price);
        if (lbl.startsWith("s")) sizeMap.small = val != null ? String(val) : "";
        else if (lbl.startsWith("m"))
          sizeMap.medium = val != null ? String(val) : "";
        else if (lbl.startsWith("l"))
          sizeMap.large = val != null ? String(val) : "";
      }
    }
    setEditingId(x.id);
    setEditingOriginalSizes(x.sizes || []);
    setForm({
      id: x.id,
      name: x.name || "",
      description: x.description || "",
      category: x.category || "",
      price: !hasSizes
        ? x.price != null
          ? String(x.price)
          : x.basePrice != null
          ? String(x.basePrice)
          : ""
        : "",
      sizesEnabled: hasSizes,
      sizePrices: sizeMap,
      status: x.status || "Active",
      image: x.image || "",
      imageData: null,
      preview: x.image || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditingOriginalSizes([]);
    setForm({
      id: null,
      name: "",
      description: "",
      category: "",
      price: "",
      sizesEnabled: false,
      sizePrices: { small: "", medium: "", large: "" },
      status: "Active",
      image: "",
      imageData: null,
      preview: "",
    });
  };

  const onSave = async () => {
    if (!form.name) return alert("Name is required");

    // Restaurant-ID wie beim Laden bestimmen
    let restaurantId = getRestaurantIdFromAuth() || DEFAULT_RESTAURANT_ID;
    const LIST_URL = `${API_BASE}/owner/restaurants/${restaurantId}/menu-items`;

    const payload = buildPayload(form);
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(LIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Create failed (${res.status}): ${t}`);
      }
      setReloadTick((t) => t + 1);
      setPage(1);
      onCancelEdit();
    } catch (e) {
      setError(e.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const onUpdate = async () => {
    if (!editingId) return;

    let restaurantId = getRestaurantIdFromAuth() || DEFAULT_RESTAURANT_ID;
    const LIST_URL = `${API_BASE}/owner/restaurants/${restaurantId}/menu-items`;

    const payload = buildPayload(form);
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${LIST_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Update failed (${res.status}): ${t}`);
      }
      setReloadTick((t) => t + 1);
      onCancelEdit();
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this item?")) return;

    let restaurantId = getRestaurantIdFromAuth() || DEFAULT_RESTAURANT_ID;
    const LIST_URL = `${API_BASE}/owner/restaurants/${restaurantId}/menu-items`;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${LIST_URL}/${id}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Delete failed (${res.status}): ${t}`);
      }
      setReloadTick((t) => t + 1);
      if (editingId === id) onCancelEdit();
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const UPLOAD_URL = `${API_BASE}/upload`;
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((p) => ({ ...p, preview }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      const up = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { ...authHeader() },
        body: formData,
      });
      if (up.ok) {
        const j = await up.json().catch(() => null);
        if (j?.url) {
          setForm((p) => ({ ...p, image: j.url, imageData: null }));
          return;
        }
      }
    } catch {
      /* Fallback unten */
    }
    const b64 = await fileToBase64(file);
    setForm((p) => ({ ...p, imageData: b64, image: "" }));
  };

  /* ---------- RENDER ---------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-7xl rounded-lg bg-white p-4 shadow">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="ml-1 text-gray-800 font-bold text-2xl">
            <h1>Restaurant Menu</h1>
          </div>
          <div className="text-sm text-white rounded-md bg-orange-600 px-4 py-2">
            {loading
              ? "Loading…"
              : totalCount != null
              ? `Total: ${totalCount}`
              : `Loaded: ${items.length}`}
            {saving ? " • Saving…" : ""}
            {error && (
              <span className="ml-3 rounded bg-red-100 px-2 py-1 text-red-700">
                {error}
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <section className="mb-6 rounded-lg bg-gray-50 p-4">
          <h2 className="mb-3 text-lg font-semibold">
            {editingId ? "Edit Item" : "Add New Item"}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleInput}
                placeholder="Pizza Margherita"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleInput}
                placeholder="Starters / Main Courses / Drinks …"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price (single or base)
              </label>
              <input
                name="price"
                value={form.price}
                onChange={handleInput}
                placeholder="10.99"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                placeholder="Item description…"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
              />
            </div>

            <div className="md:col-span-3 flex items-center gap-3">
              <input
                id="sizesEnabled"
                type="checkbox"
                name="sizesEnabled"
                checked={form.sizesEnabled}
                onChange={handleInput}
              />
              <label htmlFor="sizesEnabled" className="text-sm text-gray-800">
                Enable sizes (Small / Medium / Large)
              </label>
            </div>

            {form.sizesEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Small Price
                  </label>
                  <input
                    name="sizePrices.small"
                    value={form.sizePrices.small}
                    onChange={handleInput}
                    placeholder="8.99"
                    className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Medium Price
                  </label>
                  <input
                    name="sizePrices.medium"
                    value={form.sizePrices.medium}
                    onChange={handleInput}
                    placeholder="10.99"
                    className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Large Price
                  </label>
                  <input
                    name="sizePrices.large"
                    value={form.sizePrices.large}
                    onChange={handleInput}
                    placeholder="12.99"
                    className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
                  />
                </div>
                <div className="md:col-span-3 text-xs text-gray-600">
                  When sizes are enabled, a <code>sizes</code> array is sent and{" "}
                  <code>price</code> is omitted.
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input
                name="image"
                value={form.image}
                onChange={handleInput}
                placeholder="https://example.com/pizza.jpg"
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
              />
            </div>

            {(form.preview || form.image) && (
              <div className="md:col-span-3">
                <div className="mb-1 text-sm font-medium text-gray-700">
                  Preview
                </div>
                <img
                  src={form.preview || form.image}
                  className="h-44 w-full max-w-[520px] rounded-md object-cover ring-1 ring-black/10"
                  alt="preview"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleInput}
                className="mt-1 block w-full rounded-md border-gray-300 p-2 text-sm shadow-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {editingId ? (
              <>
                <button
                  onClick={onUpdate}
                  disabled={saving}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Update
                </button>
                <button
                  onClick={onCancelEdit}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={onSave}
                disabled={saving}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
              >
                Add Item
              </button>
            )}
          </div>
        </section>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            placeholder="Search name/description/category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[320px] max-w-full rounded-md border p-2 text-sm"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-md border p-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-600">Per page</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="rounded-md border p-2 text-sm"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {/* View-Umschalter */}
            <div className="ml-2 flex items-center gap-2">
              <label className="text-sm text-gray-600">View</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="rounded-md border p-2 text-sm"
              >
                <option value="grouped">Grouped by Category</option>
                <option value="table">Table</option>
              </select>
            </div>

            <button
              onClick={() => setReloadTick((t) => t + 1)}
              className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        {viewMode === "table" && (
          <>
            <section className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Price/Base
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sizes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        Loading…
                      </td>
                    </tr>
                  ) : dataForTable.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        No items.
                      </td>
                    </tr>
                  ) : (
                    dataForTable.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 rounded object-cover ring-1 ring-black/10"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.category || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.price != null
                            ? `${item.price.toFixed(2)}`
                            : item.basePrice != null
                            ? `${item.basePrice.toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[280px] truncate">
                          {item.sizesUI || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              (item.status || "Active") === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status || "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onEdit(item)}
                            className="ml-2 rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="ml-2 rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>

            {/* Pagination (nur sinnvoll im Table-Mode) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-gray-700">
                Page {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={isPrevDisabled}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                    isPrevDisabled
                      ? "cursor-not-allowed bg-white/40 text-gray-400 ring-white/30"
                      : "bg-white text-gray-800 ring-black/10 hover:bg-gray-50"
                  }`}
                >
                  ← Prev
                </button>

                <div className="hidden items-center gap-1 md:flex">
                  {paginateRange(page, totalPages).map((n, idx) =>
                    n === "…" ? (
                      <span key={`dots-${idx}`} className="px-2 text-gray-500">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`rounded-md px-3 py-2 text-sm ring-1 ${
                          n === page
                            ? "bg-orange-600 text-white ring-orange-700"
                            : "bg-white text-gray-800 ring-black/10 hover:bg-gray-50"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                </div>

                <button
                  disabled={isNextDisabled}
                  onClick={() => setPage((p) => p + 1)}
                  className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                    isNextDisabled
                      ? "cursor-not-allowed bg-white/40 text-gray-400 ring-white/30"
                      : "bg-white text-gray-800 ring-black/10 hover:bg-gray-50"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Grouped by Category */}
        {viewMode === "grouped" && (
          <section className="mt-8">
            {Array.from(
              new Set(filteredAll.map((i) => i.category).filter(Boolean))
            )
              .sort()
              .map((cat) => {
                const list = filteredAll.filter((i) => i.category === cat);
                return (
                  <div key={cat} className="mb-10">
                    <h3 className="mb-3 text-xl font-semibold">{cat}</h3>
                    {list.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No items in this category.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {list.map((i) => (
                          <div
                            key={`group-card-${i.id}`}
                            className="overflow-hidden rounded-2xl bg-white shadow ring-1 ring-black/5"
                          >
                            <img
                              src={i.image}
                              alt={i.name}
                              className="h-40 w-full object-cover"
                            />
                            <div className="p-4">
                              <div className="text-base font-extrabold">
                                {i.name}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                {i.description}
                              </p>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
                                  {i.price != null
                                    ? `${i.price.toFixed(2)} €`
                                    : i.basePrice != null
                                    ? `${i.basePrice.toFixed(2)} €`
                                    : "—"}
                                </span>
                                {Array.isArray(i.sizes) &&
                                i.sizes.length > 0 ? (
                                  <select className="rounded-md border px-2 py-1 text-xs">
                                    {i.sizes.map((s) => {
                                      const pv = Number(s.price);
                                      return (
                                        <option key={s.label} value={s.label}>
                                          {s.label}
                                          {Number.isFinite(pv)
                                            ? ` (${pv.toFixed(2)} €)`
                                            : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    Single
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => onEdit(i)}
                                  className="flex-1 rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => onDelete(i.id)}
                                  className="flex-1 rounded bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </section>
        )}
      </div>
    </div>
  );
}
