"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

function LoginPage() {
  const router = useRouter();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  // extra states nur für Register
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPasswordConfirm, setShowRegPasswordConfirm] = useState(false);
  const [reg, setReg] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    address: {
      street: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // ✅ Email Validation Function
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("http://localhost:5517/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.message || "Login failed");
        return;
      }

      // ✅ Extract token & user like in xxx.jsx
      const token = data?.token || data?.accessToken || null;
      const user = data?.user || data?.data || {};

      if (!token) {
        setLoginError("Login seems successful but no token was returned.");
        return;
      }

      // Normalize minimal fields
      const id = user?.id || user?._id || user?.userId || null;
      const role = user?.role || "user";
      const name =
        user?.name || user?.fullName || user?.username || email || null;
      const mail = user?.email || email || null;

      // ✅ Same storage shape as xxx.jsx
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem(
        "auth",
        JSON.stringify({ token, user: { id, role, name, email: mail } })
      );
      // Convenience: direct username access (header için kolay)
      localStorage.setItem("username", name);

      router.push("/");
    } catch (err) {
      setLoginError("Server error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    // 1. Email validation
    if (!validateEmail(reg.email)) {
      setRegisterError("Please enter a valid email address.");
      return;
    }

    // 2. Check passwords match
    if (reg.password !== reg.passwordConfirm) {
      setRegisterError("Passwords do not match.");
      return;
    }

    // 3. Strong password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(reg.password)) {
      setRegisterError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await fetch("http://localhost:5517/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg),
      });
      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.message || "Registration failed.");
        return;
      }

      // Successful registration: close modal, fill login form
      setRegisterSuccess("Registration successful! You can log in.");
      setEmail(reg.email);
      setPassword(reg.password);
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegisterSuccess(null);
      }, 800);
    } catch (err) {
      setRegisterError("Server error. Please try again.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const inputClass =
    "pl-2 w-4/5 max-[400px]:w-3/4 h-8 rounded-md bg-white text-sm text-gray-800 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200";
  const labelClass =
    "mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[500px]:w-2/5";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8 px-4 relative">
      {/* Login */}
      <section className="w-full max-w-sm mb-4 z-10">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Logo"
              className="w-20 h-20 mb-2"
              width={80}
              height={80}
            />
          </Link>
          <h2 className="text-xl font-bold text-gray-800">User Login</h2>
          <p className="text-sm text-gray-500">Welcome back! Please log in.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-row items-center">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 w-1/5  max-[400px]:w-1/4 max-[400px]:text-[14px]"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="example@example.com"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-row items-center relative">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 w-1/5 max-[400px]:w-1/4 max-[400px]:text-[14px]"
            >
              Password
            </label>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-sm text-gray-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {loginError && <p className="text-red-600 text-sm">{loginError}</p>}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loginLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="text-sm text-indigo-600 hover:underline"
          >
            Don't have an account? Register
          </button>
        </div>
      </section>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-10">
          <div className="bg-white rounded-lg shadow-xl p-6 w-lg relative m-4 max-w-xl">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-3xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Register</h2>
              <p className="text-sm text-gray-500">
                Please enter your information.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex flex-row items-center">
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  placeholder="User name"
                  className={inputClass}
                  value={reg.name}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
              </div>

              {/* ✅ Email Validation */}
              <div className="flex flex-row items-center">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  placeholder="example@example.com"
                  className={`${inputClass} ${
                    reg.email && !validateEmail(reg.email)
                      ? "border-red-500"
                      : ""
                  }`}
                  value={reg.email}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, email: e.target.value }))
                  }
                  required
                />
              </div>
              {reg.email && !validateEmail(reg.email) && (
                <p className="text-red-600 text-xs mt-1 ml-20">
                  ❌ Invalid email format
                </p>
              )}
              {/* Password */}
              <div className="flex flex-row items-center relative">
                <label className={labelClass}>Password</label>
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={inputClass}
                  value={reg.password}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, password: e.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2 top-2 text-sm text-gray-600"
                >
                  {showRegPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-row items-center relative">
                <label className={labelClass}>Confirm Password</label>
                <input
                  type={showRegPasswordConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={inputClass}
                  value={reg.passwordConfirm}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, passwordConfirm: e.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowRegPasswordConfirm(!showRegPasswordConfirm)
                  }
                  className="absolute right-2 top-2 text-sm text-gray-600"
                >
                  {showRegPasswordConfirm ? "Hide" : "Show"}
                </button>
              </div>

              {/* Phone & Address remain unchanged */}
              <div className="flex flex-row items-center">
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  placeholder="+49 111 222 333"
                  className={inputClass}
                  value={reg.phone}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, phone: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Address */}
              <div className="flex flex-row items-center">
                <label className={labelClass}>Street</label>
                <input
                  type="text"
                  placeholder="Musterstraße 3"
                  className={inputClass}
                  value={reg.address.street}
                  onChange={(e) =>
                    setReg((s) => ({
                      ...s,
                      address: { ...s.address, street: e.target.value },
                    }))
                  }
                  required
                />
              </div>

              <div className="flex flex-row items-center">
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  placeholder="Berlin"
                  className={inputClass}
                  value={reg.address.city}
                  onChange={(e) =>
                    setReg((s) => ({
                      ...s,
                      address: { ...s.address, city: e.target.value },
                    }))
                  }
                  required
                />
              </div>

              <div className="flex flex-row items-center">
                <label className={labelClass}>Postal Code</label>
                <input
                  type="text"
                  placeholder="10115"
                  className={inputClass}
                  value={reg.address.postalCode}
                  onChange={(e) =>
                    setReg((s) => ({
                      ...s,
                      address: { ...s.address, postalCode: e.target.value },
                    }))
                  }
                  required
                />
              </div>

              <div className="flex flex-row items-center">
                <label className={labelClass}>Country</label>
                <input
                  type="text"
                  placeholder="Deutschland"
                  className={inputClass}
                  value={reg.address.country}
                  onChange={(e) =>
                    setReg((s) => ({
                      ...s,
                      address: { ...s.address, country: e.target.value },
                    }))
                  }
                  required
                />
              </div>

              {registerError && (
                <p className="text-red-600 text-sm">{registerError}</p>
              )}
              {registerSuccess && (
                <p className="text-green-600 text-sm">{registerSuccess}</p>
              )}

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition disabled:opacity-60"
              >
                {registerLoading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
