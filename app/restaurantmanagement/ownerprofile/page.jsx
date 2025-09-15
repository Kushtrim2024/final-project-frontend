"use client";

import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: { street: "", city: "", postalCode: "", country: "" },
    restaurantName: "",
    taxNumber: "",
    website: "",
  });
  const [error, setError] = useState(null);

  // Hilft beim sicheren JSON-Parse
  const readJsonSafe = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }
    try {
      const txt = await res.text();
      return { error: txt || "Unbekannte Server-Antwort" };
    } catch {
      return null;
    }
  };

  // Fetch Profile vom Backend
  useEffect(() => {
    const ac = new AbortController();

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in.");
          return;
        }

        const res = await fetch("http://localhost:5517/owner/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
          signal: ac.signal,
        });

        const data = await readJsonSafe(res);

        if (!res.ok) {
          const serverMsg = data?.error || data?.message || "";
          throw new Error(
            `Error ${res.status} ${res.statusText} ${serverMsg}`.trim()
          );
        }

        const owner = data?.owner ?? data ?? {};
        const addr =
          owner.address && typeof owner.address === "object"
            ? owner.address
            : { street: "", city: "", postalCode: "", country: "" };

        setUser(owner);
        setForm({
          name: owner.name || "",
          email: owner.email || "",
          phone: owner.phone || "",
          address: addr,
          restaurantName: owner.restaurantName || "",
          taxNumber: owner.taxNumber || "",
          website: owner.website || "",
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchProfile();
    return () => ac.abort();
  }, []);

  // Form-Handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // PUT-Request zum Backend
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in.");
        return;
      }

      const res = await fetch("http://localhost:5517/owner/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Update failed");
      }

      setUser(data); // Backend gibt updatedOwner zurück
      setEditing(false);
      alert("Änderungen erfolgreich gespeichert!");
    } catch (err) {
      setError(err.message);
    }
  };

  if (error)
    return <p className="text-red-500 mt-10 text-center">❌ {error}</p>;
  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  const safeAddr = user.address || {
    street: "",
    city: "",
    postalCode: "",
    country: "",
  };
  const addressString =
    safeAddr.street || safeAddr.city || safeAddr.postalCode || safeAddr.country
      ? `${safeAddr.street}, ${safeAddr.postalCode} ${safeAddr.city}, ${safeAddr.country}`
      : "—";

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl p-8 text-gray-800">
      <div className="flex items-center gap-6 mb-6">
        <img
          src="/avatar.jpg"
          alt="Profilbild"
          className="w-24 h-24 rounded-full border-2 border-gray-300"
        />
        <h1 className="text-3xl font-bold">{user.name || "—"}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/** Name */}
        <div>
          <label className="font-semibold text-gray-700">Name</label>
          {editing ? (
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1">{user.name || "—"}</p>
          )}
        </div>

        {/** Email */}
        <div>
          <label className="font-semibold text-gray-700">Email</label>
          {editing ? (
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1">{user.email || "—"}</p>
          )}
        </div>

        {/** Phone */}
        <div>
          <label className="font-semibold text-gray-700">Phone</label>
          {editing ? (
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1">{user.phone || "—"}</p>
          )}
        </div>

        {/** Restaurant */}
        <div>
          <label className="font-semibold text-gray-700">Restaurant</label>
          {editing ? (
            <input
              type="text"
              name="restaurantName"
              value={form.restaurantName}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1">{user.restaurantName || "—"}</p>
          )}
        </div>

        {/** Tax Number */}
        <div>
          <label className="font-semibold text-gray-700">Tax Number</label>
          {editing ? (
            <input
              type="text"
              name="taxNumber"
              value={form.taxNumber}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1">{user.taxNumber || "—"}</p>
          )}
        </div>

        {/** Website */}
        <div>
          <label className="font-semibold text-gray-700">Website</label>
          {editing ? (
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded"
            />
          ) : (
            <p className="mt-1">{user.website || "—"}</p>
          )}
        </div>
      </div>

      {/** Address */}
      <div className="mt-6">
        <label className="font-semibold text-gray-700">Address</label>
        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            <input
              type="text"
              name="address.street"
              placeholder="Street"
              value={form.address.street}
              onChange={handleChange}
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="address.postalCode"
              placeholder="Postal Code"
              value={form.address.postalCode}
              onChange={handleChange}
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="address.city"
              placeholder="City"
              value={form.address.city}
              onChange={handleChange}
              className="p-2 border rounded"
            />
            <input
              type="text"
              name="address.country"
              placeholder="Country"
              value={form.address.country}
              onChange={handleChange}
              className="p-2 border rounded"
            />
          </div>
        ) : (
          <p className="mt-1">{addressString}</p>
        )}
      </div>

      {/** Buttons */}
      <div className="mt-6 flex gap-4">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
