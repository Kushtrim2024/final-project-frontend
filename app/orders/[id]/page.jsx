"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getOrderById } from "@/lib/ordersApi";

const money = (n) => (Number(n) || 0).toFixed(2);

export default function OrderDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getOrderById(id);
        if (!ignore) setOrder(data);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load order");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!order) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Order #{order._id.slice(-6).toUpperCase()}
        </h1>
        <Link href="/orders" className="text-sm text-rose-600 hover:underline">
          ← Orders
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow ring-1 ring-black/5">
          <div className="font-semibold mb-2">Customer</div>
          <div className="text-sm">{order.customerName}</div>
          <div className="text-sm">{order.phone}</div>
          {order.address && <div className="text-sm">{order.address}</div>}
        </div>
        <div className="rounded-xl bg-white p-4 shadow ring-1 ring-black/5">
          <div className="font-semibold mb-2">Meta</div>
          <div className="text-sm">Status: {order.status}</div>
          <div className="text-sm">Payment: {order.paymentMethod}</div>
          {order?.paymentDetails?.last4 && (
            <div className="text-sm">
              Card •••• {order.paymentDetails.last4}
            </div>
          )}
          <div className="text-sm">
            Date:{" "}
            {new Date(order.createdAt || order.orderTime).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 shadow ring-1 ring-black/5">
        <div className="mb-2 font-semibold">Items</div>
        <div className="divide-y">
          {order.items?.map((it, i) => (
            <div
              key={i}
              className="py-3 flex items-start justify-between gap-3"
            >
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-slate-600">
                  Qty: {it.quantity}
                  {it.size ? ` • Size: ${it.size}` : ""}
                  {Array.isArray(it.addOns) && it.addOns.length > 0
                    ? ` • Extras: ${
                        it.addOns.join
                          ? it.addOns.join(", ")
                          : it.addOns.map((a) => a.name).join(", ")
                      }`
                    : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">€ {money(it.price)}</div>
                <div className="text-sm font-semibold">€ {money(it.total)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-lg font-bold">
          Total: € {money(order.total)}
        </div>
      </div>
    </div>
  );
}
