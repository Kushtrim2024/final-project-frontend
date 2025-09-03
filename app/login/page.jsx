"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

function LoginPage() {
  const router = useRouter();

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      console.log("User info:", session.user);
      // 👈 session.user.email و session.user.name
      router.push("/usermanagement");
    }
  }, [session]);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [reg, setReg] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    address: { street: "", city: "", postalCode: "", country: "" },
  });
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Handle normal login
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
      localStorage.setItem("token", data.token);
      router.push("/usermanagement");
    } catch {
      setLoginError("Server error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    if (reg.password !== reg.passwordConfirm) {
      setRegisterError("Passwords do not match.");
      return;
    }

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
      setRegisterSuccess("Registration successful! You can log in.");
      setEmail(reg.email);
      setPassword(reg.password);
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegisterSuccess(null);
      }, 800);
    } catch {
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
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
          <h2 className="text-xl font-bold text-gray-800">User Login</h2>
          <p className="text-sm text-gray-500">Welcome back! Please log in.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-row items-center">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              placeholder="example@example.com"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-row items-center relative">
            <label className={labelClass}>Password</label>
            <input
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
            className="w-full py-2 px-4 bg-green-700 text-white font-semibold rounded-md hover:bg-green-800 hover:text-amber-200 transition disabled:opacity-60"
          >
            {loginLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={() =>
            signIn("google", {
              callbackUrl: "/usermanagement",
            })
          }
          className="w-full mt-2 py-2 px-4 bg-orange-400 text-white font-semibold rounded-md hover:bg-orange-500 transition hover:text-amber-200"
        >
          Sign in with Google
        </button>

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
            >
              &times;
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-2">Register</h2>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex flex-row items-center">
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  className={inputClass}
                  value={reg.name}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="flex flex-row items-center">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={reg.email}
                  onChange={(e) =>
                    setReg((s) => ({ ...s, email: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Password, Confirm, Phone, Address ... */}

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
