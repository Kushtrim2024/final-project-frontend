"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NavAdmin from "./componentsadmin/NavAdmin.jsx";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin" || pathname === "/admin/";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.replace("/admin");
  };

  // No header on the login page
  if (isLoginPage) return <>{children}</>;

  return (
    <div>
      <div className="sticky top-0 z-[2000] bg-gray-200 w-full shadow-md">
        <div className="flex flex-row items-center justify-between w-full h-30 px-4">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20" />
          </Link>

          <div className="flex-1 flex justify-center">
            <NavAdmin />
          </div>

          <nav>
            <button
              onClick={handleLogout}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:shadow-md max-[1250px]:text-[14px]"
            >
              logout
            </button>
          </nav>
        </div>
      </div>

      <main className="flex-1 w-full p-8 bg-white">{children}</main>
    </div>
  );
}
