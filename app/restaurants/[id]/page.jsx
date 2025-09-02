"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

/** CONFIG */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5517";
const CART_API_BASE = process.env.NEXT_PUBLIC_CART_API_BASE || API_BASE; // /cart endpoints
const PAGE_SIZE = 9;

/** ---------- Helpers (deterministic images & urls) ---------- */

/** Simple deterministic hash -> positive integer */
function hashInt(str) {
  const s = String(str ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Pick stable index from array length and seed */
function pickIndex(arrLen, seed) {
  if (!arrLen) return 0;
  const h = hashInt(seed);
  return h % arrLen;
}

/** Deterministic restaurant image (seeded) */
function seededRestaurantImage(seed, w = 1400, h = 900) {
  const unsplashFixed = [
    `https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=${w}&auto=format&fit=crop`,
    `https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=${w}&auto=format&fit=crop`,
  ];

  const picsum = `https://picsum.photos/seed/${hashInt(seed)}/${w}/${h}`;
  const pool = [...unsplashFixed, picsum];
  return pool[pickIndex(pool.length, seed)];
}

/** Fallback alternative */
function seededAlt(seed, w, h) {
  return seededRestaurantImage(`${seed}-alt`, w, h);
}

/** Check valid HTTP URL */
function isHttpUrl(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u);
}

/** Pick best cover from restaurant object */
function pickBestCover(r, seed) {
  const cand = [
    r?.image,
    r?.img,
    r?.logo,
    Array.isArray(r?.gallery) ? r.gallery[0] : null,
  ].filter(Boolean);
  const firstHttp = cand.find(isHttpUrl);
  return firstHttp || seededRestaurantImage(seed);
}

/** Build product detail URL */
const productUrl = (restaurantId, productId) =>
  `/restaurants/${restaurantId}/products/${productId}`;

/** Safe fetch JSON */
async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Plain object check */
function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

/** Choose base price from item (handles sizes) */
function pickBasePrice(x) {
  if (
    typeof x.basePrice === "number" ||
    (typeof x.basePrice === "string" && !isNaN(Number(x.basePrice)))
  ) {
    return Number(x.basePrice);
  }
  if (Array.isArray(x.sizes) && x.sizes.length > 0) {
    const minSize = x.sizes
      .map((s) =>
        typeof s.price === "number" ? s.price : Number(s.price) || 0
      )
      .reduce((a, b) => Math.min(a, b), Infinity);
    return isFinite(minSize) ? minSize : 0;
  }
  if (
    typeof x.price === "number" ||
    (typeof x.price === "string" && !isNaN(Number(x.price)))
  ) {
    return Number(x.price);
  }
  return 0;
}

/** Normalize menu items (supports array OR grouped object) */
function normalizeMenu(input) {
  const flat = [];

  const pushItem = (x, cat) => {
    const id =
      x._id ||
      x.id ||
      String(hashInt(JSON.stringify({ n: x.name, d: x.description })));
    const restId =
      x.restaurantId || x.restaurant_id || x.restId || x.restaurant;
    const seed = `${restId || "r"}:${id}`;
    const priceNum = pickBasePrice(x);

    flat.push({
      id,
      restaurantId: restId,
      name: x.name || x.title || "Untitled Dish",
      description: x.description || "",
      price: priceNum,
      img:
        (Array.isArray(x.images) && isHttpUrl(x.images[0]) && x.images[0]) ||
        (isHttpUrl(x.image) && x.image) ||
        (isHttpUrl(x.img) && x.img) ||
        seededRestaurantImage(seed, 800, 400),
      category: cat || x.category || x.type || "Other",
      basePrice:
        typeof x.basePrice !== "undefined" ? Number(x.basePrice) : undefined,
      sizes: Array.isArray(x.sizes) ? x.sizes : [],
      addOns: Array.isArray(x.addOns) ? x.addOns : [],
      raw: x,
    });
  };

  if (isPlainObject(input)) {
    Object.entries(input).forEach(([cat, arr]) => {
      if (!Array.isArray(arr)) return;
      arr.forEach((x) => pushItem(x, cat));
    });
    return flat;
  }

  const arr = Array.isArray(input) ? input : [];
  arr.forEach((x) => pushItem(x));
  return flat;
}

/** PRICE HELPERS FOR MODAL */
function priceOfSize(sizes, label) {
  if (!Array.isArray(sizes) || sizes.length === 0) return 0;
  const s = sizes.find((x) => x.label === label) || sizes[0];
  const p = typeof s?.price === "number" ? s.price : Number(s?.price ?? 0) || 0;
  return p;
}

function calcItemTotal(item, selectedSizeLabel, chosenAddOns, qty) {
  const base =
    Array.isArray(item.sizes) && item.sizes.length > 0
      ? priceOfSize(item.sizes, selectedSizeLabel)
      : item.basePrice ?? item.price ?? 0;

  const addOnSum = (chosenAddOns || []).reduce((sum, n) => {
    const a = (item.addOns || []).find((x) => x.name === n);
    const ap =
      typeof a?.price === "number" ? a.price : Number(a?.price ?? 0) || 0;
    return sum + ap;
  }, 0);

  return (base + addOnSum) * (qty || 1);
}

/** ---------- Global Cart helpers (localStorage) ---------- */
const CART_KEY = "liefrik_cart_v1";
function readCart() {
  try {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(CART_KEY) : null;
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

/** ---------- Optional auth fetch (for server cart API) ---------- */
function getAuthFromStorage() {
  if (typeof window === "undefined") return { token: null, userId: null };
  const TOKEN_KEYS = ["liefrik_token", "token", "auth_token"];
  const USER_ID_KEYS = ["liefrik_user_id", "userId", "user_id"];
  let token = null;
  let userId = null;
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) {
      token = v;
      break;
    }
  }
  for (const k of USER_ID_KEYS) {
    const v = localStorage.getItem(k);
    if (v) {
      userId = v;
      break;
    }
  }
  return { token, userId };
}

async function addToCartServer({
  userId,
  token,
  menuItemId,
  quantity,
  size,
  addOns,
}) {
  try {
    const res = await fetch(`${CART_API_BASE}/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId,
        menuItemId,
        quantity,
        size,
        addOns, // [{name, price}]
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      // Go silently (UI is running locally), console for debug
      console.warn("addToCartServer failed:", res.status, t);
    }
  } catch (e) {
    console.warn("addToCartServer error:", e);
  }
}

/** PAGE */
export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);

  // UI state
  const [activeCat, setActiveCat] = useState("All");
  const [page, setPage] = useState(1);

  // Cart demo state (visual subtotal)
  const [subtotal, setSubtotal] = useState(0);
  const delivery = 8.57;
  const vatRate = 0.05;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [qty, setQty] = useState(1);

  // Apply LocalStorage cart summary collection on page load
  useEffect(() => {
    const init = readCart().reduce((sum, it) => {
      const extras = Array.isArray(it.selectedAddOnsDetailed)
        ? it.selectedAddOnsDetailed.reduce(
            (s, a) => s + (Number(a.price) || 0),
            0
          )
        : 0;
      return sum + (Number(it.unitPrice) + extras) * (Number(it.qty) || 1);
    }, 0);
    setSubtotal(+init.toFixed(2));
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetchJSON(`${API_BASE}/restaurants/${id}`);
        if (!r) throw new Error("Restaurant not found");
        const rid = r._id || r.id;

        const productsRaw =
          (await fetchJSON(`${API_BASE}/restaurants/${rid}/products`)) || [];

        // Group object/array difference is resolved in normalizeMenu
        const products = normalizeMenu(
          Array.isArray(productsRaw)
            ? productsRaw
            : isPlainObject(productsRaw)
            ? productsRaw
            : Array.isArray(productsRaw?.data)
            ? productsRaw.data
            : r.meals || r.menuItems || r.dishes || []
        );

        if (!ignore) {
          setRestaurant(r);
          setMenu(products);
        }
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      ignore = true;
    };
  }, [id]);

  // categories (dynamic)
  const categories = useMemo(() => {
    const set = new Set(menu.map((m) => m.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [menu]);

  // filter + paginate
  const filtered = useMemo(() => {
    if (activeCat === "All") return menu;
    return menu.filter((m) => (m.category || "Other") === activeCat);
  }, [menu, activeCat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  // Reset page when category changes
  useEffect(() => setPage(1), [activeCat]);

  // derived totals
  const vat = +(subtotal * vatRate).toFixed(2);
  const total = +(subtotal + delivery + vat).toFixed(2);

  // hero data
  const rid = restaurant?._id || restaurant?.id || id || "unknown";
  const title =
    restaurant?.restaurantName ||
    restaurant?.title ||
    restaurant?.name ||
    "Restaurant";
  const cover = restaurant
    ? pickBestCover(restaurant, `cover:${rid}`)
    : seededRestaurantImage(`cover:${rid}`);
  const description =
    restaurant?.description || `${title} — delicious meals and more.`;

  /** Modal open helper */
  function openItemModal(item) {
    setSelectedItem(item);
    const defaultSize =
      Array.isArray(item?.sizes) && item.sizes.length > 0
        ? item.sizes[0]?.label
        : null;
    setSelectedSize(defaultSize);
    setSelectedAddOns([]);
    setQty(1);
    setModalOpen(true);
  }

  /** Add to cart from modal */
  async function addConfiguredToCart() {
    if (!selectedItem) return;

    // Remove selected add-ons from price
    const chosenAddOnsDetailed = (selectedItem.addOns || [])
      .filter((a) => selectedAddOns.includes(a.name))
      .map((a) => ({ name: a.name, price: Number(a.price) || 0 }));

    const unitPrice =
      Array.isArray(selectedItem.sizes) && selectedItem.sizes.length
        ? Number(
            (
              selectedItem.sizes.find((s) => s.label === selectedSize) ||
              selectedItem.sizes[0]
            ).price
          ) || 0
        : selectedItem.basePrice ?? selectedItem.price ?? 0;

    // 1)Write to LocalStorage (instantly update UI)
    const itemToAdd = {
      id: selectedItem.id,
      restaurantId: selectedItem.restaurantId,
      name: selectedItem.name,
      img: selectedItem.img,
      qty,
      unitPrice,
      selectedSize,
      selectedAddOnsDetailed: chosenAddOnsDetailed,
    };
    const next = [...readCart(), itemToAdd];
    writeCart(next);

    // 2) Update UI subtotal
    const lineTotal = calcItemTotal(
      selectedItem,
      selectedSize,
      selectedAddOns,
      qty
    );
    setSubtotal((s) => +(s + lineTotal).toFixed(2));

    // 3) (optional) Send to server cart (if token & userId exist)
    const { token, userId } = getAuthFromStorage();
    if (userId) {
      addToCartServer({
        userId,
        token,
        menuItemId: selectedItem.id || selectedItem._id,
        quantity: qty,
        size: selectedSize || undefined,
        addOns: chosenAddOnsDetailed, // [{name, price}]
      });
    }

    setModalOpen(false);
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100">
      {/* HERO ------------------------------------------------------------------------------------------------------ */}
      <div className="relative">
        <img
          src={cover}
          alt={title}
          className="h-[260px] w-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = seededAlt(`cover:${rid}`, 1400, 260);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-slate-100" />
        <div className="absolute inset-x-0 bottom-10 mx-auto max-w-7xl px-4 ">
          <div className="flex flex-col items-center justify-between">
            <div className="flex flex-row justify-between w-full">
              {/* Liefrik fixed logo (top-left) */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md bg-white/60 px-3 py-1 text-sm font-bold text-gray-800  hover:bg-rose-600 hover:text-white"
              >
                <span className="pb-1">←</span> Liefrik
                <img
                  src="/logo_blank.png"
                  alt="Liefrik"
                  className="h-6 w-auto object-contain"
                />
              </Link>

              <div className="hidden text-sm text-gray-800 bg-white/60 px-2 pt-1.5 rounded-sm hover:bg-rose-600 hover:text-white md:block">
                <Link href="/login">LOG IN / SIGN UP</Link>
              </div>
            </div>
            <div className="flex flex-col justify-start  w-full">
              <h1 className="mt-3 text-3xl font-extrabold text-white  mb-2">
                {title}
              </h1>
              <p className="max-w-3xl text-white/90">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY ------------------------------------------------------------------------------------------------------ */}
      <div className="mx-auto max-w-7xl px-4 pb-16 lg:flex lg:gap-6">
        {/* LEFT: menu categories + grid */}
        <section className="flex-1">
          {/* Category tabs + arrows */}
          <div className="-mt-10 rounded-2xl bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-2 px-3 pt-3">
              <button
                onClick={() => {
                  const i = Math.max(0, categories.indexOf(activeCat) - 1);
                  setActiveCat(categories[i]);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                aria-label="Prev category"
              >
                ‹
              </button>

              <div className="no-scrollbar -mx-1 flex w-full gap-2 overflow-x-auto px-1">
                {categories.map((c) => {
                  const active = c === activeCat;
                  return (
                    <button
                      key={c}
                      onClick={() => setActiveCat(c)}
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ring-1 transition ${
                        active
                          ? "bg-rose-600 text-white ring-rose-700"
                          : "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-white"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  const i = Math.min(
                    categories.length - 1,
                    categories.indexOf(activeCat) + 1
                  );
                  setActiveCat(categories[i]);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                aria-label="Next category"
              >
                ›
              </button>
            </div>

            {/* Info cards: Address / Contact / Hours */}
            <div className="mt-4 grid grid-cols-1 gap-4 px-4 pb-2 md:grid-cols-3">
              <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
                <div className="font-semibold">Address</div>
                <div className="text-sm text-gray-600">
                  {restaurant?.address?.street || "-"},{" "}
                  {restaurant?.address?.city || "-"}{" "}
                  {restaurant?.address?.postalCode
                    ? `(${restaurant.address.postalCode})`
                    : ""}
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
                <div className="font-semibold">Contact</div>
                <div className="text-sm text-gray-600">
                  {restaurant?.phone || "-"} • {restaurant?.email || "-"}
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
                <div className="font-semibold">Hours</div>
                <div className="text-sm text-gray-600">
                  {restaurant?.hours ? "See below" : "Not provided"}
                </div>
              </div>
            </div>

            {/* Menu grid */}
            <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading &&
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div
                    key={`sk-${i}`}
                    className="h-56 w-full animate-pulse overflow-hidden rounded-2xl bg-white/60 shadow-lg ring-1 ring-black/5"
                  />
                ))}

              {!loading && err && (
                <div className="col-span-full rounded-xl bg-red-50 p-4 text-red-700 ring-1 ring-red-200">
                  {err}
                </div>
              )}

              {!loading && !err && pageItems.length === 0 && (
                <div className="col-span-full rounded-xl bg-white p-6 text-center text-slate-600 ring-1 ring-black/5">
                  No items in this category.
                </div>
              )}

              {!loading &&
                !err &&
                pageItems.map((item) => {
                  const restForUrl =
                    item.restaurantId ||
                    restaurant?._id ||
                    restaurant?.id ||
                    id;
                  const seed = `${restForUrl}:${item.id}`;
                  const imgDeterministic =
                    item.img && isHttpUrl(item.img)
                      ? item.img
                      : seededRestaurantImage(seed, 800, 400);

                  const toHref = productUrl(restForUrl, item.id);

                  return (
                    <Link
                      key={item.id}
                      href={toHref}
                      className="group overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                      title={`${item.name} — details`}
                      onClick={(e) => {
                        // When the card is clicked, open a modal instead of a route
                        e.preventDefault();
                        openItemModal(item);
                      }}
                    >
                      <img
                        src={imgDeterministic}
                        alt={item.name}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = seededAlt(seed, 800, 400);
                        }}
                      />
                      <div className="p-4">
                        <div className="mb-1 text-center text-base font-extrabold text-slate-900">
                          {item.name}
                        </div>
                        {item.description && (
                          <p className="line-clamp-2 text-center text-xs text-slate-600">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="rounded-md bg-slate-900 px-2 py-1 text-sm text-white">
                            {item.price.toFixed(2)} €
                          </span>
                          <button
                            type="button"
                            className="text-white text-sm px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openItemModal(item);
                            }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-2 px-4 pb-4">
              <div className="text-xs text-slate-600">
                Page {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                    page <= 1
                      ? "cursor-not-allowed bg-white/60 text-slate-400 ring-slate-200"
                      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  ← Prev
                </button>

                <div className="hidden items-center gap-1 md:flex">
                  {paginateRange(page, totalPages).map((n, i) =>
                    n === "…" ? (
                      <span key={`dots-${i}`} className="px-2 text-slate-500">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`rounded-md px-3 py-2 text-sm ring-1 ${
                          n === page
                            ? "bg-rose-600 text-white ring-rose-700"
                            : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                    page >= totalPages
                      ? "cursor-not-allowed bg-white/60 text-slate-400 ring-slate-200"
                      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Opening Hours */}
            {restaurant?.hours && (
              <div className="mx-4 mb-4">
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  Opening Hours
                </h3>
                <div className="overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                  <table className="w-full text-left text-sm">
                    <tbody>
                      {Object.entries(restaurant.hours).map(([day, val]) => (
                        <tr key={day} className="border-b last:border-b-0">
                          <td className="px-4 py-2 font-medium capitalize">
                            {day}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {val?.open && val?.close
                              ? `${val.open} – ${val.close}`
                              : "Closed"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: sticky cart */}
        <aside className="sticky top-0 z-10 mt-6 h-[100dvh] w-full max-w-[360px] shrink-0 rounded-t-xl bg-[#12151a] px-5 pt-6 text-white lg:mt-0">
          <div className="rounded-xl bg-[#1b2027] p-4 ring-1 ring-white/5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20 text-rose-300">
                🛒
              </span>
              <span className="font-semibold uppercase tracking-wider">
                Cart
              </span>
            </div>

            <div className="rounded-md bg-[#0f1318] p-3 text-sm text-gray-300">
              {subtotal === 0
                ? "Your Cart is Currently Empty"
                : "Items added (demo)"}
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <Row k="Subtotal" v={`€ ${subtotal.toFixed(2)}`} />
              <Row k="Delivery Charge" v={`€ ${delivery.toFixed(2)}`} />
              <Row k="VAT 5%" v={`€ ${vat.toFixed(2)}`} />
              <div className="mt-2 border-t border-white/10 pt-3 text-base font-semibold text-white">
                <div className="flex items-center justify-between">
                  <span>TOTAL</span>
                  <span>€ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-lg bg-rose-600 py-3 font-semibold tracking-wide hover:bg-rose-700"
              onClick={() => router.push("/checkout")}
            >
              CHECKOUT
            </button>
          </div>
        </aside>
      </div>

      {/* MODAL ----------------------------------------------------------------------------------------------------- */}
      {modalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative">
              <img
                src={selectedItem.img}
                alt={selectedItem.name}
                className="h-48 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = seededAlt(
                    `${selectedItem.restaurantId}:${selectedItem.id}`,
                    800,
                    400
                  );
                }}
              />
              <button
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedItem.name}
                  </h3>
                  {selectedItem.description ? (
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedItem.description}
                    </p>
                  ) : null}
                </div>
                {selectedItem.restaurantId && (
                  <Link
                    href={productUrl(
                      selectedItem.restaurantId,
                      selectedItem.id
                    )}
                    className="text-xs text-rose-600 underline underline-offset-2 hover:text-rose-700"
                    onClick={() => setModalOpen(false)}
                  >
                    View details →
                  </Link>
                )}
              </div>

              {/* Sizes */}
              {Array.isArray(selectedItem.sizes) &&
                selectedItem.sizes.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-slate-800">
                      Size
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedItem.sizes.map((s) => {
                        const label = s.label || "Size";
                        const price =
                          typeof s.price === "number"
                            ? s.price
                            : Number(s.price) || 0;
                        const active = selectedSize === label;
                        return (
                          <button
                            key={label}
                            onClick={() => setSelectedSize(label)}
                            className={`rounded-lg border px-3 py-2 text-sm text-left ${
                              active
                                ? "border-rose-600 bg-rose-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-slate-600">
                              € {price.toFixed(2)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Add-ons */}
              {Array.isArray(selectedItem.addOns) &&
                selectedItem.addOns.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-slate-800">
                      Extras
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedItem.addOns.map((a) => {
                        const price =
                          typeof a.price === "number"
                            ? a.price
                            : Number(a.price) || 0;
                        const checked = selectedAddOns.includes(a.name);
                        return (
                          <label
                            key={a.name}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                              checked
                                ? "border-slate-300 bg-slate-50"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedAddOns((prev) =>
                                    e.target.checked
                                      ? [...prev, a.name]
                                      : prev.filter((x) => x !== a.name)
                                  );
                                }}
                              />
                              <span>{a.name}</span>
                            </span>
                            <span className="text-slate-700">
                              € {price.toFixed(2)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Qty + price summary */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    Quantity
                  </span>
                  <div className="inline-flex items-center rounded-lg border border-slate-200">
                    <button
                      className="h-9 w-9 text-lg"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      –
                    </button>
                    <div className="w-10 text-center">{qty}</div>
                    <button
                      className="h-9 w-9 text-lg"
                      onClick={() => setQty((q) => Math.min(99, q + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Item total</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    €{" "}
                    {calcItemTotal(
                      selectedItem,
                      selectedSize,
                      selectedAddOns,
                      qty
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  onClick={addConfiguredToCart}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Helpers (bottom) */
function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <span>{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function paginateRange(current, total) {
  const delta = 1;
  const range = [];
  const out = [];
  let l;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    )
      range.push(i);
  }
  for (const i of range) {
    if (l) {
      if (i - l === 2) out.push(l + 1);
      else if (i - l !== 1) out.push("…");
    }
    out.push(i);
    l = i;
  }
  return out;
}
