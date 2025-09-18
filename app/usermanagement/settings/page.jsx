"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../../lib/api.js";
const API_BASEx = API_BASE;

export default function SettingsPage() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [addrLoading, setAddrLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Read token
  useEffect(() => {
    const t =
      (typeof window !== "undefined" &&
        (localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token"))) ||
      null;
    setToken(t);
    setReady(true);
  }, []);

  // Load profile
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASEx}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        setForm((f) => ({
          ...f,
          name: data?.name ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
          country: data?.address?.country ?? f.country ?? "",
        }));
      } catch (e) {
        setMsg(e.message || "Could not load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Load default address (only country)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setAddrLoading(true);
        const res = await fetch(`${API_BASEx}/user/profile/addresses/default`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const addr = await res.json();
          if (addr?.country) {
            setForm((f) => ({ ...f, country: f.country || addr.country }));
          }
        }
      } finally {
        setAddrLoading(false);
      }
    })();
  }, [token]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // 1. Validate new password if exists
    if (form.newPassword) {
      const password = form.newPassword;
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setMsg(
          "❌ Password must be at least 8 characters, including uppercase, lowercase, number, and special character."
        );
        return;
      }
      if (form.newPassword !== form.confirmNewPassword) {
        setMsg("❌ New passwords do not match.");
        return;
      }
    }

    // 2. Update user basic info
    try {
      const res = await fetch(`${API_BASEx}/user/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.country ? { country: form.country } : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Profile update failed (${res.status})`);
    } catch (e) {
      setMsg(e.message || "Could not update profile.");
      return;
    }

    // 3. Update password
    if (form.newPassword) {
      try {
        const res = await fetch(`${API_BASEx}/user/profile/update-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: form.currentPassword,
            newPassword: form.newPassword,
            confirmNewPassword: form.confirmNewPassword,
          }),
        });
        if (!res.ok) throw new Error(`Password update failed (${res.status})`);
      } catch (e) {
        setMsg(e.message || "Could not update password.");
        return;
      }
    }

    setMsg("✅ Settings saved.");
    setForm((f) => ({
      ...f,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    }));
  };

  const onDelete = async () => {
    if (
      !confirm(
        "⚠️ Are you sure you want to delete your account? This action cannot be undone!"
      )
    )
      return;
    setMsg("");
    try {
      const res = await fetch(`${API_BASEx}/user/profile/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      localStorage.removeItem("authToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (e) {
      setMsg(e.message || "Could not delete account.");
    }
  };

  // UI
  if (!ready) return <p className="mt-10 text-center">Preparing…</p>;
  if (!token)
    return (
      <div className="max-w-md mx-auto mt-16 p-6 rounded-xl shadow bg-white">
        <p className="text-lg font-semibold text-gray-900">Login required</p>
        <a
          href="/login"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Go to login
        </a>
      </div>
    );
  if (loading) return <p className="mt-10 text-center">Loading…</p>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {msg && <div className="mb-4 text-sm p-3 rounded bg-gray-100">{msg}</div>}

      <form
        onSubmit={onSubmit}
        className="bg-white/80 shadow-sm rounded-lg p-6 space-y-6"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border-gray-300 rounded-lg p-2 border"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            className="w-full border-gray-300 rounded-lg p-2 border"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            className="w-full border-gray-300 rounded-lg p-2 border"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Country {addrLoading && <span className="text-xs">(loading…)</span>}
          </label>
          <input
            name="country"
            value={form.country}
            onChange={onChange}
            placeholder="Germany"
            className="w-full border-gray-300 rounded-lg p-2 border"
          />
        </div>

        {/* Current Password */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">
            Current Password
          </label>
          <input
            type={showCurrent ? "text" : "password"}
            name="currentPassword"
            value={form.currentPassword}
            onChange={onChange}
            className="w-full border-gray-300 rounded-lg p-2 border"
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-2 top-9 text-sm text-gray-600"
          >
            {showCurrent ? "Hide" : "Show"}
          </button>
        </div>

        {/* New Password */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input
            type={showNew ? "text" : "password"}
            name="newPassword"
            value={form.newPassword}
            onChange={onChange}
            className="w-full border-gray-300 rounded-lg p-2 border"
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-2 top-9 text-sm text-gray-600"
          >
            {showNew ? "Hide" : "Show"}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            type={showConfirm ? "text" : "password"}
            name="confirmNewPassword"
            value={form.confirmNewPassword}
            onChange={onChange}
            className="w-full border-gray-300 rounded-lg p-2 border"
            placeholder="Repeat new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-2 top-9 text-sm text-gray-600"
          >
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Delete Account
          </button>
          <button
            type="submit"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
