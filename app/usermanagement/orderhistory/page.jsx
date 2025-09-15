"use client";
import React, { useState, useEffect } from "react";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusColors = {
    Delivered: "bg-green-100 text-green-700",
    "On the way": "bg-blue-100 text-blue-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          console.warn("No token found!");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5517/orders/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch orders: ${res.status}`);
        }

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []); //
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <p className="text-gray-500 text-center">Loading your orders...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white/80 border rounded-xl shadow-sm p-4 hover:shadow-md transition"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">
                    {order.restaurantName || "Unknown Restaurant"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-md font-medium mt-2 md:mt-0 ${
                    statusColors[order.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status || "Unknown"}
                </span>
              </div>

              {/* Items */}
              <div className="text-sm text-gray-600 mb-3 space-y-1">
                {order.cart?.length > 0 ? (
                  order.cart.map((item, index) => (
                    <p key={index}>
                      {item.quantity}× {item.menuItemName || "Item"}
                    </p>
                  ))
                ) : (
                  <p>No items in this order.</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">
                  Total: €
                  {order.totalPrice ? order.totalPrice.toFixed(2) : "0.00"}
                </p>
                <button className="text-orange-500 hover:underline text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
