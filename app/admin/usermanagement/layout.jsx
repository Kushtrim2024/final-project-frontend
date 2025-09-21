"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/usermanagement/admin", label: "Admins" },
  { href: "/admin/usermanagement/kunden", label: "Kunden" },
  { href: "/admin/usermanagement/restaurant", label: "Restaurants" },
];

export default function UMLayout({ children }) {
  const pathname = usePathname();
  const active = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="w-full ">
      <div className="mb-4 flex justify-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition 
              ${
                active(t.href)
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            aria-current={active(t.href) ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
