"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function PartnerPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    router.push("/restaurantmanagement");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-100 py-8 px-4">
      {/* Login */}
      <section className="w-full max-w-md mb-8">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
          <h2 className="text-xl font-bold text-gray-800">Partner Login</h2>
          <p className="text-sm text-gray-500">
            Log in to manage your partnership
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
          >
            Login
          </button>
        </form>
      </section>

      {/* Register */}
      <section className="w-full max-w-md">
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Become a Partner</h2>
          <p className="text-sm text-gray-500">
            Register and upload your business document
          </p>
        </div>
        <form className="space-y-4">
          <div>
            <label
              htmlFor="register-name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              placeholder="Jane Doe"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="business-doc"
              className="block text-sm font-medium text-gray-700"
            >
              Business Document (PDF, JPG, PNG)
            </label>
            <input
              id="business-doc"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              required
            />
            {fileName && (
              <p className="text-sm text-gray-500 mt-1">Selected: {fileName}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
          >
            Register as Partner
          </button>
        </form>
      </section>
    </div>
  );
}

export default PartnerPage;
