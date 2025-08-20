<<<<<<< HEAD
import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 space-y-4">
        <h1 className="text-xl font-bold mb-6">Admin Management</h1>
        <nav className="space-y-2">
          <a href="/admin" className="block hover:text-gray-300">
            Dashboard
          </a>
          <a href="/admin/restaurants" className="block hover:text-gray-300">
            Restaurants
          </a>
          <a href="/admin/roles" className="block hover:text-gray-300">
            Roles
          </a>
          <a href="/admin/permissions" className="block hover:text-gray-300">
            Permissions
          </a>
        </nav>
        <div>
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 bg-gray-100">{children}</main>
    </div>
  );
}
=======
// AdminLayout.jsx
import React from "react";
import NavAdmin from "./componentsadmin/NavAdmin.jsx";
import Link from "next/link";

function AdminLayout({ children }) {
  return (
    <div>
      {/* Admin Layout ------------------------------------------------------------------*/}
      <div className="sticky top-0 z-[2000] bg-gray-200 w-full shadow-md">
        <div className="flex flex-row items-center justify-around w-full h-30 px-4">
          {/* Logo ----------------------------------------------------------------------*/}
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-16" />
          </Link>

          {/* NavAdmin------------------------------------------------------------------ */}
          <div className="flex-1 flex justify-center">
            <NavAdmin />
          </div>

          {/* Logout------button--------------------------------------------------------------- */}
          <nav>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-md hover:shadow-md hover:mb-2 max-[1250px]:text-[14px]">
              logout
            </button>
          </nav>
        </div>
      </div>

      {/* main contaiener - admin all page childeren --------------------------------------*/}
      <main className="flex-1 w-full p-8 bg-white">{children}</main>
    </div>
  );
}
export default AdminLayout;
>>>>>>> chnbranch
