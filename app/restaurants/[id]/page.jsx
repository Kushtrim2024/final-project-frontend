"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE } from "../../lib/api.js";
/* =============================================================================
   Config
============================================================================= */
const API_BASEx = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE;
const CART_API_BASE = process.env.NEXT_PUBLIC_CART_API_BASE || API_BASEx;
const PAGE_SIZE = 9;

/* =============================================================================
   Stable image helpers (SSR-safe; no Math.random)
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
function seededAlt(seed, w, h) {
  return seededRestaurantImage(`${seed}-alt`, w, h);
}
function isHttpUrl(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u);
}
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

/* =============================================================================
   Auth helpers (JWT in localStorage)
============================================================================= */
function decodeJwtPayload(token) {
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    try {
      const base = token.split(".")[1];
      const json = atob(base);
      return JSON.parse(json);
    } catch {
      return {};
    }
  }
}
function getAuthFromStorage() {
  if (typeof window === "undefined")
    return {
      token: null,
      userId: null,
      name: null,
      email: null,
      role: null,
      user: null,
    };

  const TOKEN_KEYS = ["liefrik_token", "token", "auth_token"];
  const USER_ID_KEYS = ["liefrik_user_id", "userId", "user_id"];
  const AUTH_KEYS = ["auth", "liefrik_auth"];

  let token = null;
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) {
      token = v;
      break;
    }
  }

  // Try stored 'auth' object for richer info
  let authObj = null;
  for (const k of AUTH_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        authObj = JSON.parse(raw);
        break;
      } catch {}
    }
  }

  let name = authObj?.user?.name || authObj?.name || null;
  let email = authObj?.user?.email || authObj?.email || null;
  let role = authObj?.user?.role || authObj?.role || null;

  let userId =
    authObj?.user?.id ||
    authObj?.user?._id ||
    authObj?.id ||
    authObj?._id ||
    null;

  if (!userId) {
    for (const k of USER_ID_KEYS) {
      const v = localStorage.getItem(k);
      if (v) {
        userId = v;
        break;
      }
    }
  }

  // Fallback: try decode JWT payload
  if (token && !userId) {
    const p = decodeJwtPayload(token);
    userId = p?.id || p?._id || p?.userId || null;
    role = role || p?.role || null;
  }

  const user = userId ? { id: userId, name, email, role } : null;
  return { token, userId, name, email, role, user };
}

async function ensureAuthProfileCache() {
  if (typeof window === "undefined") return;
  const { token, name } = getAuthFromStorage();
  if (!token || name) return;
  try {
    const res = await fetch(`${API_BASEx}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const u = await res.json();
      const auth = {
        token,
        user: {
          id: u?._id || u?.id,
          name: u?.name || null,
          email: u?.email || null,
          role: u?.role || "user",
        },
      };
      localStorage.setItem("auth", JSON.stringify(auth));
    }
  } catch {}
}

async function authFetchJSON(url, { method = "GET", body } = {}) {
  const { token } = getAuthFromStorage();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return { ok: res.ok, status: res.status, json };
}

/* =============================================================================
   Menu normalization + pricing
============================================================================= */
function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}
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
      status: x.status || "available",
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

/* =============================================================================
   Cart helpers (shared with Home page)
============================================================================= */
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
function lineExtrasSum(addOnsDetailed) {
  if (!Array.isArray(addOnsDetailed)) return 0;
  return addOnsDetailed.reduce((s, a) => s + (Number(a.price) || 0), 0);
}
function lineTotal(it) {
  const extras = lineExtrasSum(it.selectedAddOnsDetailed);
  const qty = Number(it.qty) || 1;
  return (Number(it.unitPrice) + extras) * qty;
}

/** (optional) server cart */
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
        addOns,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.warn("addToCartServer failed:", res.status, t);
    }
  } catch (e) {
    console.warn("addToCartServer error:", e);
  }
}

/* =============================================================================
   Pricing helpers (modal)
============================================================================= */
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

/* =============================================================================
   Shared pagination helper
============================================================================= */
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

/* =============================================================================
   Ratings UI (unchanged)
============================================================================= */
function Stars({ value = 0, size = "text-xl" }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className={`inline-flex items-center ${size} leading-none`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const state =
          idx <= full ? "full" : idx === full + 1 && half ? "half" : "empty";
        return (
          <span key={i} aria-hidden className="mr-1">
            {state === "full" ? "★" : state === "half" ? "☆" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

function RatingItem({ r, canEdit, onEdit, onDelete }) {
  const dtISO = r?.createdAt
    ? new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ") + "Z"
    : "";
  const who =
    r?.userId?.name ||
    r?.userId?.email ||
    (typeof r?.userId === "string" ? r.userId : "User");

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Stars value={r.rating} size="text-base" />
            <span className="text-sm font-semibold text-slate-800">
              {r.rating}/5
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
            {r.comment || "—"}
          </p>

          {/* Owner Response */}
          {r.ownerResponse?.text && (
            <div className="mt-2 p-2 rounded bg-gray-50 border-l-4 border-green-500">
              <p className="text-xs text-gray-600 font-semibold">
                Owner Response:
              </p>
              <p className="text-sm text-gray-800">{r.ownerResponse.text}</p>
            </div>
          )}

          <div className="mt-2 text-xs text-slate-500">
            {who} • {dtISO}
          </div>
        </div>

        {canEdit && (
          <div className="ml-3 flex gap-2">
            <button
              onClick={onEdit}
              className="rounded-md px-2 py-1 text-xs ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="rounded-md px-2 py-1 text-xs text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** RatingsSection (unchanged) */
function RatingsSection({ restaurantId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [list, setList] = useState([]);
  const [avg, setAvg] = useState(0);
  const [total, setTotal] = useState(0);

  const RPP = 5;
  const [rPage, setRPage] = useState(1);
  const [ratingMin, setRatingMin] = useState(0);

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [auth, setAuth] = useState({ ready: false, token: null, userId: null });
  useEffect(() => {
    const a = getAuthFromStorage();
    setAuth({ ready: true, token: a.token, userId: a.userId });
  }, []);
  const isLoggedIn = auth.ready && Boolean(auth.token);

  async function load() {
    setLoading(true);
    setError(null);
    const url = `${API_BASEx}/restaurants/${restaurantId}/ratings`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ratings (${res.status})`);
      const data = await res.json();

      const arr = Array.isArray(data?.ratings) ? [...data.ratings] : [];
      const tsOf = (r) => {
        if (r?.createdAt) {
          const t = new Date(r.createdAt).getTime();
          return isNaN(t) ? 0 : t;
        }
        if (r?._id && typeof r._id === "string" && r._id.length >= 8) {
          const sec = parseInt(r._id.slice(0, 8), 16);
          return isNaN(sec) ? 0 : sec * 1000;
        }
        return 0;
      };
      arr.sort((a, b) => tsOf(b) - tsOf(a));

      setList(arr);
      setAvg(Number(data?.averageRating || 0));
      setTotal(Number(data?.totalRatings || 0));

      if (auth.ready && auth.userId) {
        const mine = arr.find((r) => {
          const rid =
            (typeof r.userId === "string" && r.userId) || r.userId?._id;
          return rid === auth.userId;
        });
        if (mine) {
          setMyRating(mine.rating || 0);
          setMyComment(mine.comment || "");
          setIsEditing(true);
        } else {
          setMyRating(0);
          setMyComment("");
          setIsEditing(false);
        }
      }
    } catch (e) {
      setError(e.message || "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (restaurantId && auth.ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, auth.ready, auth.userId]);

  const filteredList =
    ratingMin > 0 ? list.filter((r) => Number(r.rating) >= ratingMin) : list;

  const rTotalPages = Math.max(1, Math.ceil(filteredList.length / RPP));
  useEffect(() => {
    if (rPage > rTotalPages) setRPage(rTotalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredList, rTotalPages]);
  useEffect(() => setRPage(1), [ratingMin]);

  const start = (rPage - 1) * RPP;
  const end = Math.min(start + RPP, filteredList.length);
  const pageItems = filteredList.slice(start, end);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLoggedIn) return;

    const payload = { rating: Number(myRating), comment: myComment?.trim() };
    if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
      alert("Please choose a rating between 1 and 5.");
      return;
    }

    const endpoint = `${API_BASEx}/restaurants/${restaurantId}/rating`;
    const method = isEditing ? "PUT" : "POST";
    const { ok, json, status } = await authFetchJSON(endpoint, {
      method,
      body: payload,
    });

    if (!ok) {
      alert(json?.message || `Could not save review (${status}).`);
      return;
    }

    await load();
    setRPage(1);
  }

  async function handleDelete() {
    if (!isLoggedIn) return;
    if (!confirm("Delete your review?")) return;

    const endpoint = `${API_BASEx}/restaurants/${restaurantId}/rating`;
    const { ok, json, status } = await authFetchJSON(endpoint, {
      method: "DELETE",
    });
    if (!ok) {
      alert(json?.message || `Could not delete review (${status}).`);
      return;
    }
    await load();
  }

  return (
    <div className="mt-10">
      <h3 className="mb-3 text-lg font-bold text-slate-900">
        Reviews & Ratings
      </h3>

      {/* summary */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Stars value={avg} />
        <span className="text-slate-800 font-semibold">{avg.toFixed(1)}/5</span>
        <span className="text-slate-500 text-sm">({total} ratings)</span>

        {/* Star filter */}
        <div className="ml-auto flex items-center gap-2 max-[500px]:hidden ">
          <span className="text-sm text-slate-600 ">Filter by rating:</span>
          {[
            { v: 0, label: "All" },
            { v: 5, label: "5★" },
            { v: 4, label: "4★+" },
            { v: 3, label: "3★+" },
            { v: 2, label: "2★+" },
            { v: 1, label: "1★+" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setRatingMin(o.v)}
              className={`rounded-full px-2.5 py-1 text-xs cursor-pointer ring-1 ${
                ratingMin === o.v
                  ? "bg-rose-600 text-white ring-rose-700"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              }`}
              title={
                o.v === 0
                  ? "Show all ratings"
                  : `Show ratings ${o.v} stars and up`
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* login hint */}
      {!isLoggedIn && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-800 ring-1 ring-amber-200">
          Please{" "}
          <Link className="underline font-medium" href="/login">
            sign in
          </Link>{" "}
          to write a review.
        </div>
      )}

      {/* form */}
      <form
        onSubmit={handleSubmit}
        className={`mb-6 rounded-xl bg-white p-4 ring-1 ring-black/5 ${
          !isLoggedIn ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-800">
            Your rating
          </label>
        </div>
        <div className="mt-2 inline-flex items-center gap-1 ">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setMyRating(n)}
              className={`h-8 w-8 rounded-md ring-1 cursor-pointer ${
                myRating >= n
                  ? "bg-yellow-100 ring-yellow-300"
                  : "bg-white ring-slate-200"
              }`}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              title={`${n} star${n > 1 ? "s" : ""}`}
            >
              {myRating >= n ? "★" : "☆"}
            </button>
          ))}
        </div>

        <textarea
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
          rows={3}
          maxLength={1000}
          placeholder="Share your experience (optional)…"
          value={myComment}
          onChange={(e) => setMyComment(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 cursor-pointer"
          >
            {isEditing ? "Update Review" : "Submit Review"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg px-4 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Delete Review
            </button>
          )}
        </div>
      </form>

      {/* list */}
      <div className="space-y-3">
        {loading && <div className="text-sm text-slate-600">Loading…</div>}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}
        {!loading && !error && filteredList.length === 0 && (
          <div className="text-sm text-slate-600">
            No reviews match the selected filter.
          </div>
        )}
        {!loading &&
          !error &&
          pageItems.map((r) => {
            const rUserId =
              (typeof r.userId === "string" && r.userId) || r.userId?._id;
            const mine = Boolean(auth.userId && rUserId === auth.userId);
            return (
              <RatingItem
                key={r._id || `${rUserId}-${r.createdAt}`}
                r={r}
                canEdit={mine}
                onEdit={() => {
                  setMyRating(r.rating || 0);
                  setMyComment(r.comment || "");
                  setIsEditing(true);
                  if (typeof window !== "undefined") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                onDelete={handleDelete}
              />
            );
          })}
      </div>

      {/* pagination bar (ratings) */}
      {filteredList.length > 0 && rTotalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-600">
            Showing {start + 1}–{end} of {filteredList.length}
            {ratingMin > 0 ? ` (filtered from ${list.length})` : ""}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRPage((p) => Math.max(1, p - 1))}
              disabled={rPage <= 1}
              className={`rounded-lg px-3 py-2 text-sm ring-1 cursor-pointer ${
                rPage <= 1
                  ? "cursor-not-allowed bg-white/60 text-slate-400 ring-slate-200"
                  : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
              }`}
              aria-label="Previous page"
            >
              ← Prev
            </button>

            <div className="hidden md:flex items-center gap-1">
              {getPageButtons(rPage, rTotalPages).map((n, i) =>
                n === "…" ? (
                  <span key={`dots-${i}`} className="px-2 text-slate-500">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setRPage(n)}
                    className={`rounded-md px-3 py-2 text-sm ring-1 cursor-pointer ${
                      n === rPage
                        ? "bg-rose-600 text-white ring-rose-700"
                        : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                    }`}
                    aria-current={n === rPage ? "page" : undefined}
                  >
                    {n}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setRPage((p) => Math.min(rTotalPages, p + 1))}
              disabled={rPage >= rTotalPages}
              className={`rounded-lg px-3 py-2 text-sm ring-1 cursor-pointer ${
                rPage >= rTotalPages
                  ? "cursor-not-allowed bg-white/60 text-slate-400 ring-slate-200"
                  : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
              }`}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   Page component
============================================================================= */
export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);

  // NEW: user-picked cover URL, stored per restaurant (highest priority)
  const [userCover, setUserCover] = useState(null); // NEW

  // UI state
  const [activeCat, setActiveCat] = useState("All");
  const [page, setPage] = useState(1);

  // Auth UI (header)
  const [currentUser, setCurrentUser] = useState(null);

  // ---- Cart (real) ----
  const [cartItems, setCartItems] = useState([]); // real cart from localStorage
  const [delivery] = useState(0);
  const vatRate = 0.07;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [qty, setQty] = useState(1);

  // Ensure we have user info cached (name), then set header state
  useEffect(() => {
    (async () => {
      await ensureAuthProfileCache();
      const auth = getAuthFromStorage();
      setCurrentUser(
        auth?.user ||
          (auth.userId
            ? { id: auth.userId, name: auth.name, email: auth.email }
            : null)
      );
    })();
  }, []);

  function handleLogout() {
    try {
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("liefrik_user_id");
    } catch {}
    setCurrentUser(null);
    if (typeof window !== "undefined" && window.location) {
      window.location.reload();
    }
  }

  // ---- Load restaurant + menu ----
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetchJSON(`${API_BASEx}/restaurants/${id}`);
        if (!r) throw new Error("Restaurant not found");
        const rid = r._id || r.id;

        const productsRaw =
          (await fetchJSON(`${API_BASEx}/restaurants/${rid}/products`)) || [];

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

  // Dynamic categories
  const categories = useMemo(() => {
    const set = new Set(menu.map((m) => m.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [menu]);

  // Filter + paginate menu
  const filtered = useMemo(() => {
    let items = menu;
    items = items.filter((m) => (m.status || m.raw?.status) === "available");
    if (activeCat !== "All") {
      items = items.filter((m) => (m.category || "Other") === activeCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [menu, activeCat, searchQuery]);

  const totalActive = useMemo(
    () =>
      Array.isArray(menu)
        ? menu.filter((m) => (m.status || m.raw?.status) === "available").length
        : 0,
    [menu]
  );
  const visibleCount = Array.isArray(filtered) ? filtered.length : 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  // Reset menu page when category changes
  useEffect(() => setPage(1), [activeCat]);

  // ---- Real cart: read + cross-tab sync ----
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

  // ---- One-time migration: enrich old items with restaurantName for THIS page's restaurant ----
  useEffect(() => {
    if (!restaurant) return;
    const ridNow = restaurant._id || restaurant.id || id;
    const nameNow =
      restaurant.restaurantName ||
      restaurant.title ||
      restaurant.name ||
      "Restaurant";

    setCartItems((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((it) => {
        const hasName = it.restaurantName || it.restaurantTitle;
        if (!hasName && String(it.restaurantId) === String(ridNow)) {
          changed = true;
          return { ...it, restaurantName: nameNow };
        }
        return it;
      });
      if (changed) writeCart(next);
      return changed ? next : prev;
    });
  }, [restaurant, id]);

  // Derived totals from real cart
  const subtotal = useMemo(() => {
    if (!Array.isArray(cartItems)) return 0;
    return +cartItems.reduce((s, it) => s + lineTotal(it), 0).toFixed(2);
  }, [cartItems]);
  const vat = +(subtotal * vatRate).toFixed(2);
  const total = +(subtotal + delivery + vat).toFixed(2);

  // Hero data
  const rid = restaurant?._id || restaurant?.id || id || "unknown"; // restaurant id for per-restaurant key

  // NEW: read ONLY the per-restaurant cover from localStorage
  useEffect(() => {
    if (!rid) return;
    try {
      const v = localStorage.getItem(`restaurant_cover_photo_${rid}`);
      setUserCover(typeof v === "string" && /^https?:\/\//i.test(v) ? v : null);
    } catch {
      setUserCover(null);
    }
  }, [rid]); // NEW

  // NEW: keep userCover in sync across tabs/windows
  useEffect(() => {
    function onStorage(e) {
      if (!rid) return;
      if (e.key === `restaurant_cover_photo_${rid}`) {
        const v = e.newValue;
        setUserCover(
          typeof v === "string" && /^https?:\/\//i.test(v) ? v : null
        );
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [rid]); // NEW

  const title =
    restaurant?.restaurantName ||
    restaurant?.title ||
    restaurant?.name ||
    "Restaurant";

  // CHANGED: cover priority -> userCover (per-restaurant) > explicit API coverPhoto > seed/guess > fallback
  const apiCoverHttp =
    restaurant &&
    typeof restaurant.coverPhoto === "string" &&
    /^https?:\/\//i.test(restaurant.coverPhoto)
      ? restaurant.coverPhoto
      : null;

  const cover =
    userCover || // NEW: highest priority (per-restaurant key)
    apiCoverHttp ||
    (restaurant ? pickBestCover(restaurant, `cover:${rid}`) : null) ||
    seededRestaurantImage(`cover:${rid}`); // final fallback

  const description =
    restaurant?.description || `${title} — delicious meals and more.`;

  /** Modal helper */
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

  /** Add to cart from modal (stores restaurantName) */
  async function addConfiguredToCart() {
    if (!selectedItem) return;

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

    const restaurantName =
      restaurant?.restaurantName ||
      restaurant?.title ||
      restaurant?.name ||
      "Restaurant";

    const itemToAdd = {
      id: selectedItem.id,
      restaurantId: selectedItem.restaurantId,
      restaurantName,
      name: selectedItem.name,
      img: selectedItem.img,
      qty,
      unitPrice,
      selectedSize,
      selectedAddOnsDetailed: chosenAddOnsDetailed,

      // snapshot fields used by edit modal
      availableSizes: Array.isArray(selectedItem.sizes)
        ? selectedItem.sizes.map((s) => ({
            label: s.label,
            price: Number(s.price) || 0,
          }))
        : [],
      availableAddOns: Array.isArray(selectedItem.addOns)
        ? selectedItem.addOns.map((a) => ({
            name: a.name,
            price: Number(a.price) || 0,
          }))
        : [],
    };

    const next = [...readCart(), itemToAdd];
    writeCart(next);
    setCartItems(next);

    const { token, userId } = getAuthFromStorage();
    if (userId) {
      addToCartServer({
        userId,
        token,
        menuItemId: selectedItem.id || selectedItem._id,
        quantity: qty,
        size: selectedSize || undefined,
        addOns: chosenAddOnsDetailed,
      });
    }

    setModalOpen(false);
  }

  // Cart actions
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

  // Group items by restaurant name (never show id)
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

  return (
    <div className="min-h-[100dvh] bg-slate-100">
      {/* HERO ================================================================= */}
      <div className="relative">
        <Image
          src={cover}
          alt={title}
          width={1400}
          height={260}
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
              {/* Left: Home */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md bg-white/60 px-3 py-1 text-sm font-bold text-gray-800  hover:bg-rose-600 hover:text-white"
              >
                <span className="pb-1">←</span> Liefrik
                <Image
                  src="/logo_blank.png"
                  alt="Liefrik"
                  className="h-6 w-auto object-contain"
                  width={64}
                  height={64}
                />
              </Link>

              {/* Right: login or username + logout */}
              <div className=" flex justify-between text-sm text-gray-800 bg-white/60 px-2 p-1.5 rounded-sm items-center gap-2 w-50 max-[400px]:w-20 max-[400px]:justify-center">
                {currentUser ? (
                  <>
                    <span className="font-semibold max-[400px]:hidden ">
                      Welcome, {currentUser.name || "User"}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="rounded-md px-2 py-1 text-sm bg-orange-400  hover:bg-rose-600 hover:text-white"
                      title="Logout"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    className=" hover:text-white px-2 rounded-sm"
                    href="/login"
                  >
                    LOG IN / SIGN UP
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-start w-full">
              <h1 className="mt-3 text-3xl font-extrabold text-white mb-2">
                {title}
              </h1>
              <p className="max-w-3xl text-white/90">{description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY ================================================================= */}
      <div className="mx-auto max-w-7xl px-4 pb-16 lg:flex lg:gap-6">
        {/* LEFT: menu + ratings */}
        <section className="flex-1">
          {/* Category tabs + arrows */}
          <div className="-mt-10 rounded-2xl bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-2 h-16 pl-2 pr-2 ">
              <button
                onClick={() => {
                  const i = Math.max(0, categories.indexOf(activeCat) - 1);
                  setActiveCat(categories[i]);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer "
                aria-label="Prev category"
              >
                ‹
              </button>

              <div className="no-scrollbar -mx-1 flex w-full gap-2 overflow-x-auto p-4 ">
                {categories.map((c) => {
                  const active = c === activeCat;
                  return (
                    <button
                      key={c}
                      onClick={() => setActiveCat(c)}
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ring-1 cursor-pointer transition ${
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
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                aria-label="Next category"
              >
                ›
              </button>
            </div>

            {/* Total product count (top of page) */}
            <div className="flex items-center w-full h-8 text-sm font-medium text-gray-700 mt-4 pl-4">
              <div className="bg-gray-100 rounded-full px-4 py-1 max-[700px]:hidden">
                {activeCat === "All"
                  ? `Total products: ${totalActive}`
                  : `Products in ${activeCat} : ${visibleCount}`}
              </div>
              {/* Search box */}
              <div className="px-4 w-4/5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 "
                />
              </div>
            </div>

            {/* Results info */}
            <div className="mt-4 ml-2 px-4 pt-2 text-xs text-slate-600">
              Showing {visibleCount}{" "}
              {activeCat === "All" ? "products" : `products in "${activeCat}"`}
              {searchQuery ? ` matching “${searchQuery}”` : ""} (out of{" "}
              {totalActive} total).
            </div>

            {/* Info cards */}
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
                        e.preventDefault();
                        openItemModal(item);
                      }}
                    >
                      <Image
                        width={400}
                        height={200}
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
                            className="text-white text-sm px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 cursor-pointer"
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

            {/* Menu Pagination */}
            {visibleCount > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 px-4 pb-4">
                <div className="text-xs text-slate-600">
                  Showing {start + 1}–
                  {Math.min(start + PAGE_SIZE, visibleCount)} of {visibleCount}
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
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>

                  <div className="hidden md:flex items-center gap-1">
                    {getPageButtons(page, totalPages).map((n, i) =>
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
                          aria-current={n === page ? "page" : undefined}
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
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

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

          {/* Reviews & Ratings (BOTTOM OF PAGE) */}
          <RatingsSection restaurantId={rid} />
        </section>

        {/* RIGHT: sticky cart (grouped by restaurant name) */}
        <aside className="sticky top-4 h-[90dvh] w-full max-w-[360px] shrink-0 bg-[#12151a] mt-4 px-5 pt-6 text-white max-[1024px]:h-full max-[1024px]:w-full rounded-xl">
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

            {/* Items list (grouped) */}
            {cartItems.length === 0 ? (
              <div className="rounded-md bg-[#0f1318] p-3 text-sm text-gray-300">
                Your cart is currently empty
              </div>
            ) : (
              <div className="max-h-64 overflow-auto space-y-3">
                {[...groupedByRestaurant.entries()].map(
                  ([restName, items], gi) => (
                    <div key={`${restName}-${gi}`} className="space-y-2">
                      {/* Group header */}
                      <div className="flex items-center justify-between px-1">
                        <div className="text-sm font-semibold text-white/90">
                          {restName}
                        </div>
                        <div className="text-xs text-white/60">
                          {items.length} item{items.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Group items */}
                      {items.map((it, idxGlobal) => {
                        // We need the absolute index in cartItems for changeQty/remove
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
                                  {/* Restaurant name under the item (explicit) */}
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
                                    className="h-7 w-7"
                                    onClick={() => changeQty(absoluteIndex, -1)}
                                    aria-label="Decrease"
                                  >
                                    –
                                  </button>
                                  <div className="w-8 text-center text-sm">
                                    {it.qty}
                                  </div>
                                  <button
                                    className="h-7 w-7"
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
                // Read the freshest auth (don’t trust possibly stale state)
                const { role, token } = getAuthFromStorage();
                const isUser = role === "user";

                if (!token || !isUser) {
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
      </div>

      {/* MODAL ================================================================= */}
      {modalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative">
              <Image
                src={selectedItem.img}
                alt={selectedItem.name}
                width={800}
                height={400}
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
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white cursor-pointer"
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
              </div>

              {/* Sizes */}
              {Array.isArray(selectedItem.sizes) &&
                selectedItem.sizes.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-slate-800">
                      Size
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(selectedItem.sizes || []).map((s, i) => {
                        const label =
                          (s?.label && String(s.label).trim()) ||
                          `Size ${i + 1}`;
                        const price = Number(s?.price) || 0;
                        const key =
                          s?._id ||
                          s?.id ||
                          `${selectedItem.id}-size-${label}-${price}-${i}`;
                        const active = selectedSize === label;
                        return (
                          <button
                            key={key}
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
                      {(selectedItem.addOns || []).map((a, i) => {
                        const name =
                          (a?.name && String(a.name).trim()) ||
                          `Extra ${i + 1}`;
                        const price = Number(a?.price) || 0;
                        const key =
                          a?._id ||
                          a?.id ||
                          `${selectedItem.id}-addon-${name}-${price}-${i}`;
                        const checked = selectedAddOns.includes(name);
                        return (
                          <label
                            key={key}
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
                                      ? [...prev, name]
                                      : prev.filter((x) => x !== name)
                                  );
                                }}
                              />
                              <span>{name}</span>
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
                      className="h-9 w-9 text-lg cursor-pointer"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      –
                    </button>
                    <div className="w-10 text-center">{qty}</div>
                    <button
                      className="h-9 w-9 text-lg cursor-pointer"
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

              {/* Actions */}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 cursor-pointer"
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

/* =============================================================================
   Small UI helpers
============================================================================= */
function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <span>{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
