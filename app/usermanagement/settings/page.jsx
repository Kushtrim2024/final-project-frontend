"use client";
import React, { useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: "Max Mustermann",
    email: "max@example.com",
    mobile: "+491234567890",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }
    console.log("✅ Settings updated:", form);
    alert("✅ Settings saved!");
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "⚠️ Are you sure you want to delete your account? This action cannot be undone!"
      )
    ) {
      console.log("❌ Account deleted");
      alert("Your account has been deleted.");
      // später: API Call -> /api/user/delete
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-sm rounded-lg p-6 space-y-6"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border-gray-300 py-1 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border-gray-300 py-1 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="w-full border-gray-300 py-1 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter new password"
            className="w-full border-gray-300 py-1 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat new password"
            className="w-full border-gray-300 py-1 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium"
          >
            Delete Account
          </button>
          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
