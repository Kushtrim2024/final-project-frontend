// app/usermanagment/layout.js

"use client";

import Link from "next/link";
import NavUser from "./componentsUser/NavUser";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE } from "../lib/api.js";
export default function UserLayout({ children }) {
  const router = useRouter();

  async function handleLogout() {
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

    if (typeof window !== "undefined") window.location.href = "/login";
  }

  return (
    <div className="sticky top-0 flex flex-col bg-orange-200/25 w-full shadow-md">
      <div className="flex flex-row items-center justify-around w-full h-30 px-4 shadow-md ">
        {/* Logo */}
        <Link href="/" className=" w-24 ">
          <Image
            src="/logo.png"
            alt="Logo"
            className="w-20 h-20 max-[500px]:w-16 max-[500px]:h-16"
            width={180}
            height={180}
          />
        </Link>

        <NavUser />

        {/* Logout button right */}
        <nav className="w-24  flex justify-end">
          <button
            onClick={handleLogout}
            className=" bg-orange-500 text-white px-4 py-2 rounded-md hover:shadow-md hover:mb-2"
          >
            Logout
          </button>
        </nav>
      </div>
      <main className="p-6 min-h-screen bg-[url(/bgfoto3.jpg)] bg-cover">
        {children}
      </main>
    </div>
  );
}
