// app/usermanagment/layout.js
import Link from "next/link";
import NavUser from "./componentsUser/NavUser";

export default function UserLayout({ children }) {
  return (
    <div className="sticky top-0 flex flex-col bg-gray-200 w-full shadow-md">
      <div className="flex flex-row items-center justify-around w-full h-30 px-4 shadow-md">
        {/* Logo */}
        <Link href="/">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-20 h-20 md:w-20 md:h-20"
          />
        </Link>

        <NavUser />

        {/* Logout button right */}
        <nav>
          <button className="bg-orange-500 text-white px-4 py-2 rounded-md hover:shadow-md hover:mb-2">
            logout
          </button>
        </nav>
      </div>
      <main className="p-6 h-screen bg-[url(/bgimage.jpg)] bg-full">
        {children}
      </main>
    </div>
  );
}
