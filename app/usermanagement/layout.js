<<<<<<< HEAD
import Link from "next/link";

export default function UserManagementLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 space-y-4">
        <h1 className="text-xl font-bold mb-6">User Management</h1>
        <nav className="space-y-2">
          <a href="/usermanagement" className="block hover:text-gray-300">
            Dashboard
          </a>
          <a href="/usermanagement/users" className="block hover:text-gray-300">
            Users
          </a>
          <a href="/usermanagement/roles" className="block hover:text-gray-300">
            Roles
          </a>
          <a
            href="/usermanagement/permissions"
            className="block hover:text-gray-300"
          >
            Permissions
          </a>
        </nav>
        <div>
          {" "}
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
        </div>
      </aside>

      {/* Sayfa İçeriği */}
      <main className="flex-1 p-8 bg-gray-100">{children}</main>
    </div>
  );
}
=======
import React from "react";
import NavUser from "./componentsUser/NavUser.jsx";
import Link from "next/link";
import "./stylesUser/layoutuser.css";

function UserLayout({ children }) {
  return (
    <div className="user-layout">
      <header className="user-header">
        <div className="header-top">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="logo" />
          </Link>

          <nav className="header-nav">
            <button className="btn-orange">User panel</button>
            <button className="btn-red">logout</button>
            <button className="menu-icon-btn">
              <svg
                className="menu-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            </button>
          </nav>
        </div>

        <div className="header-bottom">
          <NavUser />
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}

export default UserLayout;
>>>>>>> chnbranch
