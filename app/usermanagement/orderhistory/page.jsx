"use client";
import React, { useState } from "react";

export default function OrderHistoryPage() {
  const [orders] = useState([
    {
      id: "ORD-20230812-001",
      restaurant: "Pizza Palace",
      date: "2025-08-10",
      status: "Delivered",
      total: 24.99,
      items: [
        { name: "Margherita Pizza", qty: 1 },
        { name: "Cola", qty: 2 },
      ],
    },
    {
      id: "ORD-20230812-002",
      restaurant: "Sushi World",
      date: "2025-08-15",
      status: "On the way",
      total: 39.5,
      items: [
        { name: "Sushi Set", qty: 1 },
        { name: "Miso Soup", qty: 2 },
      ],
    },
  ]);

  const statusColors = {
    Delivered: "bg-green-100 text-green-700",
    "On the way": "bg-blue-100 text-blue-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Order History</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg shadow-sm p-4"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">
                    {order.restaurant}
                  </p>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-md font-medium mt-2 md:mt-0 ${
                    statusColors[order.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* Items */}
              <div className="text-sm text-gray-600 mb-3">
                {order.items.map((item, index) => (
                  <p key={index}>
                    {item.qty}× {item.name}
                  </p>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">
                  Total: €{order.total.toFixed(2)}
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
