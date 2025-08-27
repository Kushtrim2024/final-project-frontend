"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/usermanagement/admin", label: "Admins" },
  { href: "/admin/usermanagement/kunden", label: "Kunden" },
  { href: "/admin/usermanagement/restaurant", label: "Restaurants" },
];

export default function NavAdmin() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="w-full">
      {/* Desktop */}
      <ul className="hidden md:flex items-center gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition
                ${
                  isActive(l.href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              aria-current={isActive(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile */}
      <div className="md:hidden relative">
        <button
          onClick={() => setOpen((s) => !s)}
          className="px-3 py-2 border rounded-md text-sm"
          aria-expanded={open}
        >
          Menu
        </button>
        {open && (
          <ul className="absolute mt-2 z-[2100] bg-white border rounded shadow-md w-48">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 text-sm ${
                    isActive(l.href)
                      ? "bg-gray-900 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
