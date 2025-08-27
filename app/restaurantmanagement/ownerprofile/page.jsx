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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in.");
          return;
        }

        const res = await fetch("http://localhost:5517/owner/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text}`);
        }

        const data = await res.json();
        setUser(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || {
            street: "",
            city: "",
            postalCode: "",
            country: "",
          },
          restaurantName: data.restaurantName || "",
          taxNumber: data.taxNumber || "",
          website: data.website || "",
        });
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setForm({ ...form, address: { ...form.address, [key]: value } });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Lokales Speichern ohne PUT
  const handleSave = () => {
    setUser(form);
    setEditing(false);
    alert("Profile saved locally!");
  };

  if (error)
    return <p className="text-red-500 mt-10 text-center">❌ {error}</p>;
  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  const addressString = user.address
    ? `${user.address.street}, ${user.address.postalCode} ${user.address.city}, ${user.address.country}`
    : "—";

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow-xl rounded-xl p-8 text-gray-800">
      <div className="flex items-center gap-6 mb-6">
        <img
          src="/avatar.jpg"
          alt="Profilbild"
          className="w-24 h-24 rounded-full border-2 border-gray-300"
        />
        <h1 className="text-3xl font-bold">{user.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="mt-1">{user.name}</p>
          )}
        </div>

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
            <p className="mt-1">{user.email}</p>
          )}
        </div>

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
