"use client";
import React from "react";
import Link from "next/link";

function NavUser() {
  return (
    <div>
      <nav className="nav">
        <Link href="/usermanagement/profile">Profile</Link>
        <span className="separator">|</span>

        <Link href="/usermanagement/paymentmethods">Payment Methods</Link>
        <span className="separator">|</span>

        <Link href="/usermanagement/adresse">Adresse</Link>
        <span className="separator">|</span>

        <Link href="/usermanagement/orderhistory">Order History</Link>
        <span className="separator">|</span>

        <Link href="/usermanagement/settings">Settings</Link>
      </nav>
    </div>
  );
}

export default NavUser;
