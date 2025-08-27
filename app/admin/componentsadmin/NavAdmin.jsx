"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect } from "react";

function NavAdmin() {
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
    { href: "/admin/dashboard", label: "Dashboard" },
    {
      href: "/admin/restaurantmanagement",
      label: "Restaurant Management",
    },
    { href: "/admin/usermanagement", label: "User Management" },
    { href: "/admin/ordermanagement", label: "Order Management" },
    {
      href: "/admin/paymentscommissionreports",
      label: "Payments Management",
    },
    { href: "/admin/supportfeedback", label: "Support & Feedback" },
  ];

  return (
    <div className="w-full">
      {/* Navbar------------------------------------------------------------------------------------ */}
      <nav className="relative flex items-center justify-center px-4 py-2 max-[1250px]:text-[12px]">
        {/* Desktop Menu -----------------------------------------------------------------------------*/}
        <div className="hidden min-[1100px]:flex space-x-4 ">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors duration-200 pb-1 ${
                pathname === link.href
                  ? "text-orange-500 bg-gray-150 rounded-lg p-2 shadow-md"
                  : "text-black hover:text-orange-500 hover:bg-gray-100 rounded-lg p-2"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* --------------Mobile Hamburger------------------------------------------------------------------------- */}
        <button
          className="absolute  min-[1150px]:hidden right-0 p-2 text-black"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* -----------------Overlay + Slide Menu---------------------------------------------------------------------------- */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Background ---------------------------------------------------------------------------------*/}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          {/* Aside Nav ---------------------------------------------------------------------------------*/}
          <div className="relative z-[10000] w-64 bg-white h-full shadow-lg p-4 animate-slideIn ">
            {/* Close Button----------------------------------------------------------------------------- */}
            <button
              className="absolute top-4 right-4"
              onClick={() => setIsOpen(false)}
            >
              <X size={28} />
            </button>

            {/* Links-------------------------------------------------------------------------------------- */}
            <div className="mt-10 flex flex-col space-y-2 max-[1250px]:text-[13px]">
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

      {/* Tailwind animasyon ------------------------------------------------------------------*/}
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

export default NavAdmin;
