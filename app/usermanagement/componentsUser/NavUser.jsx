"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

function NavUser() {
  const pathname = usePathname();
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

  const links = [
    { href: "/usermanagement/profile", label: "Profile" },
    { href: "/usermanagement/paymentmethods", label: "Payment Methods" },
    { href: "/usermanagement/address", label: "Address" },
    { href: "/usermanagement/orderhistory", label: "Order History" },
    { href: "/usermanagement/settings", label: "Settings" },
  ];

  return (
    <div className=" relative  h-20 w-[80%]">
      {/* Navbar */}
      <nav className="relative flex items-center justify-center px-4 py-2">
        {/* Desktop Menu */}
        <div className="hidden min-[1100px]:flex space-x-4 text-[clamp(12px,1.2vw,16px)]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors duration-200 pb-1 ${
                pathname === link.href
                  ? "text-orange-500 bg-gray-150 rounded-lg p-2 shadow-md"
                  : "text-black hover:text-red-500 hover:scale-105 rounded-lg p-2"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="absolute min-[1100px]:hidden top-4 right-0 p-2 text-black"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* Overlay + Slide Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Hintergrund */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative z-[10000] w-64 bg-white h-full shadow-lg p-4 animate-slideIn">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4"
              onClick={() => setIsOpen(false)}
            >
              <X size={28} />
            </button>

            {/* Links */}
            <div className="mt-10 flex flex-col space-y-2 text-[clamp(14px,4vw,18px)]">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`transition-colors duration-200 py-2 px-2 rounded-lg ${
                    pathname === link.href
                      ? "text-orange-500 bg-gray-100 shadow-md"
                      : "text-black hover:text-orange-500 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tailwind Animation */}
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

export default NavUser;
