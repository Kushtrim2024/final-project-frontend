// components/AddToCartModal.jsx
"use client";
import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cartApi";
import { getAuth } from "@/lib/auth";
import Image from "next/image";

const seededAlt = (seed, w = 800, h = 400) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

export default function AddToCartModal({ item, onClose, onAdded }) {
  const { userId } = getAuth();

  const sizeOptions = Array.isArray(item?.sizes) ? item.sizes : [];
  const addOnOptions = Array.isArray(item?.addOns) ? item.addOns : [];

  const [selectedSize, setSelectedSize] = useState(
    sizeOptions.length ? sizeOptions[0]?.label : null
  );
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [qty, setQty] = useState(1);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setSelectedSize(sizeOptions.length ? sizeOptions[0]?.label : null);
    setSelectedAddOns([]);
    setQty(1);
  }, [item]);

  const estUnit =
    sizeOptions.length > 0
      ? Number(
          (sizeOptions.find((s) => s.label === selectedSize) || sizeOptions[0])
            ?.price
        ) || 0
      : Number(item?.basePrice) || Number(item?.price) || 0;

  const estExtras = (selectedAddOns || []).reduce((s, name) => {
    const found = addOnOptions.find((a) => a.name === name);
    return s + (Number(found?.price) || 0);
  }, 0);

  const estTotal = (estUnit + estExtras) * qty;

  async function handleAdd() {
    if (!userId) {
      alert("Please log in (set userId and token)");
      return;
    }
    try {
      setPosting(true);
      await addToCart({
        userId,
        menuItemId: item.id || item._id,
        quantity: qty,
        size: selectedSize || undefined,
        addOns: (selectedAddOns || []).map((name) => {
          const a = addOnOptions.find((x) => x.name === name);
          return { name, price: Number(a?.price) || 0 };
        }),
      });
      onAdded?.();
      onClose?.();
    } catch (e) {
      alert(`Could not add to cart: ${e.message}`);
    } finally {
      setPosting(false);
    }
  }

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Image
            src={item.img}
            alt={item.name}
            width={800}
            height={400}
            className="h-48 w-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = seededAlt(
                `${item.restaurantId}:${item.id}`
              );
            }}
          />
          <button
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
              {item.description ? (
                <p className="mt-1 text-sm text-slate-600">
                  {item.description}
                </p>
              ) : null}
            </div>
            {item.restaurantId && (
              <Link
                href={`/restaurants/${item.restaurantId}/products/${item.id}`}
                className="text-xs text-rose-600 underline underline-offset-2 hover:text-rose-700"
                onClick={onClose}
              >
                View details →
              </Link>
            )}
          </div>

          {/* Sizes */}
          {sizeOptions.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-800">Size</div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sizeOptions.map((s) => {
                  const label = s.label || "Size";
                  const price = Number(s.price) || 0;
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
          {addOnOptions.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-800">Extras</div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {addOnOptions.map((a) => {
                  const price = Number(a.price) || 0;
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

          {/* Qty + total */}
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
              <div className="text-xs text-slate-500">Estimated total</div>
              <div className="text-xl font-extrabold text-slate-900">
                € {estTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              className="rounded-lg px-4 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              disabled={posting}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              onClick={handleAdd}
            >
              {posting ? "Adding…" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
