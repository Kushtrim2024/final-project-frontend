"use client";
import React, { useState } from "react";
import "../stylesUser/page.css";
export default function AddressPage() {
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      street: "Musterstraße 1",
      city: "Berlin",
      zip: "10115",
      country: "Germany",
      isDefault: true,
    },
    {
      id: 2,
      street: "Hauptstraße 99",
      city: "Hamburg",
      zip: "20095",
      country: "Germany",
      isDefault: false,
    },
  ]);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    street: "",
    city: "",
    zip: "",
    country: "",
  });

  // Delete address
  const handleDelete = (id) => {
    if (confirm("⚠️ Do you really want to delete this address?")) {
      setAddresses(addresses.filter((addr) => addr.id !== id));
    }
  };

  // Edit address
  const handleEdit = (address) => {
    setEditId(address.id);
    setEditForm({ ...address });
  };

  // Save address
  const handleSave = () => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === editId ? { ...a, ...editForm } : a))
    );
    setEditId(null);
  };

  // Cancel edit
  const handleCancel = () => {
    setEditId(null);
  };

  // Add new address
  const handleAdd = () => {
    const newAddress = {
      id: Date.now(),
      street: "",
      city: "",
      zip: "",
      country: "",
      isDefault: false,
    };
    setAddresses((prev) => [...prev, newAddress]);
    setEditId(newAddress.id);
    setEditForm(newAddress);
  };

  // Set default & move it to top
  const handleSetDefault = (id) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    updated.sort((a, b) =>
      a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1
    );
    setAddresses(updated);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Addresses</h1>

      <div className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`border rounded-lg p-4 shadow-sm bg-white ${
              address.isDefault ? "border-orange-400" : "border-gray-200"
            }`}
          >
            {editId === address.id ? (
              // Edit Mode
              <div className="space-y-2">
                <input
                  type="text"
                  value={editForm.street}
                  onChange={(e) =>
                    setEditForm({ ...editForm, street: e.target.value })
                  }
                  placeholder="Street"
                  className="w-full border rounded p-2"
                />
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm({ ...editForm, city: e.target.value })
                  }
                  placeholder="City"
                  className="w-full border rounded p-2"
                />
                <input
                  type="text"
                  value={editForm.zip}
                  onChange={(e) =>
                    setEditForm({ ...editForm, zip: e.target.value })
                  }
                  placeholder="ZIP Code"
                  className="w-full border rounded p-2"
                />
                <input
                  type="text"
                  value={editForm.country}
                  onChange={(e) =>
                    setEditForm({ ...editForm, country: e.target.value })
                  }
                  placeholder="Country"
                  className="w-full border rounded p-2"
                />

                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">
                    {address.street}, {address.city}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.zip}, {address.country}
                  </p>
                  {address.isDefault && (
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ➕ Add New Address */}
      <div className="mt-6">
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          + Add New Address
        </button>
      </div>
    </div>
  );
}
