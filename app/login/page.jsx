"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function LoginPage() {
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    router.push("/usermanagement");
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gray-100 py-8 px-4">
      {/* Login */}
      <section className="w-full max-w-md mb-8">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
          <h2 className="text-xl font-bold text-gray-800">Login</h2>
          <p className="text-sm text-gray-500">Welcome back! Please log in.</p>
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
          <h2 className="text-xl font-bold text-gray-800">Register</h2>
          <p className="text-sm text-gray-500">
            New here? Create an account below.
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
              htmlFor="register-bio"
              className="block text-sm font-medium text-gray-700"
            >
              About You (optional)
            </label>
            <textarea
              id="register-bio"
              placeholder="Tell us about yourself..."
              rows="3"
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
          >
            Register
          </button>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;
