// app/usermanagment/layout.js

"use client";

import Link from "next/link";
import NavUser from "./componentsUser/NavUser";
import { useRouter } from "next/navigation";

export default function UserLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    //Delete Token
    localStorage.removeItem("token");
    // to Homepage
    router.push("/");
  };

  return (
    <div className="sticky top-0 flex flex-col bg-orange-200/25 w-full shadow-md">
      <div className="flex flex-row items-center justify-around w-full h-30 px-4 shadow-md">
        {/* Logo */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-20 h-20 md:w-20 md:h-20"
          />
        </Link>

        <NavUser />

        {/* Logout button right */}
        <nav>
          <button
            onClick={handleLogout}
            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:shadow-md hover:mb-2"
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
