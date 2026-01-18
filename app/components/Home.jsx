"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import LoaderOverlay from "./LoaderOverlay.jsx";
import Image from "next/image";
import { API_BASE } from "../lib/api";
const API_BASEx = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE;
const PAGE_SIZE_OPTIONS = [9, 12, 18];

/* =============================================================================
   Stable image helpers (no Math.random → SSR-safe)
============================================================================= */
function hashInt(str) {
  const s = String(str ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function pickIndex(arrLen, seed) {
  if (!arrLen) return 0;
  const h = hashInt(seed);
  return h % arrLen;
}
function seededRestaurantImage(seed, w = 1400, h = 900) {
  const pool = [
    `https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=${w}&auto=format&fit=crop`,
    `https://picsum.photos/seed/${hashInt(seed)}/${w}/${h}`,
  ];
  return pool[pickIndex(pool.length, seed)];
}

/** ---------- Cart helpers (localStorage) ---------- */
const CART_KEY = "liefrik_cart_v1";

function readCart() {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(CART_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items || []));
  } catch {}
}
function lineExtrasSum(addOnsDetailed) {
  if (!Array.isArray(addOnsDetailed)) return 0;
  return addOnsDetailed.reduce((s, a) => s + (Number(a.price) || 0), 0);
}
function lineTotal(it) {
  const extras = lineExtrasSum(it.selectedAddOnsDetailed);
  const qty = Number(it.qty) || 1;
  return (Number(it.unitPrice) + extras) * qty;
}

/** ---------- Locale helpers (localStorage) ---------- */
const LOCALE_KEY = "LIEFRIK_LOCALE_V1";
/*
  localeInfo = {
    type: "none" | "postcode" | "coords",
    label: string,
    payload?: { postcode?: string, lat?: number, lng?: number }
  }
*/
function readLocale() {
  try {
    if (typeof window === "undefined")
      return { type: "none", label: "Choose your locale" };
    const raw = localStorage.getItem(LOCALE_KEY);
    return raw
      ? JSON.parse(raw)
      : { type: "none", label: "Choose your locale" };
  } catch {
    return { type: "none", label: "Choose your locale" };
  }
}
function writeLocale(val) {
  try {
    localStorage.setItem(
      LOCALE_KEY,
      JSON.stringify(val || { type: "none", label: "Choose your locale" })
    );
  } catch {}
}

/** ---------- Auth helpers (localStorage) ---------- */
function getTokenFromStorage() {
  if (typeof window === "undefined") return null;
  const KEYS = ["liefrik_token", "token", "auth_token"];
  for (const k of KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}
function getRoleFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const a = JSON.parse(raw);
      return a?.user?.role || a?.role || null;
    }
  } catch {}
  // fallback keys you may have elsewhere
  return localStorage.getItem("role");
}

/** ---------- Reverse geocoding (lat/lng -> postcode) ---------- */
// round to ~100m to stabilize cache keys
function roundCoord(x, decimals = 3) {
  const f = Math.pow(10, decimals);
  return Math.round(Number(x) * f) / f;
}
const RG_CACHE_KEY = "LIEFRIK_RG_CACHE_V1";
function readRGCache() {
  try {
    const raw = localStorage.getItem(RG_CACHE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}
function writeRGCache(map) {
  try {
    localStorage.setItem(RG_CACHE_KEY, JSON.stringify(map || {}));
  } catch {}
}
// Nominatim reverse geocode (for production, proxy server-side to avoid rate limits)
async function reverseGeocodeToPostcode(lat, lng) {
  const latR = roundCoord(lat),
    lngR = roundCoord(lng);
  const key = `${latR},${lngR}`;

  const cache = readRGCache();
  if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latR));
  url.searchParams.set("lon", String(lngR));
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString());
  if (!res.ok) {
    cache[key] = null;
    writeRGCache(cache);
    return null;
  }
  const json = await res.json().catch(() => null);
  const pc = json?.address?.postcode || json?.address?.postcode_v2 || null;

  cache[key] = pc;
  writeRGCache(cache);
  return pc;
}

/** ---------- Forward geocoding (postcode -> lat/lng) ---------- */
async function forwardGeocodePostcode(postcode) {
  const pc = String(postcode || "").trim();
  if (!pc) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "de"); // Germany-only
  url.searchParams.set("postalcode", pc);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const arr = await res.json().catch(() => null);
  const hit = Array.isArray(arr) && arr[0] ? arr[0] : null;
  if (!hit) return null;

  const lat = Number(hit.lat),
    lng = Number(hit.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** ---------- Frontend fallbacks ---------- */
const DE_PLZ = /^\d{5}$/; // German PLZ

// Haversine (km)
function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Postcode exact match (tolerates whitespace)
function filterByPostcodeFrontend(items, postcode) {
  const target = String(postcode || "").trim();
  if (!target) return [];
  return (items || []).filter((r) => {
    const pc = String(r?.address?.postalCode ?? "").trim();
    return pc.toLowerCase() === target.toLowerCase();
  });
}

// Coordinate radius filter (km)
function filterByCoordsFrontend(items, lat, lng, maxKm = 25) {
  if (lat == null || lng == null) return [];
  return (items || []).filter((r) => {
    const coords = r?.location?.coordinates || [];
    if (coords.length !== 2) return false;
    const [lonR, latR] = coords; // [lng, lat]
    const d = haversine(lat, lng, latR, lonR);
    return Number.isFinite(d) && d <= maxKm;
  });
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = (searchParams.get("q") || "").trim();
  const cat = (searchParams.get("cat") || "").trim();

  // === Header state (Locale modal) ===
  const [localeInfo, setLocaleInfo] = useState({
    type: "none",
    label: "Choose your locale",
  });
  const [localeModalOpen, setLocaleModalOpen] = useState(false);
  const [postcodeInput, setPostcodeInput] = useState("");

  // ---- Cart (real) ----
  const [cartItems, setCartItems] = useState([]);
  const [delivery] = useState(0);
  const vatRate = 0.07;

  // Derived totals
  const subtotal = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0;
    return +cartItems.reduce((s, it) => s + lineTotal(it), 0).toFixed(2);
  }, [cartItems]);
  const vat = +(subtotal * vatRate).toFixed(2);
  const total = +(subtotal + delivery + vat).toFixed(2);

  // ---- Data & pagination state ----
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [totalCount, setTotalCount] = useState(null);
  const [serverMode, setServerMode] = useState(false);
  const [lastBatchSize, setLastBatchSize] = useState(0);

  const [allItems, setAllItems] = useState(null);
  const [pageItems, setPageItems] = useState([]);

  // Splash control (full-screen loading on the very first fetch)
  const firstLoadRef = useRef(true);
  const [showSplash, setShowSplash] = useState(true);

  // Toolbar search local state
  const [searchText, setSearchText] = useState(q);
  useEffect(() => setSearchText(q), [q]);

  // q/cat change → go first page
  useEffect(() => {
    setPage(1);
  }, [q, cat]);

  // read locale on mount
  useEffect(() => {
    setLocaleInfo(readLocale());
  }, []);

  // ---- fetcher with FRONTEND FALLBACKS ----
    useEffect(() => {
    const controller = new AbortController();

  async function fetchData() {
    setLoading(true);
    setErr(null);
    try {
      // Prepare parameters to send to the API
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        q: q || "",
        cat: cat || ""
      });

      // Add location or Postcode if selected
      if (localeInfo?.type === "coords" && localeInfo.payload) {
        params.append("lat", localeInfo.payload.lat);
        params.append("lng", localeInfo.payload.lng);
      } else if (localeInfo?.type === "postcode" && localeInfo.payload) {
        params.append("postcode", localeInfo.payload.postcode);
      }

      // Send a single clean request to the server
      const res = await fetch(`${API_BASEx}/restaurants?${params.toString()}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Data could not be fetched");

      
      const items = normalizeRestaurants(result.data || []);
      
      setPageItems(items);
      setTotalCount(result.total || 0);
      setServerMode(true); // Now filtering is done on the server

    } catch (e) {
      console.error("Loading Error:", e);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
     fetchData();
    return () => controller.abort();
  }, [page, pageSize, q, cat, localeInfo]);

  // Hide the splash after the very first completed fetch (short delay avoids flicker)
  useEffect(() => {
    if (!loading && firstLoadRef.current) {
      firstLoadRef.current = false;
      const t = setTimeout(() => setShowSplash(false), 350);
      return () => clearTimeout(t);
    }
  }, [loading]);
  // Failsafe: if something goes wrong, auto-hide splash after 2s
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(t);
  }, []);

  // total pages
  const totalPages = useMemo(() => {
    if (totalCount == null || totalCount <= 0) return 1;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [totalCount, pageSize]);

  // Page guard
  useEffect(() => {
    if (totalCount != null) {
      if (page > totalPages) setPage(totalPages);
      if (page < 1) setPage(1);
    } else {
      if (page < 1) setPage(1);
    }
  }, [page, totalPages, totalCount]);

  const isPrevDisabled = loading || page <= 1;
  const isNextDisabled =
    loading ||
    (serverMode
      ? totalCount != null
        ? page >= totalPages
        : lastBatchSize < pageSize
      : page >= totalPages);

  // --- toolbar
  const applySearch = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    const value = (searchText || "").trim();
    if (value) params.set("q", value);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : `${pathname}`);
  };

  /** ===== Cart: load + react to changes ===== */
  useEffect(() => {
    setCartItems(readCart());

    function handleStorage(e) {
      if (e.key === CART_KEY) {
        try {
          const arr = e.newValue ? JSON.parse(e.newValue) : [];
          setCartItems(Array.isArray(arr) ? arr : []);
        } catch {
          setCartItems([]);
        }
      }
    }
    function handleFocus() {
      setCartItems(readCart());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  function changeQty(idx, delta) {
    setCartItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((x, i) =>
        i === idx ? { ...x, qty: Math.max(1, Number(x.qty || 1) + delta) } : x
      );
      writeCart(next);
      return [...next];
    });
  }

  function removeItem(idx) {
    setCartItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.filter((_, i) => i !== idx);
      writeCart(next);
      return next;
    });
  }

  /** ===== Group cart items by restaurant name (fallback-safe) ===== */
  const groupedByRestaurant = useMemo(() => {
    const groups = new Map();
    for (const it of cartItems || []) {
      const key = (
        it.restaurantName ||
        it.restaurantTitle ||
        "Restaurant"
      ).trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }
    return groups;
  }, [cartItems]);

  /** ===== Locale modal handlers ===== */
  function openLocaleModal() {
    setLocaleModalOpen(true);
  }
  function closeLocaleModal() {
    setLocaleModalOpen(false);
  }
  function clearLocale() {
    const v = { type: "none", label: "Choose your locale" };
    setLocaleInfo(v);
    writeLocale(v);
  }

  // Use geolocation; prefer PLZ if reverse geocoding returns a German PLZ
  async function useMyLocation() {
    try {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      const { lat, lng } = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err) => reject(err),
          { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 }
        );
      });

      let postcode = null;
      try {
        postcode = await reverseGeocodeToPostcode(lat, lng);
        if (postcode && !DE_PLZ.test(String(postcode))) {
          postcode = null;
        }
      } catch (e) {
        console.warn("Reverse geocoding failed:", e?.message || e);
      }

      if (postcode) {
        const v = {
          type: "postcode",
          label: `Postcode ${postcode}`,
          payload: { postcode },
        };
        setLocaleInfo(v);
        writeLocale(v);
      } else {
        const v = {
          type: "coords",
          label: "Near me",
          payload: { lat, lng },
        };
        setLocaleInfo(v);
        writeLocale(v);
      }

      closeLocaleModal();
    } catch (e) {
      console.error(e);
      alert("Could not get your location.");
    }
  }

  function applyPostcode() {
    const code = (postcodeInput || "").trim();
    if (!code) return;
    if (!DE_PLZ.test(code)) {
      alert("Please enter a valid 5-digit German postcode (e.g., 16929).");
      return;
    }
    const v = {
      type: "postcode",
      label: `Postcode ${code}`,
      payload: { postcode: code },
    };
    setLocaleInfo(v);
    writeLocale(v);
    closeLocaleModal();
  }

  return (
    <div className="relative min-h-[100dvh] mt-6">
      {showSplash && <LoaderOverlay text="Loading" />}

      {/* background */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden "
      >
        <div className="absolute top-0 left-0 w-full h-36 bg-white" />
        <div className="wave" />
        <div className="wave" />
        <div className="wave" />
      </div>

      {/* Header (location chooser) */}
      <header className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2 text-sm text-white">
          <div className="rounded-l-xl bg-black/40 px-3 py-1">
            <span>📍</span>
            <span>Delivery to: </span>
          </div>

          <button
            onClick={openLocaleModal}
            className="inline-flex items-center gap-2 rounded-r-2xl bg-black/40 px-3 py-1 cursor-pointer"
            title="Choose your locale"
          >
            <span className="font-semibold">
              {localeInfo?.label || "Choose your locale"}
            </span>
            <span>▾</span>
          </button>

          {localeInfo?.type !== "none" && (
            <button
              onClick={clearLocale}
              className="ml-2 rounded-md bg-black/30 px-2 py-0.5 text-xs hover:bg-black/40"
              title="Clear location filter"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Locale Modal */}
      {localeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeLocaleModal}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">
              Choose your locale
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              We’ll show restaurants near your area.
            </p>

            <div className="mt-4 space-y-3">
              <button
                onClick={useMyLocation}
                className="w-full rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 cursor-pointer"
              >
                Use my location
              </button>

              <div className="rounded-lg border border-gray-200 p-3">
                <label className="block text-sm font-medium text-gray-800">
                  or enter your postcode
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 16929"
                    value={postcodeInput}
                    onChange={(e) => setPostcodeInput(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <button
                    onClick={applyPostcode}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Shortcut example (Downtown removed) */}
              <div className="flex flex-wrap gap-2 ">
                {[
                  {
                    label: "16929",
                    payload: { postcode: "16929" },
                    type: "postcode",
                  },
                ].map((x) => (
                  <button
                    key={x.label}
                    onClick={() => {
                      const v = {
                        type: x.type,
                        label:
                          x.type === "postcode"
                            ? `Postcode ${x.payload.postcode}`
                            : x.label,
                        payload: x.payload,
                      };
                      setLocaleInfo(v);
                      writeLocale(v);
                      closeLocaleModal();
                    }}
                    className="rounded-full border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {x.label}
                  </button>
                ))}
              </div>

              <div className="text-right">
                <button
                  onClick={closeLocaleModal}
                  className="text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl gap-6 px-4 pb-16 pt-4 lg:flex">
        <section className="flex-1">
          <div className="mb-6 rounded-2xl bg-white/60 p-6 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome to Liefrik
            </h1>
            <p className="text-gray-700">
              {q || cat ? (
                <>
                  {q && (
                    <>
                      Results for <span className="font-semibold">“{q}”</span>
                      {cat && " • "}
                    </>
                  )}
                  {cat && (
                    <>
                      Category: <span className="font-semibold">{cat}</span>
                    </>
                  )}
                </>
              ) : (
                "Your favorite food ordering platform."
              )}
            </p>
          </div>

          {/* ---- Search ---- */}
          <div className="flex items-center">
            <div className="relative w-full max-w-full mb-3">
              <input
                type="text"
                placeholder="Search for restaurants..."
                className="w-full pl-9 pr-3 py-2 h-9 text-sm text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none bg-white/65"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
                onClick={applySearch}
              />
            </div>
          </div>
          {/* ---- /Search ---- */}

          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-white/90 bg-black/40 p-1 pr-2 pl-2 rounded-md">
              {loading
                ? "Loading…"
                : totalCount != null
                ? `Total: ${totalCount}`
                : ""}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-white/90 bg-black/40 p-1 pr-2 pl-2 rounded-md">
                Per page
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
                className="rounded-md bg-white/90 px-2 py-1 text-sm text-gray-800 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {loading &&
              Array.from({ length: pageSize }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-56 w-full animate-pulse overflow-hidden rounded-2xl bg-white/60 shadow-lg ring-1 ring-black/5"
                />
              ))}

            {!loading && err && (
              <div className="col-span-full rounded-xl bg-red-50 p-4 text-red-700 ring-1 ring-red-200">
                Database cannot be reached.
              </div>
            )}

            {!loading && !err && pageItems.length === 0 && (
              <div className="col-span-full rounded-xl bg-white/80 p-6 text-gray-600 ring-1 ring-black/5">
                No restaurants found.
              </div>
            )}

            {!loading &&
              !err &&
              pageItems.map((r) => (
                <Link
                  key={r._id || r.id}
                  href={`/restaurants/${r._id || r.id}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 focus:outline-none"
                  title={`${r.title} — details`}
                >
                  <Image
                    src={r.img}
                    alt={r.title}
                    width={280}
                    height={280}
                    className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = seededRestaurantImage(
                        `${r.seed}-alt`,
                        1400,
                        900
                      );
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-left">
                    <div className="text-sm tracking-widest text-white/80">
                      {Array.isArray(r.categories) && r.categories.length
                        ? r.categories.join(" • ")
                        : r.subtitle}
                    </div>
                    <div className="text-2xl font-extrabold text-white drop-shadow">
                      {r.title}
                    </div>
                  </div>
                </Link>
              ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-700 bg-white/40 p-2 pr-2 pl-2 rounded-md">
              Page {page} / {totalCount != null ? totalPages : "?"}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={isPrevDisabled}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                  isPrevDisabled
                    ? "cursor-not-allowed bg-white/40 text-gray-400 ring-white/30"
                    : "bg-white/80 text-gray-800 ring-black/10 hover:bg-white"
                }`}
                aria-label="Previous page"
              >
                ← Prev
              </button>

              {totalCount != null && totalPages > 1 && (
                <div className="hidden items-center gap-1 md:flex">
                  {getPageButtons(page, totalPages).map((n, idx) =>
                    n === "…" ? (
                      <span key={`dots-${idx}`} className="px-2 text-white/80">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`rounded-md px-3 py-2 text-sm ring-1 ${
                          n === page
                            ? "bg-rose-600 text-white ring-rose-700"
                            : "bg-white/80 text-gray-800 ring-black/10 hover:bg-white"
                        }`}
                        aria-current={n === page ? "page" : undefined}
                      >
                        {n}
                      </button>
                    )
                  )}
                </div>
              )}

              <button
                disabled={isNextDisabled}
                onClick={() => setPage((p) => p + 1)}
                className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                  isNextDisabled
                    ? "cursor-not-allowed bg-white/40 text-gray-400 ring-white/30"
                    : "bg-white/80 text-gray-800 ring-black/10 hover:bg-white"
                }`}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Info / Contact */}
          <div className="mt-8 rounded-2xl bg-white/85 p-5 shadow ring-1 ring-black/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Information</h2>
                <p className="mt-1 text-sm text-gray-700">
                  Ordering on Liefrik is easy: pick a restaurant, add items to
                  your cart, and checkout securely. <br /> Delivery time may
                  vary depending on the restaurant’s workload. If you need help,
                  our team is here for you.
                </p>
              </div>

              <div className="mt-3 md:mt-0">
                <Link
                  href="/footerinfo/contact"
                  className="w-[7rem] inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  title="Contact Us"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel (real cart) */}
        <aside className="sticky top-4 h-[100dvh] w-full max-w-[360px] shrink-0 bg-[#12151a] px-5 pt-6 text-white max-[1024px]:hidden rounded-xl">
          <div className="rounded-xl bg-[#1b2027] p-4 ring-1 ring-white/5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white text-2xl ml-1 ">
                  🛒
                </span>
                <span className="font-semibold uppercase tracking-wider ml-2">
                  Cart
                </span>
              </div>
              <span className="text-xs text-gray-300">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Items list (grouped by restaurant name) */}
            {cartItems.length === 0 ? (
              <div className="rounded-md bg-[#0f1318] p-3 text-sm text-gray-300">
                Your cart is currently empty
              </div>
            ) : (
              <div className="max-h-64 overflow-auto space-y-3">
                {[...groupedByRestaurant.entries()].map(
                  ([restName, items], gi) => (
                    <div key={`${restName}-${gi}`} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-sm font-semibold text-white/90">
                          {restName}
                        </div>
                        <div className="text-xs text-white/60">
                          {items.length} item{items.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {items.map((it) => {
                        const absoluteIndex = cartItems.indexOf(it);
                        const extras = lineExtrasSum(it.selectedAddOnsDetailed);
                        const lt = lineTotal(it);
                        return (
                          <div
                            key={`${restName}-${absoluteIndex}`}
                            className="flex gap-3 rounded-lg bg-[#0f1318] p-3 ring-1 ring-white/5"
                          >
                            <Image
                              src={it.img}
                              alt={it.name}
                              width={56}
                              height={56}
                              className="h-14 w-14 rounded-md object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = seededRestaurantImage(
                                  `${String(
                                    it.restaurantId || it.id || it.name
                                  )}-alt`,
                                  100,
                                  100
                                );
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-sm font-semibold">
                                    {it.name}
                                  </div>
                                  <div className="text-[11px] text-gray-400">
                                    {it.selectedSize
                                      ? `Size: ${it.selectedSize}`
                                      : "—"}
                                  </div>
                                  {Array.isArray(it.selectedAddOnsDetailed) &&
                                    it.selectedAddOnsDetailed.length > 0 && (
                                      <div className="text-[11px] text-gray-400">
                                        {it.selectedAddOnsDetailed
                                          .map((a) => a.name)
                                          .join(", ")}
                                      </div>
                                    )}
                                  <div className="text-[11px] text-gray-400 italic mt-0.5">
                                    {it.restaurantName ||
                                      it.restaurantTitle ||
                                      "Restaurant"}
                                  </div>
                                </div>
                                <button
                                  className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                                  onClick={() => removeItem(absoluteIndex)}
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="mt-2 flex items-center justify-between">
                                <div className="inline-flex items-center rounded-md bg-black/40">
                                  <button
                                    className="h-7 w-7 cursor-pointer"
                                    onClick={() => changeQty(absoluteIndex, -1)}
                                    aria-label="Decrease"
                                  >
                                    –
                                  </button>
                                  <div className="w-8 text-center text-sm">
                                    {it.qty}
                                  </div>
                                  <button
                                    className="h-7 w-7 cursor-pointer"
                                    onClick={() => changeQty(absoluteIndex, +1)}
                                    aria-label="Increase"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="text-sm font-semibold">
                                  € {lt.toFixed(2)}
                                </div>
                              </div>
                              <div className="mt-1 text-[11px] text-gray-400">
                                Unit €{Number(it.unitPrice).toFixed(2)}
                                {extras > 0
                                  ? ` + extras €${extras.toFixed(2)}`
                                  : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-medium">€ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery Charge</span>
                <span className="font-medium">€ {delivery.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>VAT 7%</span>
                <span className="font-medium">€ {vat.toFixed(2)}</span>
              </div>
              <div className="mt-2 border-t border-white/10 pt-3 text-base font-semibold text-white">
                <div className="flex items-center justify-between">
                  <span>TOTAL</span>
                  <span>€ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-lg bg-rose-600 py-3 font-semibold tracking-wide hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
              disabled={cartItems.length === 0}
              onClick={() => {
                const token = getTokenFromStorage();
                const role = getRoleFromStorage();
                if (!token || role !== "user") {
                  alert(
                    "Only customers with the 'user' role can use checkout."
                  );
                  return;
                }
                router.push("/checkout");
              }}
            >
              CHECKOUT
            </button>
          </div>
        </aside>
      </main>

      {/* background styles */}
      <style jsx global>{`
        html,
        body,
        #__next {
          height: 100%;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(
            315deg,
            #cc5200 0%,
            #e65c00 25%,
            #ff6600 50%,
            #ff751a 75%,
            #ff944d 100%
          );
          animation: gradient 15s ease infinite;
          background-size: 400% 400%;
          background-attachment: fixed;
          overflow-x: hidden;
        }
        @keyframes gradient {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
        .wave {
          background: rgb(255 255 255 / 25%);
          border-radius: 1000% 1000% 0 0;
          position: fixed;
          width: 200%;
          height: 18rem;
          animation: wave 10s -3s linear infinite;
          transform: translate3d(0, 0, 0);
          opacity: 0.8;
          bottom: 0;
          left: 0;
        }
        .wave:nth-of-type(2) {
          bottom: 1.25em;
          animation: wave 18s linear reverse infinite;
          opacity: 0.8;
        }
        .wave:nth-of-type(3) {
          bottom: -3.5em;
          animation: wave 20s -1s reverse infinite;
          opacity: 0.9;
        }
        @keyframes wave {
          2% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-25%);
          }
          50% {
            transform: translateX(-50%);
          }
          75% {
            transform: translateX(-25%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

/* ---------- helpers ---------- */
function slugify(text) {
  return (text || "")
    .toString()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function extractCategories(x) {
  const arr = Array.isArray(x?.categories) ? x.categories : [];
  return Array.from(
    new Set(arr.map((s) => (s || "").toString().trim()).filter(Boolean))
  );
}

function pickBestImage(x, seed) {
  const candidates = [
    x?.img,
    x?.image,
    x?.photo,
    x?.logo,
    Array.isArray(x?.gallery) ? x.gallery[0] : null,
  ].filter(Boolean);
  const found = candidates.find(
    (u) => typeof u === "string" && /^https?:\/\//i.test(u)
  );
  return found || seededRestaurantImage(seed, 1400, 900);
}

function singularizeSlug(slug) {
  if (slug.endsWith("-es")) return slug.slice(0, -2);
  if (slug.endsWith("es")) return slug.slice(0, -2);
  if (slug.endsWith("s")) return slug.slice(0, -1);
  return slug;
}

function canonicalize(s) {
  let x = slugify(s);
  x = x
    .replace(/^main-course(s)?$/, "main-course")
    .replace(/^main-courses?$/, "main-course")
    .replace(/^special(s)?$/, "special")
    .replace(/^dessert(s)?$/, "dessert")
    .replace(/^starter(s)?$/, "starter")
    .replace(/^drink(s)?$/, "drink")
    .replace(/^d[oö]ner$/, "doner");
  x = singularizeSlug(x);
  return x;
}

function normalizeRestaurants(arr) {
  return arr.map((x) => {
    const title =
      x.title ||
      x.restaurantName ||
      x.name ||
      x.restaurant_title ||
      "Untitled Restaurant";
    const subtitle =
      x.subtitle ||
      (Array.isArray(x.categories) ? x.categories.join(" • ") : null) ||
      x?.address?.city ||
      x.description ||
      "—";

    const seed =
      x?._id || x?.id || x?.restaurantName || x?.name || slugify(title);

    const img = pickBestImage(x, seed);
    const description = x.description || "";

    const dishesArr = Array.isArray(x.meals)
      ? x.meals
      : Array.isArray(x.menuItems)
      ? x.menuItems
      : Array.isArray(x.dishes)
      ? x.dishes
      : [];

    const dishesText = dishesArr
      .map(
        (d) =>
          `${d?.name || d?.title || ""} ${d?.category || ""} ${
            d?.description || ""
          }`
      )
      .join(" ");

    const categories = extractCategories(x);
    const categorySlugs = categories.map((c) => canonicalize(c));

    return {
      ...x,
      seed,
      title,
      subtitle,
      img,
      description,
      dishesText,
      categories,
      categorySlugs,
    };
  });
}

function norm(s) {
  return (s || "")
    .toString()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function scoreRestaurant(r, qn) {
  const name = norm(r.title);
  const sub = norm(r.subtitle);
  const desc = norm(r.description);
  const dishes = norm(r.dishesText || "");
  let s = 0;
  if (!qn) return s;
  if (name.startsWith(qn)) s += 6;
  if (name.includes(qn)) s += 4;
  if (sub.includes(qn)) s += 3;
  if (dishes.includes(qn)) s += 3;
  if (desc.includes(qn)) s += 2;
  return s;
}

function filterAndSort(items, q) {
  const qn = norm(q);
  if (!qn) return items;
  return items
    .map((r) => ({ ...r, __score: scoreRestaurant(r, qn) }))
    .filter((r) => r.__score > 0)
    .sort((a, b) => b.__score - a.__score)
    .map(({ __score, ...rest }) => rest);
}

function filterByCategory(items, catFromQuery) {
  const target = canonicalize(catFromQuery);
  return items.filter((r) => {
    const slugs = Array.isArray(r.categorySlugs) ? r.categorySlugs : [];
    return slugs.some(
      (s) => s === target || s.includes(target) || target.includes(s)
    );
  });
}

/* ---------- Pagination buttons: 1 … current … last ---------- */
function getPageButtons(current, total) {
  if (total <= 1) return [1];

  current = Math.max(1, Math.min(current, total));

  const pages = [1];

  if (current > 2) {
    pages.push("…");
  }

  if (current !== 1 && current !== total) {
    pages.push(current);
  }

  if (current < total - 1) {
    pages.push("…");
  }

  if (total !== 1) {
    pages.push(total);
  }

  return pages;
}
