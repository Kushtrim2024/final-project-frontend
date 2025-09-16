"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function NavAdmin() {
  const pathname = usePathname() || "";
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.classList.add("overflow-hidden");
      document.body.classList.add("overflow-hidden");
    } else {
      document.documentElement.classList.remove("overflow-hidden");
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  const isActive = (href) => {
    const normalize = (p) => {
      if (!p) return "";
      let s = p;
      if (s !== "/" && s.endsWith("/")) s = s.slice(0, -1);
      return s.toLowerCase();
    };
    const p = normalize(pathname);
    const h = normalize(href);
    return p === h || p.startsWith(h + "/");
  };

  const links = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/restaurantmanagement", label: "Restaurant Management" },
    { href: "/admin/usermanagement", label: "User Management" },
    { href: "/admin/ordermanagement", label: "Order Management" },

    { href: "/admin/supportfeedback", label: "Support & Feedback" },
  ];

  const desktopBase = "transition-colors duration-200 rounded-lg p-2";
  const mobileBase = "transition-colors duration-200 py-2 px-2 rounded-lg";
  const activeCls = "text-orange-500 bg-gray-100 shadow-md";
  const idleCls = "text-black hover:text-orange-500 hover:bg-gray-100";

  return (
    <div className="w-full">
      {/* Navbar */}
      <nav className="relative flex items-center justify-center px-4 py-2 max-[1250px]:text-[12px]">
        {/* Desktop */}
        <div className="hidden min-[1100px]:flex space-x-4">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`${desktopBase} ${active ? activeCls : idleCls}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="absolute min-[1150px]:hidden right-0 p-2 text-black"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* Overlay + Slide Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            role="button"
            aria-label="Close menu overlay"
          />
          {/* Aside */}
          <aside className="relative z-[10000] w-64 bg-white h-full shadow-lg p-4 animate-slideIn">
            {/* Close button */}
            <button
              className="absolute top-4 right-4"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X size={28} />
            </button>

            {/* Linkler */}
            <div className="mt-10 flex flex-col space-y-2 max-[1250px]:text-[13px]">
              {links.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`${mobileBase} ${active ? activeCls : idleCls}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* Tailwind animation */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
