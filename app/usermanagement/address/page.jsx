"use client";
import React, { useEffect, useMemo, useState } from "react";
import "../stylesUser/page.css";
import { API_BASE } from "../../lib/api.js";
// --- Helper: Read token from localStorage (try multiple keys) ---
function readToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    null
  );
}

export default function AddressPage() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Address list: { id, street, city, postalCode, country, isDefault, tempId? }
  const [addresses, setAddresses] = useState([]);

  // Editing state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "",
  });

  // --- Sort: Default address always on top ---
  const sorted = useMemo(() => {
    const copy = [...addresses];
    copy.sort((a, b) =>
      a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1
    );
    return copy;
  }, [addresses]);

  // --- Input CSS styling ---
  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 " +
    "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

  // --- On mount: read token ---
  useEffect(() => {
    setToken(readToken());
  }, []);

  // --- Load addresses from API ---
  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        let list = [];

        // 1) Try direct endpoint: /user/profile/addresses
        try {
          const res = await fetch(`${API_BASE}/user/profile/addresses`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (res.ok) {
            list = await res.json();
            if (!Array.isArray(list)) list = [];
          }
        } catch (err) {
          console.warn("addresses fetch failed:", err);
        }

        // 2) If empty, fallback to profile
        if (list.length === 0) {
          try {
            const res = await fetch(`${API_BASE}/user/profile`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            if (res.ok) {
              const prof = await res.json();
              if (Array.isArray(prof?.addresses)) list = prof.addresses;
              else if (prof?.address) list = [prof.address];
            }
          } catch (err) {
            console.warn("profile fallback failed:", err);
          }
        }

        // 3) Get default address and mark it
        let defaultAddr = null;
        try {
          const res = await fetch(
            `${API_BASE}/user/profile/addresses/default`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }
          );
          if (res.ok) defaultAddr = await res.json();
        } catch (err) {
          console.warn("default address fetch failed:", err);
        }

        // --- Normalize all addresses into consistent format ---
        const norm = (a) => ({
          id: a?.id || a?._id || a?.addressId || null,
          street: a?.street || a?.line1 || "",
          city: a?.city || "",
          postalCode: a?.postalCode || a?.zip || "",
          country: a?.country || "",
          isDefault: !!a?.isDefault,
        });

        let normalized = list.map(norm);

        // Apply default address if provided separately
        if (defaultAddr) {
          const d = norm(defaultAddr);
          let found = false;
          normalized = normalized.map((x) => {
            if (!x.id || !d.id) return x;
            if (x.id === d.id) {
              found = true;
              return { ...x, ...d, isDefault: true };
            }
            return { ...x, isDefault: false };
          });
          if (!found && (d.street || d.city || d.country)) {
            normalized.push({ ...d, isDefault: true });
          }
        }

        setAddresses(normalized);
      } catch (e) {
        setMsg(e.message || "Could not load addresses.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // وقتی صفحه لود شد، آدرس انتخاب‌شده قبلی را بخوانیم
  useEffect(() => {
    const saved = localStorage.getItem("checkoutAddress");
    if (saved) {
      const addr = JSON.parse(saved);
      setSelectedId(addr.id || addr.tempId);
    }
  }, []);

  const handleSelect = (address) => {
    localStorage.setItem("checkoutAddress", JSON.stringify(address));
    setSelectedId(address.id || address.tempId);
  };

  // --- Delete address ---
  const handleDelete = async (id) => {
    if (!id) return;
    if (!confirm("⚠️ Do you really want to delete this address?")) return;
    try {
      const res = await fetch(`${API_BASE}/user/profile/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setMsg("Address deleted.");
    } catch (e) {
      setMsg(e.message || "Could not delete address.");
    }
  };

  // --- Start editing an address ---
  const handleEdit = (address) => {
    setEditId(address.id ?? address.tempId ?? null);
    setEditForm({
      street: address.street || "",
      city: address.city || "",
      postalCode: address.postalCode || "",
      country: address.country || "",
    });
  };

  // --- Cancel editing ---
  const handleCancel = () => setEditId(null);

  // --- Add new address (client-side temp row) ---
  const handleAdd = () => {
    const tempId = `tmp-${Date.now()}`;
    const newAddr = {
      id: null,
      tempId,
      street: "",
      city: "",
      postalCode: "",
      country: "",
      isDefault: false,
    };
    setAddresses((prev) => [newAddr, ...prev]);
    setEditId(tempId);
    setEditForm({ street: "", city: "", postalCode: "", country: "" });
  };

  // --- Save: Create or Update ---
  const handleSave = async () => {
    setMsg("");

    // Basic validation
    if (
      !editForm.street ||
      !editForm.city ||
      !editForm.postalCode ||
      !editForm.country
    ) {
      setMsg(
        "Please fill all required fields: Street, City, Postal Code, Country."
      );
      return;
    }

    const row = addresses.find(
      (a) => a.id === editId || a._id === editId || a.tempId === editId
    );
    if (!row) return;
    // CREATE
    if (!row?.id) {
      try {
        const res = await fetch(`${API_BASE}/user/profile/addresses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        });
        if (!res.ok) throw new Error(`Create failed (${res.status})`);
        const createdUser = await res.json();
        const last = createdUser?.addresses?.[createdUser.addresses.length - 1]; // the Last Address

        const createdNorm = {
          id: last?._id,
          street: last?.street,
          city: last?.city,
          postalCode: last?.postalCode,
          country: last?.country,
          isDefault: false,
        };

        setAddresses((prev) =>
          prev.map((a) => (a.tempId === editId ? createdNorm : a))
        );
        setEditId(null);
        setMsg("✅ Address added.");
      } catch (e) {
        setMsg(e.message || "❌ Could not add address.");
      }
      return;
    }

    // UPDATE
    try {
      const res = await fetch(
        `${API_BASE}/user/profile/addresses/${row._id || row.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!res.ok) {
        throw new Error(
          res.status === 404 || res.status === 405
            ? "Updating addresses is not supported by the server."
            : `Update failed (${res.status})`
        );
      }
      // backend returns the updated single address
      const updated = await res.json();
      // replace only that address in the state
      setAddresses((prev) =>
        prev.map((a) =>
          (a._id || a.id) === (row._id || row.id) ? { ...a, ...updated } : a
        )
      );
      setEditId(null);
      setEditForm({ street: "", city: "", postalCode: "", country: "" });
      setMsg("✅ Address updated successfully.");
    } catch (e) {
      setMsg(e.message || "❌ Could not update address.");
    }
  };

  // --- If no token ---
  if (!token) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-md mx-auto mt-16 p-6 rounded-xl shadow bg-white">
          <p className="text-lg font-semibold text-gray-900">Login required</p>
          <p className="mt-2 text-gray-700">Please sign in to continue.</p>
          <a
            href="/login"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  // --- While loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <p className="mt-10 text-center text-gray-900 font-medium">
          Loading addresses…
        </p>
      </div>
    );
  }

  // --- Render UI ---
  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white/80 shadow rounded-lg p-6">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Addresses</h1>

        {msg && (
          <div className="mb-4 text-sm p-3 rounded bg-gray-100 text-gray-900">
            {msg}
          </div>
        )}

        <div className="space-y-4">
          {sorted.map((address) => {
            const rowKey = address.id || address.tempId;
            const isEditing = editId === (address.id ?? address.tempId ?? null);
            const isSelected = selectedId === rowKey;

            return (
              <div
                key={rowKey}
                className={`border rounded-lg p-4 shadow-sm bg-white/60 ${
                  address.isDefault ? "border-orange-400" : "border-gray-200"
                }`}
              >
                {isEditing ? (
                  // --- Edit Mode ---
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.street}
                      onChange={(e) =>
                        setEditForm({ ...editForm, street: e.target.value })
                      }
                      placeholder="Street"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) =>
                        setEditForm({ ...editForm, city: e.target.value })
                      }
                      placeholder="City"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={editForm.postalCode}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="Postal Code"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) =>
                        setEditForm({ ...editForm, country: e.target.value })
                      }
                      placeholder="Country"
                      className={inputClass}
                    />

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // --- View Mode ---
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {address.street}, {address.city}
                      </p>
                      <p className="text-sm text-gray-700">
                        {address.postalCode}, {address.country}
                      </p>

                      {address.isDefault && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                          Default address
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSelect(address)}
                        className={`px-3 py-2 rounded-lg text-white ${
                          isSelected
                            ? "bg-green-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {isSelected ? "✅ Selected" : "Use for Checkout"}
                      </button>

                      <button
                        onClick={() => handleEdit(address)}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sorted.length === 0 && (
            <p className="text-gray-700">
              You don't have any saved addresses yet.
            </p>
          )}
        </div>

        {/* Add New Address */}
        <div className="mt-6">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Add New Address
          </button>
        </div>
      </div>
    </div>
  );
}
