"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// ---- API Endpoints (zentral) ----
const API_BASE = "http://localhost:5517"; // ⬅️ WICHTIG: /owner, nicht /user
const LOGIN_URL = `${API_BASE}/owner/login`; // ⬅️ WICHTIG: owner, nicht user
const REGISTER_URL = `${API_BASE}/owner/register`; // falls Owner-Registrierung genutzt wird

export default function PartnerPage() {
  const router = useRouter();

  // -------------------- Login state --------------------
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");

  // -------------------- Register modal & form --------------------
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMsg, setRegisterMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const [registerForm, setRegisterForm] = useState({
    name: "", // Full name (owner)
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    website: "",
    restaurantName: "",
    addressStreet: "",
    addressCity: "",
    addressPostalCode: "",
    addressCountry: "",
    taxNumber: "",
  });

  // -------------------- UI helpers --------------------
  const inputClass =
    "pl-3 pr-3 py-2 w-4/5 max-[400px]:w-3/4 rounded-md border border-gray-200 bg-white text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";

  // -------------------- Handlers --------------------
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((p) => ({ ...p, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg("");
    setLoginLoading(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "emie.hettinger50@yahoo.com",
          password: "OwnerPW123!",
        }),
      });

      if (!res.ok) {
        let msg = `Login failed (${res.status})`;
        try {
          const j = await res.json();
          if (j?.message) msg = j.message;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();

      // Token + Ownerdaten speichern (rolle "restaurant")
      const token = data?.token;
      const owner = data?.owner || data?.user || {};

      const ownerName = owner?.ownerName || owner?.name || null;
      const restaurantId =
        owner?.restaurantId ||
        owner?.restaurant?._id ||
        owner?.restaurant ||
        null;
      const restaurantName =
        owner?.restaurantName || owner?.restaurant?.name || null;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("role", "restaurant");
        localStorage.setItem(
          "auth",
          JSON.stringify({
            token,
            user: {
              id: owner?._id || owner?.id || null,
              role: "restaurant",
              ownerName,
              restaurantName,
              restaurantId,
              email: owner?.email || loginForm.email.trim().toLowerCase(),
            },
          })
        );
      }

      setLoginMsg("Logged in successfully.");
      // Weiter zur Management-Seite
      router.push("/restaurantmanagement/menumanagement");
    } catch (err) {
      setLoginMsg(err.message || "Could not log in.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : "");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterMsg("Passwords do not match.");
      return;
    }

    const required = [
      "name",
      "email",
      "password",
      "phone",
      "restaurantName",
      "addressStreet",
      "addressCity",
      "addressPostalCode",
      "addressCountry",
      "taxNumber",
    ];
    for (const key of required) {
      if (!registerForm[key]) {
        setRegisterMsg("Please fill in all required fields.");
        return;
      }
    }

    setRegisterLoading(true);
    try {
      const payload = {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
        address: {
          street: registerForm.addressStreet,
          city: registerForm.addressCity,
          postalCode: registerForm.addressPostalCode,
          country: registerForm.addressCountry,
        },
        restaurantName: registerForm.restaurantName,
        taxNumber: registerForm.taxNumber,
        document: fileName || "document.pdf",
        website: registerForm.website || "",
      };

      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Register failed (${res.status}) ${txt}`);
      }

      setRegisterMsg("Registered successfully. You can now log in.");
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegisterMsg("");
      }, 1000);
    } catch (err) {
      setRegisterMsg(err.message || "Could not register.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8 px-4 relative">
      {/* Login */}
      <section className="w-full max-w-sm mb-4 z-10">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
          <h2 className="text-xl font-bold text-gray-900">Partner Login</h2>
          <p className="text-sm text-gray-600">
            Log in to manage your partnership
          </p>
        </div>

        {loginMsg && (
          <div className="mb-3 text-sm p-2 rounded bg-white border border-gray-200 text-gray-900">
            {loginMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-row items-center">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 w-1/5 max-[400px]:w-1/4 max-[400px]:text-[14px]"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              placeholder="example@example.com"
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-row items-center">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 w-1/5 max-[400px]:w-1/4 max-[400px]:text-[14px]"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              placeholder="••••••••"
              className={inputClass}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loginLoading ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="text-sm text-indigo-600 hover:underline"
          >
            Don’t have an account? Register as Partner
          </button>
        </div>
      </section>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/10">
          <div className="bg-white rounded-lg shadow-xl p-4 w-[48rem] max-w-[95vw] relative m-4">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-3xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>

            <div className="flex flex-col items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Become a Partner
              </h2>
              <p className="text-sm text-gray-600 text-center">
                Register and upload your business details
              </p>
            </div>

            {registerMsg && (
              <div className="mb-3 text-sm p-2 rounded bg-gray-50 border border-gray-200 text-gray-900">
                {registerMsg}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleRegister}>
              {/* Row: Name, Email */}
              <div className="flex gap-3 max-[700px]:flex-col">
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    placeholder="Name Surname"
                    className={inputClass + " w-full"}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="example@example.com"
                    className={inputClass + " w-full"}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Row: Password, Confirm */}
              <div className="flex gap-3 max-[700px]:flex-col">
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="••••••••"
                    className={inputClass + " w-full"}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Repeat password"
                    className={inputClass + " w-full"}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Row: Phone, Website */}
              <div className="flex gap-3 max-[700px]:flex-col">
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    placeholder="+49 111 222 333"
                    className={inputClass + " w-full"}
                    required
                    autoComplete="tel"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    name="website"
                    type="url"
                    value={registerForm.website}
                    onChange={handleRegisterChange}
                    placeholder="https://example.com"
                    className={inputClass + " w-full"}
                  />
                </div>
              </div>

              {/* Row: Restaurant Name, Tax Number */}
              <div className="flex gap-3 max-[700px]:flex-col">
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Restaurant Name
                  </label>
                  <input
                    name="restaurantName"
                    type="text"
                    value={registerForm.restaurantName}
                    onChange={handleRegisterChange}
                    placeholder="Example Restaurant"
                    className={inputClass + " w-full"}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Tax Number
                  </label>
                  <input
                    name="taxNumber"
                    type="text"
                    value={registerForm.taxNumber}
                    onChange={handleRegisterChange}
                    placeholder="123456789"
                    className={inputClass + " w-full"}
                    required
                  />
                </div>
              </div>

              {/* Row: Address (Street, City) */}
              <div className="flex gap-3 max-[700px]:flex-col">
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Street
                  </label>
                  <input
                    name="addressStreet"
                    type="text"
                    value={registerForm.addressStreet}
                    onChange={handleRegisterChange}
                    placeholder="Street and number"
                    className={inputClass + " w-full"}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    name="addressCity"
                    type="text"
                    value={registerForm.addressCity}
                    onChange={handleRegisterChange}
                    placeholder="Berlin"
                    className={inputClass + " w-full"}
                    required
                  />
                </div>
              </div>

              {/* Row: Postal Code, Country */}
              <div className="flex gap-3 max-[700px]:flex-col">
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    name="addressPostalCode"
                    type="text"
                    value={registerForm.addressPostalCode}
                    onChange={handleRegisterChange}
                    placeholder="10115"
                    className={inputClass + " w-full"}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    name="addressCountry"
                    type="text"
                    value={registerForm.addressCountry}
                    onChange={handleRegisterChange}
                    placeholder="Deutschland"
                    className={inputClass + " w-full"}
                    required
                  />
                </div>
              </div>

              {/* Row: Business Document */}
              <div className="flex items-start gap-3 w-full">
                <label className="w-48 text-sm font-medium text-gray-700">
                  Business Document <br /> (PDF, JPG, PNG) <br />
                  (tax certificate etc.)
                </label>
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {fileName && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {fileName}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-60"
              >
                {registerLoading ? "Registering…" : "Register as Partner"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
