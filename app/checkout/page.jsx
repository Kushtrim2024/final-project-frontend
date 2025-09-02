"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** CONFIG */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5517";
const CART_API_BASE = process.env.NEXT_PUBLIC_CART_API_BASE || API_BASE; // ör: 5518 kullanıyorsan .env'de ver
const CART_KEY = "liefrik_cart_v1"; // ← restaurant sayfasıyla AYNI anahtar

const DELIVERY_FEE = 8.57;
const VAT_RATE = 0.05;

/** ---------- Local cart helpers ---------- */
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

/** Card type detect (server ile uyumlu) */
function detectCardType(cardNumber) {
  const num = (cardNumber || "").replace(/\D/g, "");
  if (/^4/.test(num)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(num)) return "mastercard";
  if (/^(50|5[6-9]|6[0-9])/.test(num)) return "maestro";
  if (/^3[47]/.test(num)) return "amex";
  if (/^(6011|65|64[4-9]|622)/.test(num)) return "discover";
  return "other";
}

/** (opsiyonel) token & userId */
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

/** UI hesap */
function lineExtrasSum(addOnsDetailed) {
  if (!Array.isArray(addOnsDetailed)) return 0;
  return addOnsDetailed.reduce((s, a) => s + (Number(a.price) || 0), 0);
}
function lineTotal(item) {
  const extras = lineExtrasSum(item.selectedAddOnsDetailed);
  const qty = Number(item.qty) || 1;
  return (Number(item.unitPrice) + extras) * qty;
}

export default function CheckoutPage() {
  const router = useRouter();

  // cart
  const [items, setItems] = useState(null); // null => loading
  // ödeme / teslimat formu
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState("delivery"); // delivery | takeaway
  const [paymentMethod, setPaymentMethod] = useState("card"); // card | paypal | applepay | googlepay
  const [cardNumber, setCardNumber] = useState(""); // demo için

  const { token, userId } = getAuthFromStorage();

  // localStorage'tan yükle
  useEffect(() => {
    const local = readCart();
    setItems(local);
  }, []);

  // totals
  const subTotal = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return +items.reduce((s, it) => s + lineTotal(it), 0).toFixed(2);
  }, [items]);
  const vat = +(subTotal * VAT_RATE).toFixed(2);
  const grandTotal = +(subTotal + DELIVERY_FEE + vat).toFixed(2);

  // aynı restorandan mı kontrolü (opsiyonel uyarı)
  const multiRestaurant = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return false;
    const set = new Set(items.map((i) => i.restaurantId));
    return set.size > 1;
  }, [items]);

  function saveItems(next) {
    writeCart(next);
    setItems(next);
  }

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
    if (!userId) return; // misafir modunda atla
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
    if (!items || items.length === 0) {
      alert("Sepet boş.");
      return;
    }

    // basit validasyon
    if (deliveryType === "delivery" && !address.trim()) {
      alert("Teslimat adresi gerekli.");
      return;
    }
    if (!customerName.trim()) {
      alert("İsim gerekli.");
      return;
    }
    if (!phone.trim()) {
      alert("Telefon gerekli.");
      return;
    }

    // opsiyonel: ödeme metodu kaydet
    await handleChoosePayment();

    // server checkout için payload
    const payload = {
      userId: userId || undefined, // misafir ise boş bırak
      restaurantId: items[0]?.restaurantId, // çoklu restoran varsa backend'e göre düzenlenebilir
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
          : {}, // applepay/googlepay demoda boş
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
        const t = await res.text();
        console.warn("checkout failed:", res.status, t);
        // local-only fallback: başarı simülasyonu
        alert(
          "Checkout server yanıtı başarısız. (Demo) Siparişiniz oluşturuldu varsayılıyor."
        );
        clearCart();
        router.push("/orders"); // sipariş geçmişine yönlendirme (sayfa varsa)
        return;
      }

      const json = await res.json();
      // başarı
      clearCart();
      router.push("/orders"); // sipariş listesi sayfan
    } catch (e) {
      console.warn("checkout error:", e);
      alert("Checkout sırasında hata oluştu.");
    }
  }

  if (items === null) {
    // loading state
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your Cart</h1>
          <p className="text-slate-600">
            {items.length} item{items.length !== 1 ? "s" : ""}
            {multiRestaurant && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                Farklı restoranlardan ürünler var
              </span>
            )}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Continue shopping
        </Link>
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
          {/* LEFT: items */}
          <div className="md:col-span-2 space-y-4">
            {items.map((it, idx) => {
              const extrasSum = lineExtrasSum(it.selectedAddOnsDetailed);
              const lt = lineTotal(it);
              return (
                <div
                  key={idx}
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
                        <div className="text-xs text-slate-600">
                          {it.selectedSize ? `Size: ${it.selectedSize}` : "—"}
                        </div>
                        {Array.isArray(it.selectedAddOnsDetailed) &&
                          it.selectedAddOnsDetailed.length > 0 && (
                            <div className="mt-1 text-xs text-slate-600">
                              Extras:{" "}
                              {it.selectedAddOnsDetailed
                                .map(
                                  (a) =>
                                    `${a.name} (+€${(a.price || 0).toFixed(2)})`
                                )
                                .join(", ")}
                            </div>
                          )}
                      </div>
                      <button
                        className="text-xs text-rose-600 hover:text-rose-700"
                        onClick={() => removeItem(idx)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-slate-200">
                        <button
                          className="h-8 w-8 text-lg"
                          onClick={() => changeQty(idx, -1)}
                        >
                          –
                        </button>
                        <div className="w-10 text-center text-sm">{it.qty}</div>
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
                <Row k="VAT 5%" v={`€ ${vat.toFixed(2)}`} />
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
                      : "We only store the last 4 digits on server."}
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
