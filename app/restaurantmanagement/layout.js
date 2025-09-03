"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react"; // für Icons

export default function Navbar({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const linkClasses = (href) =>
    pathname === href
      ? "text-orange-500 bg-gray-100 rounded-lg p-2 shadow-md flex justify-center"
      : "text-black hover:text-orange-500 hover:bg-gray-100 transition-colors rounded-lg p-2";

  const toggleMenu = () => setMenuOpen(!menuOpen);

  async function handleLoginLogout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      }).catch(() => {});
    } catch {}
    try {
      [
        "auth",
        "token",
        "accessToken",
        "jwt",
        "role",
        "username",
        "user",
        "restaurantOwner",
        "owner",
        "customer",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}

    if (typeof window !== "undefined") window.location.href = "/partnerwithus";
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-200 text-black p-4 shadow-md flex flex-col sm:flex-row items-center sm:justify-between relative">
        {/* Logo */}
        <div className="flex items-center justify-center w-full sm:w-auto">
          <Link href="/">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-20 h-20 object-contain"
            />
          </Link>
        </div>

        {/* Hamburger Mobile */}
        <div className="sm:hidden flex justify-end w-full mt-2">
          <button onClick={toggleMenu} className="p-2 text-black">
            <Menu size={28} />
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex flex-1 justify-center space-x-4 text-[16px]">
          <Link
            href="/restaurantmanagement/ownerprofile"
            className={linkClasses("/restaurantmanagement/ownerprofile")}
          >
            My Profile
          </Link>
          <Link
            href="/restaurantmanagement/menumanagement"
            className={linkClasses("/restaurantmanagement/menumanagement")}
          >
            Menu Management
          </Link>
          <Link
            href="/restaurantmanagement/ordermanagement"
            className={linkClasses("/restaurantmanagement/ordermanagement")}
          >
            Order Management
          </Link>
          <Link
            href="/restaurantmanagement/openinghours"
            className={linkClasses("/restaurantmanagement/openinghours")}
          >
            Opening Hours Settings
          </Link>
          <Link
            href="/restaurantmanagement/pricingpromo"
            className={linkClasses("/restaurantmanagement/pricingpromo")}
          >
            Pricing & Promotions
          </Link>
          <Link
            href="/restaurantmanagement/restaurantpro"
            className={linkClasses("/restaurantmanagement/restaurantpro")}
          >
            Restaurant Profile & Visuals
          </Link>
          <Link
            href="/restaurantmanagement/customerfeedback"
            className={linkClasses("/restaurantmanagement/customerfeedback")}
          >
            Customer Feedback
          </Link>
        </nav>

        {/* Desktop Login/Logout rechts */}
        <div className="hidden sm:block ml-4">
          <button
            onClick={handleLoginLogout}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Overlay + Slide Menü */}
      {menuOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Background */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          {/* Aside Nav */}
          <div className="relative z-[10000] w-64 bg-white h-full shadow-lg p-4 animate-slideIn">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4"
              onClick={() => setMenuOpen(false)}
            >
              <X size={28} />
            </button>

            {/* Links */}
            <div className="mt-10 flex flex-col space-y-2">
              <Link
                href="/restaurantmanagement/menumanagement"
                className={linkClasses("/restaurantmanagement/menumanagement")}
                onClick={() => setMenuOpen(false)}
              >
                Menu Management
              </Link>
              <Link
                href="/restaurantmanagement/pricingpromo"
                className={linkClasses("/restaurantmanagement/pricingpromo")}
                onClick={() => setMenuOpen(false)}
              >
                Pricing & Promotions
              </Link>
              <Link
                href="/restaurantmanagement/openinghours"
                className={linkClasses("/restaurantmanagement/openinghours")}
                onClick={() => setMenuOpen(false)}
              >
                Opening Hours Settings
              </Link>
              <Link
                href="/restaurantmanagement/customerfeedback"
                className={linkClasses(
                  "/restaurantmanagement/customerfeedback"
                )}
                onClick={() => setMenuOpen(false)}
              >
                Customer Feedback
              </Link>
              <Link
                href="/restaurantmanagement/restaurantpro"
                className={linkClasses("/restaurantmanagement/restaurantpro")}
                onClick={() => setMenuOpen(false)}
              >
                Restaurant Profile & Visuals
              </Link>
              <Link
                href="/restaurantmanagement/ordermanagement"
                className={linkClasses("/restaurantmanagement/ordermanagement")}
                onClick={() => setMenuOpen(false)}
              >
                Order Management
              </Link>

              {/* Login Button */}
              <button
                onClick={handleLoginLogout}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors mt-4"
              >
                {isLoggedIn ? "Logout" : "Login"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
