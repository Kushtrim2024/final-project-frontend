"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getOrders } from "../lib/ordersApi";

export default function OrdersPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getOrders();
        if (!ignore) setOrders(Array.isArray(data) ? data : data?.orders || []);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load orders");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Link href="/" className="text-sm text-rose-600 hover:underline">
          ← Home
        </Link>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div className="rounded bg-red-50 p-4 text-red-700">{err}</div>
      ) : orders.length === 0 ? (
        <div className="rounded border border-dashed p-6 text-slate-600">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o._id}
              href={`/orders/${o._id}`}
              className="block rounded-xl bg-white p-4 shadow ring-1 ring-black/5 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    #{o._id.slice(-6).toUpperCase()} — {o.status}
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(o.createdAt || o.orderTime).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {Array.isArray(o.items) ? `${o.items.length} item(s)` : ""}
                  </div>
                  <div className="text-lg font-bold">
                    € {(o.total || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
