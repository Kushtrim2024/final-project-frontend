"use client";

import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  <button
    onClick={() => setDarkMode(!darkMode)}
    className="mt-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
  >
    {darkMode ? "Light Mode" : "Dark Mode"}
  </button>;

  // Load user data (later fetch from API)
  useEffect(() => {
    const demoUser = {
      name: "Sami Delivery",
      email: "sami@example.com",
      phone: "+49 176 12345678",
      address: "Musterstraße 12, 10115 Berlin",
    };
    setUser(demoUser);
    setForm(demoUser);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // API request to save user profile goes here
    setUser(form);
    setEditing(false);
    alert("Profile saved!");
  };

  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-lg rounded-lg p-6 text-gray-800">
      <div className="flex flex-col items-left">
        <img
          src="/avatar.jpg"
          alt="Profilbild"
          className="w-32 h-32 rounded-full mb-4"
        />
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            {editing ? (
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
            ) : (
              <p className="mt-1">{user.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            {editing ? (
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
            ) : (
              <p className="mt-1">{user.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            {editing ? (
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
            ) : (
              <p className="mt-1">{user.phone}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Home Address
            </label>
            {editing ? (
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
              />
            ) : (
              <p className="mt-1">{user.address}</p>
            )}
          </div>
        </div>

        {/* Buttons */}
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
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
