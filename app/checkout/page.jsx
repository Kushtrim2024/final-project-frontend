"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* =============================================================================
   CONFIG
============================================================================= */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5517";
const CART_API_BASE = process.env.NEXT_PUBLIC_CART_API_BASE || API_BASE;
const CART_KEY = "liefrik_cart_v1";

/* Delivery & tax */
const DELIVERY_FEE = 0;
const VAT_RATE = 0.07;

/* =============================================================================
   AYARLANABİLİR GROUP PAGINATION
   - Varsayılanı 2; kullanıcı UI'dan 1–5 seçebilir; localStorage'da saklanır.
   - İstersen env ile başlangıç değerini verebilirsin:
     NEXT_PUBLIC_CART_GROUPS_PER_PAGE
============================================================================= */
const GROUPS_PER_PAGE_DEFAULT = Number(
  process.env.NEXT_PUBLIC_CART_GROUPS_PER_PAGE || 2
);
const GROUPS_PER_PAGE_LS_KEY = "liefrik_groups_per_page";

/* =============================================================================
   HELPERS
============================================================================= */
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

function detectCardType(cardNumber) {
  const num = (cardNumber || "").replace(/\D/g, "");
  if (/^4/.test(num)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "mastercard";
  if (/^(50|5[6-9]|6[0-9])/.test(num)) return "maestro";
  if (/^3[47]/.test(num)) return "amex";
  if (/^(6011|65|64[4-9]|622)/.test(num)) return "discover";
  return "other";
}

function getAuthFromStorage() {
  if (typeof window === "undefined")
    return { token: null, userId: null, name: null, email: null };
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

  let userId = null,
    name = null,
    email = null;
  for (const k of AUTH_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        userId =
          obj?.user?.id || obj?.user?._id || obj?.id || obj?._id || userId;
        name = obj?.user?.name || obj?.name || name;
        email = obj?.user?.email || obj?.email || email;
        break;
      } catch {}
    }
  }
  if (!userId) {
    for (const k of USER_ID_KEYS) {
      const v = localStorage.getItem(k);
      if (v) {
        userId = v;
        break;
      }
    }
  }
  return { token, userId, name, email };
}

function lineExtrasSum(addOnsDetailed) {
  if (!Array.isArray(addOnsDetailed)) return 0;
  return addOnsDetailed.reduce((s, a) => s + (Number(a.price) || 0), 0);
}
function lineTotal(item) {
  const extras = lineExtrasSum(item.selectedAddOnsDetailed);
  const qty = Number(item.qty) || 1;
  return (Number(item.unitPrice) + extras) * qty;
}

function restaurantHref(restId) {
  return restId ? `/restaurants/${restId}` : null;
}

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

/* =============================================================================
   COMPONENT
============================================================================= */
export default function CheckoutPage() {
  const router = useRouter();

  /* cart */
  const [items, setItems] = useState(null);

  /* form */
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");

  /* auth */
  const { token, userId, name } = getAuthFromStorage();
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    setItems(readCart());
  }, []);

  /* totals */
  const subTotal = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return +items.reduce((s, it) => s + lineTotal(it), 0).toFixed(2);
  }, [items]);
  const vat = +(subTotal * VAT_RATE).toFixed(2);
  const grandTotal = +(subTotal + DELIVERY_FEE + vat).toFixed(2);

  const multiRestaurant = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return false;
    const set = new Set(items.map((i) => i.restaurantId));
    return set.size > 1;
  }, [items]);

  function changeQty(idx, delta) {
    setItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((x, i) =>
        i === idx ? { ...x, qty: Math.max(1, Number(x.qty || 1) + delta) } : x
      );
      writeCart(next);
      return [...next];
    });
  }
  function removeItem(idx) {
    setItems((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.filter((_, i) => i !== idx);
      writeCart(next);
      return next;
    });
  }
  function clearCart() {
    writeCart([]);
    setItems([]);
  }

  async function handleChoosePayment() {
    if (!userId) return;
    try {
      await fetch(`${CART_API_BASE}/cart/choose-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, paymentMethod }),
      });
    } catch (e) {
      console.warn("choose payment failed:", e);
    }
  }

  async function handlePlaceOrder() {
    if (!items || items.length === 0) return alert("Your cart is empty.");
    if (deliveryType === "delivery" && !address.trim())
      return alert("Delivery address is required.");
    if (!customerName.trim()) return alert("Full name is required.");
    if (!phone.trim()) return alert("Phone number is required.");

    await handleChoosePayment();

    const payload = {
      userId: userId || undefined,
      restaurantId: items[0]?.restaurantId, // server tek restoran varsayımı
      customerName,
      phone,
      address,
      deliveryType,
      paymentMethod,
      paymentDetails:
        paymentMethod === "card"
          ? { cardNumber }
          : paymentMethod === "paypal"
          ? { transactionId: "PAYPAL_DEMO_" + Date.now() }
          : {},
    };

    try {
      const res = await fetch(`${CART_API_BASE}/cart/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn("checkout failed:", res.status, await res.text());
        alert(
          "Checkout failed on server. (Demo) Assuming your order was created."
        );
        clearCart();
        router.push("/orders");
        return;
      }
      await res.json();
      clearCart();
      router.push("/orders");
    } catch (e) {
      console.warn("checkout error:", e);
      alert("An error occurred during checkout.");
    }
  }

  /* ===========================================================================
     GROUPING + PAGINATION (restaurant-level)
  =========================================================================== */
  const groupedAll = useMemo(() => {
    const map = new Map();
    (items || []).forEach((it, idx) => {
      const name = (
        it.restaurantName ||
        it.restaurantTitle ||
        "Restaurant"
      ).trim();
      const restId = it.restaurantId || null;
      if (!map.has(name)) map.set(name, { name, restId, entries: [] });
      map.get(name).entries.push({ item: it, index: idx });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items]);

  /* groups/page seçimi (persist) */
  const [groupsPerPage, setGroupsPerPage] = useState(GROUPS_PER_PAGE_DEFAULT);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(GROUPS_PER_PAGE_LS_KEY);
    const n = raw ? Number(raw) : NaN;
    if (!isNaN(n) && n >= 1 && n <= 5) setGroupsPerPage(n);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(GROUPS_PER_PAGE_LS_KEY, String(groupsPerPage));
  }, [groupsPerPage]);

  const [groupPage, setGroupPage] = useState(1);
  const totalGroupPages = Math.max(
    1,
    Math.ceil(groupedAll.length / Math.max(1, groupsPerPage))
  );
  useEffect(() => {
    if (groupPage > totalGroupPages) setGroupPage(totalGroupPages);
    if (groupPage < 1) setGroupPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedAll.length, totalGroupPages, groupsPerPage]);

  const startIdx = (groupPage - 1) * groupsPerPage;
  const endIdx = Math.min(startIdx + groupsPerPage, groupedAll.length);
  const groupsThisPage = groupedAll.slice(startIdx, endIdx);

  /* ===========================================================================
     EDIT MODALI (cart item'ı düzenle: size / add-ons / qty)
     - Not: Restaurant sayfasında sepete atarken snapshot kaydediyoruz:
       availableSizes, availableAddOns
  =========================================================================== */
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null); // absolute index in items[]
  const [editSize, setEditSize] = useState(null);
  const [editAddOns, setEditAddOns] = useState([]);
  const [editQty, setEditQty] = useState(1);

  // unit price'ı, seçilen size'a göre hesapla
  function priceOfSize(sizes, label) {
    if (!Array.isArray(sizes) || sizes.length === 0) return 0;
    const s = sizes.find((x) => x.label === label) || sizes[0];
    const p =
      typeof s?.price === "number" ? s.price : Number(s?.price ?? 0) || 0;
    return p;
  }

  function openEdit(idx) {
    const it = items[idx];
    const sizes = it.availableSizes || [];
    const defaultSize =
      sizes.length > 0
        ? (it.selectedSize &&
            sizes.find((s) => s.label === it.selectedSize)?.label) ||
          sizes[0].label
        : null;

    setEditIdx(idx);
    setEditSize(defaultSize);
    setEditAddOns((it.selectedAddOnsDetailed || []).map((a) => a.name));
    setEditQty(Number(it.qty) || 1);
    setEditOpen(true);
  }

  function saveEdit() {
    if (editIdx == null) return;

    setItems((prev) => {
      const next = [...prev];
      const it = next[editIdx];
      const sizes = it.availableSizes || [];
      const addOns = it.availableAddOns || [];

      // yeni unit price (size'a göre)
      const unitPrice =
        sizes.length > 0
          ? priceOfSize(sizes, editSize)
          : Number(it.unitPrice) || 0;

      // seçilen add-on'ların detay listesi
      const selectedAddOnsDetailed = addOns
        .filter((a) => editAddOns.includes(a.name))
        .map((a) => ({ name: a.name, price: Number(a.price) || 0 }));

      next[editIdx] = {
        ...it,
        qty: editQty,
        selectedSize: editSize || it.selectedSize || null,
        unitPrice,
        selectedAddOnsDetailed,
      };

      writeCart(next);
      return next;
    });

    setEditOpen(false);
    setEditIdx(null);
  }

  /* =============================================================================
     RENDER
  ============================================================================= */
  if (items === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <div className="h-9 w-44 rounded bg-white/60 animate-pulse" />
          <div className="h-9 w-40 rounded bg-white/60 animate-pulse" />
        </div>
        <div className="animate-pulse h-8 w-48 rounded bg-white/60 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-white/60 ring-1 ring-black/5"
              />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-white/60 ring-1 ring-black/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-slate-900">Your Cart</h1>

        <div className="text-sm text-slate-700">
          {isLoggedIn ? (
            <span className="inline-flex items-center gap-2">
              <Link
                href="/"
                className="rounded-lg border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                ← Continue shopping
              </Link>
              <span>Welcome{name ? `, ${name}` : ""}</span>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("auth");
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    localStorage.removeItem("userId");
                    localStorage.removeItem("liefrik_user_id");
                  } catch {}
                  if (typeof window !== "undefined") window.location.reload();
                }}
                className="rounded-md px-2 py-1 text-sm bg-orange-400  hover:bg-rose-600 hover:text-white"
              >
                Logout
              </button>
            </span>
          ) : (
            <Link className="underline hover:text-rose-600" href="/login">
              Log in / Sign up
            </Link>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
          <div className="text-4xl mb-2">🛒</div>
          <div className="text-lg font-semibold">Your cart is empty</div>
          <p className="text-slate-600 mt-1">
            Go back and add some delicious items!
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="rounded-lg bg-rose-600 px-4 py-2 text-white hover:bg-rose-700"
            >
              Browse restaurants
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* LEFT: grouped list with pagination */}
          <div className="md:col-span-2 space-y-5">
            {/* Info line + groups/page selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <div>
                {items.length} item{items.length !== 1 ? "s" : ""}
                {multiRestaurant && (
                  <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Multiple restaurants
                  </span>
                )}
              </div>

              {/* Groups per page selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs">Groups / page:</label>
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  value={groupsPerPage}
                  onChange={(e) => {
                    setGroupsPerPage(
                      Math.max(1, Math.min(5, Number(e.target.value)))
                    );
                    setGroupPage(1);
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Groups (current page) */}
            {groupsThisPage.map((group, gi) => {
              const href = restaurantHref(group.restId);
              return (
                <div key={`${group.name}-${gi}`} className="space-y-3">
                  <div className="flex items-center justify-between px-0.5">
                    {href ? (
                      <Link
                        href={href}
                        title={`Go to ${group.name}`}
                        className="text-sm font-semibold text-rose-700 hover:text-rose-800 hover:underline"
                      >
                        {group.name}
                      </Link>
                    ) : (
                      <div className="text-sm font-semibold text-slate-800">
                        {group.name}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      {group.entries.length} item
                      {group.entries.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {group.entries.map(({ item: it, index: idx }) => {
                    const extrasSum = lineExtrasSum(it.selectedAddOnsDetailed);
                    const lt = lineTotal(it);
                    const itemRestHref = restaurantHref(it.restaurantId);

                    return (
                      <div
                        key={`${group.name}-${idx}`}
                        className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5"
                      >
                        <img
                          src={it.img}
                          alt={it.name}
                          className="h-24 w-24 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              "https://picsum.photos/seed/fallback/200/200";
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {it.name}
                              </div>

                              <div className="text-[11px] text-slate-500 italic mt-0.5">
                                {itemRestHref ? (
                                  <Link
                                    href={itemRestHref}
                                    className="hover:underline text-rose-700 hover:text-rose-800"
                                    title={`Go to ${
                                      it.restaurantName ||
                                      it.restaurantTitle ||
                                      "Restaurant"
                                    }`}
                                  >
                                    {it.restaurantName ||
                                      it.restaurantTitle ||
                                      "Restaurant"}
                                  </Link>
                                ) : (
                                  it.restaurantName ||
                                  it.restaurantTitle ||
                                  "Restaurant"
                                )}
                              </div>

                              <div className="text-xs text-slate-600 mt-1">
                                {it.selectedSize
                                  ? `Size: ${it.selectedSize}`
                                  : "—"}
                              </div>
                              {Array.isArray(it.selectedAddOnsDetailed) &&
                                it.selectedAddOnsDetailed.length > 0 && (
                                  <div className="mt-1 text-xs text-slate-600">
                                    Extras:{" "}
                                    {it.selectedAddOnsDetailed
                                      .map(
                                        (a) =>
                                          `${a.name} (+€${(
                                            a.price || 0
                                          ).toFixed(2)})`
                                      )
                                      .join(", ")}
                                  </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                className="text-xs text-slate-600 hover:text-slate-900"
                                onClick={() => openEdit(idx)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs text-rose-600 hover:text-rose-700"
                                onClick={() => removeItem(idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-lg border border-slate-200">
                              <button
                                className="h-8 w-8 text-lg"
                                onClick={() => changeQty(idx, -1)}
                              >
                                –
                              </button>
                              <div className="w-10 text-center text-sm">
                                {it.qty}
                              </div>
                              <button
                                className="h-8 w-8 text-lg"
                                onClick={() => changeQty(idx, +1)}
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right">
                              <div className="text-xs text-slate-500">
                                Unit €{Number(it.unitPrice).toFixed(2)}
                                {extrasSum > 0 && (
                                  <span> + Extras €{extrasSum.toFixed(2)}</span>
                                )}
                              </div>
                              <div className="text-base font-bold text-slate-900">
                                € {lt.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Pagination bar */}
            {groupedAll.length > groupsPerPage && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Showing restaurants {startIdx + 1}–{endIdx} of{" "}
                  {groupedAll.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
                    disabled={groupPage <= 1}
                    className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                      groupPage <= 1
                        ? "cursor-not-allowed bg-white/60 text-slate-400 ring-slate-200"
                        : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                    }`}
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>

                  <div className="hidden md:flex items-center gap-1">
                    {getPageButtons(groupPage, totalGroupPages).map((n, i) =>
                      n === "…" ? (
                        <span key={`dots-${i}`} className="px-2 text-slate-500">
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setGroupPage(n)}
                          className={`rounded-md px-3 py-2 text-sm ring-1 ${
                            n === groupPage
                              ? "bg-rose-600 text-white ring-rose-700"
                              : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                          }`}
                          aria-current={n === groupPage ? "page" : undefined}
                        >
                          {n}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setGroupPage((p) => Math.min(totalGroupPages, p + 1))
                    }
                    disabled={groupPage >= totalGroupPages}
                    className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                      groupPage >= totalGroupPages
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

            {/* bottom actions */}
            <div className="flex items-center justify-between">
              <button
                className="text-sm text-slate-600 hover:text-slate-900"
                onClick={clearCart}
              >
                Clear cart
              </button>
              <div className="text-sm text-slate-600">
                Subtotal:{" "}
                <span className="font-semibold text-slate-900">
                  € {subTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: summary + form */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#12151a] p-4 text-white ring-1 ring-white/10">
              <div className="mb-3 font-semibold tracking-wider">Summary</div>
              <div className="space-y-2 text-sm text-gray-300">
                <Row k="Subtotal" v={`€ ${subTotal.toFixed(2)}`} />
                <Row k="Delivery" v={`€ ${DELIVERY_FEE.toFixed(2)}`} />
                <Row k="VAT 7%" v={`€ ${vat.toFixed(2)}`} />
                <div className="mt-2 border-t border-white/10 pt-3 text-base font-semibold text-white">
                  <div className="flex items-center justify-between">
                    <span>TOTAL</span>
                    <span>€ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="mb-3 text-sm font-semibold text-slate-800">
                Delivery / Pickup
              </div>
              <div className="flex gap-2">
                <button
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    deliveryType === "delivery"
                      ? "border-rose-600 bg-rose-50"
                      : "border-slate-200 bg-white"
                  }`}
                  onClick={() => setDeliveryType("delivery")}
                >
                  Delivery
                </button>
                <button
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    deliveryType === "takeaway"
                      ? "border-rose-600 bg-rose-50"
                      : "border-slate-200 bg-white"
                  }`}
                  onClick={() => setDeliveryType("takeaway")}
                >
                  Pickup
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {deliveryType === "delivery" && (
                  <textarea
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                  />
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="mb-3 text-sm font-semibold text-slate-800">
                Payment
              </div>

              <div className="flex flex-wrap gap-2">
                {["card", "paypal", "applepay", "googlepay"].map((pm) => (
                  <button
                    key={pm}
                    className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                      paymentMethod === pm
                        ? "border-rose-600 bg-rose-50"
                        : "border-slate-200 bg-white"
                    }`}
                    onClick={() => setPaymentMethod(pm)}
                  >
                    {pm}
                  </button>
                ))}
              </div>

              {paymentMethod === "card" && (
                <div className="mt-3">
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Card number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    {cardNumber
                      ? `Detected: ${detectCardType(cardNumber)}`
                      : "We only store the last 4 digits on the server."}
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-full rounded-lg bg-rose-600 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              disabled={!items.length}
              onClick={handlePlaceOrder}
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL =========================================================== */}
      {editOpen && editIdx != null && items[editIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">Edit item</h3>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                  onClick={() => setEditOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const it = items[editIdx];
                const availableSizes = Array.isArray(it.availableSizes)
                  ? it.availableSizes
                  : [];
                const availableAddOns = Array.isArray(it.availableAddOns)
                  ? it.availableAddOns
                  : [];

                return (
                  <>
                    {/* Sizes */}
                    {availableSizes.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-slate-800">
                          Size
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {availableSizes.map((s) => {
                            const label = s.label || "Size";
                            const price =
                              typeof s.price === "number"
                                ? s.price
                                : Number(s.price) || 0;
                            const active =
                              editSize === label ||
                              (!editSize && it.selectedSize === label);
                            return (
                              <button
                                key={label}
                                onClick={() => setEditSize(label)}
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
                    {availableAddOns.length > 0 ? (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-slate-800">
                          Extras
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availableAddOns.map((a) => {
                            const price =
                              typeof a.price === "number"
                                ? a.price
                                : Number(a.price) || 0;
                            const checked = editAddOns.includes(a.name);
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
                                      setEditAddOns((prev) =>
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
                    ) : (
                      <div className="mt-4 text-sm text-slate-600">
                        This item has no editable extras. (Add-ons snapshot not
                        provided.)
                      </div>
                    )}

                    {/* Qty */}
                    <div className="mt-4 inline-flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Quantity
                      </span>
                      <div className="inline-flex items-center rounded-lg border border-slate-200">
                        <button
                          className="h-9 w-9 text-lg"
                          onClick={() => setEditQty((q) => Math.max(1, q - 1))}
                        >
                          –
                        </button>
                        <div className="w-10 text-center">{editQty}</div>
                        <button
                          className="h-9 w-9 text-lg"
                          onClick={() => setEditQty((q) => Math.min(99, q + 1))}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg px-4 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                        onClick={() => setEditOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                        onClick={saveEdit}
                      >
                        Save changes
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between">
      <span>{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
