"use client";

import React, { useState, useEffect } from "react";

export default function PricingPromoPage() {
  const [activeTab, setActiveTab] = useState("pricing");
  const [menuItems, setMenuItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // ---------------- API CALLS ----------------
  const fetchMenuItems = async () => {
    try {
      const res = await fetch(
        "http://localhost:5517/owner/restaurants/RESTAURANT_ID/menu-items",
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error("❌ Fehler beim Laden der Menu Items", err);
    }
  };

  const updateMenuItem = async (id, updatedData) => {
    try {
      const res = await fetch(
        `http://localhost:5517/owner/restaurants/RESTAURANT_ID/menu-items/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updatedData),
        }
      );
      if (!res.ok) throw new Error("Fehler beim Update");
      await fetchMenuItems();
    } catch (err) {
      console.error("❌ Fehler beim Update", err);
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5517/owner/restaurants/RESTAURANT_ID/menu-items/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Fehler beim Löschen");
      await fetchMenuItems();
    } catch (err) {
      console.error("❌ Fehler beim Löschen", err);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
  };

  const handleSave = () => {
    if (editingItem) {
      updateMenuItem(editingItem._id, formData);
      setEditingItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Pricing & Promotions
      </h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-6 justify-center">
        <button
          onClick={() => setActiveTab("pricing")}
          className={`px-4 py-2 ${
            activeTab === "pricing"
              ? "border-b-2 border-orange-500 font-semibold text-orange-600"
              : "text-gray-500 hover:text-orange-600"
          }`}
        >
          Tab 1: Pricing
        </button>
        <button
          onClick={() => setActiveTab("promotions")}
          className={`px-4 py-2 ${
            activeTab === "promotions"
              ? "border-b-2 border-orange-500 font-semibold text-orange-600"
              : "text-gray-500 hover:text-orange-600"
          }`}
        >
          Tab 2: Promotions
        </button>
      </div>

      {/* Tab 1: Pricing */}
      {activeTab === "pricing" && (
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Menu Items (aus Backend)
          </h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Product</th>
                <th className="border p-2">Category</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item._id} className="text-center">
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.category}</td>
                  <td className="border p-2">€{item.price.toFixed(2)}</td>
                  <td className="border p-2 space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMenuItem(item._id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Edit Modal */}
          {editingItem && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white p-6 rounded shadow-md w-96">
                <h3 className="text-lg font-semibold mb-4">
                  Edit {editingItem.name}
                </h3>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border p-2 rounded w-full mb-2"
                />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                  className="border p-2 rounded w-full mb-2"
                />

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-orange-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Promotions */}
      {activeTab === "promotions" && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Promotions (Demo)</h2>
          <p className="text-gray-600">
            Hier könnten deine Restaurant-Promotions stehen.
          </p>
        </section>
      )}
    </div>
  );
}
