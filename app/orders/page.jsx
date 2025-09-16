"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * OrderConfirmationPage
 *
 * Purpose:
 * - Show a simple “Thank you / Order received” screen after checkout.
 * - Optionally display a lightweight summary pulled from sessionStorage.
 *
 * How it works:
 * - Right after a successful checkout, the Checkout page stores:
 *   sessionStorage.setItem("lastOrder", JSON.stringify({ id, total, deliveryType, restaurantId }))
 * - This page reads that value and shows a small summary.
 * - No authentication required here; for full details the user can navigate to
 *   the order history page: /usermanagement/orderhistory
 *
 * Notes:
 * - If you prefer to fetch fresh data instead of using sessionStorage,
 *   you can pass ?id=<orderId> in the URL and call GET /orders/details/:id
 *   with the Authorization header.
 */

export default function OrderConfirmationPage() {
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("lastOrder");
      if (raw) setLastOrder(JSON.parse(raw));
    } catch {
      // Ignore parsing errors; we'll still render the generic thank-you message.
    }
  }, []);

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-extrabold text-slate-900">
        Your order has been received!
      </h1>
      <p className="text-slate-600 mt-2">
        Thank you. We’ve started preparing your order.
      </p>

      {/* Lightweight summary from sessionStorage (optional) */}
      {lastOrder && (
        <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/5 text-left">
          <div className="text-sm text-slate-500">Order summary</div>
          <div className="mt-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Order ID</span>
              <span className="font-semibold">{lastOrder.id}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Amount</span>
              <span className="font-semibold">
                {typeof lastOrder.total === "number"
                  ? `€ ${lastOrder.total.toFixed(2)}`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Fulfillment</span>
              <span className="font-semibold">
                {lastOrder.deliveryType === "takeaway" ? "Pickup" : "Delivery"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="rounded-lg bg-rose-600 px-5 py-2.5 text-white font-semibold hover:bg-rose-700"
        >
          Back to restaurants
        </Link>

        {/* Goes to http://localhost:3000/usermanagement/orderhistory */}
        <Link
          href="/usermanagement/orderhistory"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-slate-800 hover:bg-slate-50"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
