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
