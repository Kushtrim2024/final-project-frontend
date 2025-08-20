import React from "react";

function Nav() {
  return (
    <div>
      <nav className="space-x-4 flex flex-row items-center justify-center h-10 w-full bg-white text-gray-800 p-4 shadow-md">
        <a
          href="/restaurantmanagement/menumanagement"
          className="block hover:text-red-500 hover:mt-1"
        >
          Menu Management
        </a>
        |&nbsp;&nbsp;&nbsp;
        <a
          href="/restaurantmanagement/ordermanagement"
          className="block hover:text-red-500 hover:mt-1"
        >
          Order Management
        </a>
        |&nbsp;&nbsp;&nbsp;
        <a
          href="/restaurantmanagement/openinghours"
          className="block hover:text-red-500 hover:mt-1"
        >
          Opening Hours
        </a>
        |&nbsp;&nbsp;&nbsp;
        <a
          href="/restaurantmanagement/pricingpromotions"
          className="block hover:text-red-500 hover:mt-1"
        >
          Pricing Promotions
        </a>
        |&nbsp;&nbsp;&nbsp;
        <a
          href="/restaurantmanagement/restaurantprofile"
          className="block hover:text-red-500 hover:mt-1"
        >
          Restaurant Profile
        </a>
        |&nbsp;&nbsp;&nbsp;
        <a
          href="/restaurantmanagement/restaurantfeedback"
          className="block hover:text-red-500 hover:mt-1"
        >
          Restaurant Feedback
        </a>
        |&nbsp;&nbsp;&nbsp;
        <a
          href="/restaurantmanagement/cihanspage"
          className="block hover:text-red-500 hover:mt-1"
        >
          cihans page
        </a>
      </nav>
    </div>
  );
}

export default Nav;
