"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

/**
 * HOME (app/page.jsx)
 * - Public endpoint: GET /restaurants
 * - .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:5517
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5517";
const PAGE_SIZE_OPTIONS = [9, 12, 18];

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

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = (searchParams.get("q") || "").trim();
  const cat = (searchParams.get("cat") || "").trim();

  // === Header state ===
  const [locale, setLocale] = useState("Choose your locale");

  // ---- Cart (real) ----
  const [cartItems, setCartItems] = useState([]); // ← gerçek sepet
  const [delivery] = useState(8.57);
  const vatRate = 0.05;

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

  // Toolbar search local state
  const [searchText, setSearchText] = useState(q);
  useEffect(() => setSearchText(q), [q]);

  // q//cat change then return to first page
  useEffect(() => {
    setPage(1);
  }, [q, cat]);

  // ---- fetcher ----
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${API_BASE}/restaurants`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(pageSize));
        if (q) url.searchParams.set("q", q);
        if (cat) url.searchParams.set("category", cat);

        let res = await fetch(url.toString(), {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          res = await fetch(`${API_BASE}/restaurants`, {
            signal: controller.signal,
            cache: "no-store",
          });
          setServerMode(false);
        } else {
          setServerMode(true);
        }

        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const json = await res.json();

        if (json && Array.isArray(json.data)) {
          let items = normalizeRestaurants(json.data);
          if (q) items = filterAndSort(items, q);
          if (cat) items = filterByCategory(items, cat);
          setPageItems(items);
          setLastBatchSize(items.length);
          setTotalCount(
            typeof json.total === "number"
              ? Number(json.total)
              : q || cat
              ? items.length
              : null
          );
          setAllItems(null);
        } else if (Array.isArray(json)) {
          let items = normalizeRestaurants(json);
          if (q) items = filterAndSort(items, q);
          if (cat) items = filterByCategory(items, cat);
          setAllItems(items);
          setServerMode(false);
          setTotalCount(items.length);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const sliced = items.slice(start, end);
          setPageItems(sliced);
          setLastBatchSize(sliced.length);
        } else {
          throw new Error("Unexpected response shape");
        }
      } catch (e) {
        const msg = (e && (e.name || "")).toString().toLowerCase();
        const text = (e && (e.message || "")).toString().toLowerCase();
        const isAbort = msg.includes("abort") || text.includes("abort");
        if (isAbort) return;
        setErr(e.message || "Unknown error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [page, pageSize, q, cat]);

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
    // mount'ta oku
    setCartItems(readCart());

    // sync if updated on another page
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
    // return to the previous page
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

  return (
    <div className="relative min-h-[100dvh]  ">
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

      {/* Header (location/mini panel) */}
      <header className="mx-auto max-w-7xl px-4  ">
        <div className="flex items-center gap-2 text-sm text-white">
          <div className=" rounded-l-xl bg-black/40 px-3 py-1">
            <span>📍</span>
            <span>Delivery to: </span>
          </div>
          <button
            onClick={() =>
              setLocale(
                locale === "Choose your locale"
                  ? "Downtown"
                  : "Choose your locale"
              )
            }
            className="inline-flex items-center gap-1 rounded-r-2xl bg-black/40 px-3 py-1 "
          >
            <span className="font-semibold">{locale}</span>
            <span>▾</span>
          </button>
        </div>
      </header>

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
          {/* ---- Search  ---- */}
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
          {/* ---- /Search---- */}

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
                className="rounded-md bg-white/90 px-2 py-1 text-sm text-gray-800"
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
                Failed to load restaurants: {err}
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
                  title={`${r.title} — detay`}
                >
                  <img
                    src={r.img}
                    alt={r.title}
                    className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getRandomRestaurantImage();
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
              >
                ← Prev
              </button>

              {totalCount != null && (
                <div className="hidden items-center gap-1 md:flex">
                  {paginateRange(page, totalPages).map((n, idx) =>
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
              >
                Next →
              </button>
            </div>
          </div>

          {/* promos */}
          <div className="mt-8 flex flex-col gap-4 md:flex-row">
            <div className="flex-1 rounded-2xl bg-white/80 p-5 shadow ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍱</span>
                <div>
                  <div className="font-bold">Locale Catering</div>
                  <div className="text-sm text-gray-600">Leave it to us</div>
                </div>
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-white/80 p-5 shadow ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">Tell us what you need</div>
                  <div className="text-sm text-gray-600">
                    (we respond quickly)
                  </div>
                </div>
                <button className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700">
                  Chat
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right panel (real cart) */}
        <aside className="sticky top-0 h-[100dvh] w-full max-w-[360px] shrink-0 bg-[#12151a] px-5 pt-6 text-white">
          <div className="rounded-xl bg-[#1b2027] p-4 ring-1 ring-white/5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20 text-rose-300">
                  🛒
                </span>
                <span className="font-semibold uppercase tracking-wider">
                  Cart
                </span>
              </div>
              <span className="text-xs text-gray-300">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Items list */}
            {cartItems.length === 0 ? (
              <div className="rounded-md bg-[#0f1318] p-3 text-sm text-gray-300">
                Your Cart is Currently Empty
              </div>
            ) : (
              <div className="max-h-64 overflow-auto space-y-2">
                {cartItems.map((it, idx) => {
                  const extras = lineExtrasSum(it.selectedAddOnsDetailed);
                  const lt = lineTotal(it);
                  return (
                    <div
                      key={idx}
                      className="flex gap-3 rounded-lg bg-[#0f1318] p-3 ring-1 ring-white/5"
                    >
                      <img
                        src={it.img}
                        alt={it.name}
                        className="h-14 w-14 rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://picsum.photos/seed/fallback/100/100";
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
                          </div>
                          <button
                            className="text-[11px] text-rose-400 hover:text-rose-300"
                            onClick={() => removeItem(idx)}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-md bg-black/40">
                            <button
                              className="h-7 w-7"
                              onClick={() => changeQty(idx, -1)}
                              aria-label="Decrease"
                            >
                              –
                            </button>
                            <div className="w-8 text-center text-sm">
                              {it.qty}
                            </div>
                            <button
                              className="h-7 w-7"
                              onClick={() => changeQty(idx, +1)}
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
                          {extras > 0 ? ` + extras €${extras.toFixed(2)}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                <span>VAT 5%</span>
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
              className="mt-4 w-full rounded-lg bg-rose-600 py-3 font-semibold tracking-wide hover:bg-rose-700 disabled:opacity-60"
              disabled={cartItems.length === 0}
              onClick={() => router.push("/checkout")}
            >
              CHECKOUT
            </button>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-md bg-indigo-500/20 px-2 py-1 text-xs font-semibold text-indigo-300">
                COUPONS (12)
              </span>
              <button className="text-xs text-gray-400 hover:text-white">
                ADD COUPON
              </button>
            </div>

            <div className="relative rounded-xl bg-[#1b2027] p-3 ring-1 ring-white/5">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=600&auto=format&fit=crop"
                  alt="coupon"
                  className="h-28 w-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="text-lg font-extrabold leading-5">
                    SPEND 200 GET 50 € OFF
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    Spend 200€, Get 50€ Off
                  </div>
                </div>
              </div>
            </div>

            <button className="mt-3 w-full rounded-lg bg-[#0f1318] py-2 text-sm text-gray-300 ring-1 ring-white/10 hover:bg-[#0b0f13]">
              VIEW ALL
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

function getRandomRestaurantImage() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const providers = [
    "https://source.unsplash.com/random/1400x900/?restaurant,food",
    "https://loremflickr.com/1400/900/restaurant,food/all",
    `https://picsum.photos/1400/900?random=${Math.floor(Math.random() * 1e9)}`,
  ];
  return pick(providers);
}

function extractCategories(x) {
  const arr = Array.isArray(x?.categories) ? x.categories : [];
  return Array.from(
    new Set(arr.map((s) => (s || "").toString().trim()).filter(Boolean))
  );
}

function pickBestImage(x) {
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
  return found || getRandomRestaurantImage();
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

    const img = pickBestImage(x);
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

function paginateRange(current, total) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let l;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }
  for (let i of range) {
    if (l) {
      if (i - l === 2) rangeWithDots.push(l + 1);
      else if (i - l !== 1) rangeWithDots.push("…");
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
}
