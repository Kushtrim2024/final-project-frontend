"use client";
import React from "react";

export default function Home() {
  return (
    <div className="h-396 mt-1 bg-cyan-700  bg-[url('/container-background.png')] bg-fixed bg-cover ">
      <div className="w-8/12 h-296  mx-auto bg-blue-300 opacity-70 text-gray-800 flex flex-col items-center pt-16 rounded-2xl">
        <h1>Welcome to Liefrik</h1>
        <p>Your favorite food ordering platform.</p>
        <p>Explore our menu and order your favorite dishes!</p>
        <button>Order Now</button>
        <p>Enjoy fast delivery and great service.</p>
        <p>Join us today and experience the best food ordering service.</p>
        <p>Follow us on social media for updates and special offers.</p>
      </div>
    </div>
  );
}
