import React from "react";
import Nav from "./components/Navrestaurant.jsx";
import Link from "next/link";

function RestaurantLayout({ children }) {
  return (
    <div>
      <div className="sticky top-0 flex flex-col items-center bg-white w-full h-35 ">
        <div className="flex flex-row items-center justify-between bg-white w-full h-25 px-4">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 " />
          </Link>
          <nav className="flex items-center space-x-4">
            <button className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600">
              kurier
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50">
              restaurant panel
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
              logout
            </button>
            <button className="text-gray-600 focus:outline-none">
              <svg
                className="w-6 h-6"
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
        <div className="w-full h-10">
          <Nav />
        </div>
      </div>

      <main className="flex-1 min-h-100 w-full p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
}

export default RestaurantLayout;
