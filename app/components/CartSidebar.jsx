// components/CartSidebar.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { getCart } from "@/lib/cartApi";

const DELIVERY = 5.99;
const VAT_RATE = 0.05;

export default function CartSidebar() {
  const { userId } = getAuth();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => {
    if (!payload) return [];
    // backend: viewCart → { cart: { items: [...] } }
    const cart = payload?.cart || payload;
    return Array.isArray(cart?.items) ? cart.items : [];
  }, [payload]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (typeof it.totalPrice === "number" ? it.totalPrice : 0),
        0
      ),
    [items]
  );
  const vat = +(subtotal * VAT_RATE).toFixed(2);
  const total = +(subtotal + DELIVERY + vat).toFixed(2);

  useEffect(() => {
    if (!userId) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getCart(userId);
        if (!ignore) setPayload(data);
      } catch (e) {
        // sessiz geç
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [userId]);

  return (
    <aside className="sticky top-0 z-10 mt-6 h-[100dvh] w-full max-w-[360px] shrink-0 rounded-t-xl bg-[#12151a] px-5 pt-6 text-white lg:mt-0">
      <div className="rounded-xl bg-[#1b2027] p-4 ring-1 ring-white/5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/20 text-rose-300">
            🛒
          </span>
          <span className="font-semibold uppercase tracking-wider">Cart</span>
          <span className="ml-auto text-xs text-gray-400">
            {loading ? "Loading…" : `${items.length} item(s)`}
          </span>
        </div>

        <div className="rounded-md bg-[#0f1318] p-3 text-sm text-gray-300">
          {items.length === 0
            ? "Your Cart is Currently Empty"
            : "Items added (server cart)"}
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-300">
          <Row k="Subtotal" v={`€ ${subtotal.toFixed(2)}`} />
          <Row k="Delivery Charge" v={`€ ${DELIVERY.toFixed(2)}`} />
          <Row k="VAT 5%" v={`€ ${vat.toFixed(2)}`} />
          <div className="mt-2 border-t border-white/10 pt-3 text-base font-semibold text-white">
            <div className="flex items-center justify-between">
              <span>TOTAL</span>
              <span>€ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Link
          href="/checkout"
          className="mt-4 block w-full rounded-lg bg-rose-600 py-3 text-center font-semibold tracking-wide hover:bg-rose-700"
        >
          CHECKOUT
        </Link>
      </div>
    </aside>
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
