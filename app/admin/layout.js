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
