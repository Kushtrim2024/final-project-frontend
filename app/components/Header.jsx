"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faShoppingCart,
  faUser,
  faStore,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function Header() {
  const [rotation, setRotationY] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);

  const images = [
    "/dessert.png",
    "/chicken.png",
    "/sushi.png",
    "/burger.png",
    "/doner.png",
    "/kebab.png",
    "/pizza.png",
    "/salad.png",
  ];

  const labels = [
    "Dessert",
    "Chicken",
    "Sushi",
    "Burger",
    "Doner",
    "Kebab",
    "Pizza",
    "Salad",
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/30 backdrop-blur-md drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)] flex flex-col w-full h-65 ">
      {/* Main Header */}
      <div className="w-full h-34 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-36 ">
          {/* Logo */}
          <section className=" h-34 w-34 flex items-center justify-left ">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Liefrik Logo"
                width={120}
                height={40}
                className="h-20 w-20 transition-all duration-200 transform hover:translate-y-1 cursor-pointer "
              />
            </Link>
          </section>

          {/* Search Bar (Desktop only) */}
          <section className="flex flex-1 justify-center  max-w-3xl ">
            <div className="relative w-full max-w-md mr-8">
              <input
                type="text"
                placeholder="Search for restaurants..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              />
            </div>
          </section>

          {/* User Actions */}
          <section className="space-x-2 lg:h-34 lg:w-70 sm:h-34 sm:w-40  flex items-center justify-center ">
            <Link
              href="/partnerwithus"
              className="text-gray-700 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
            >
              <FontAwesomeIcon icon={faStore} className="h-4 w-4 mr-0.5" />
              <span className="hidden lg:block">Partner with us</span>
            </Link>

            <Link
              href="/login"
              className="text-gray-700 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
            >
              <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-0.5" />
              <span className="hidden lg:block">Account</span>
            </Link>

            <Link
              href="/cart"
              className="text-gray-700 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faShoppingCart}
                className="h-5 w-5 pr-0.5"
              />
            </Link>
          </section>
        </div>

        {/* Category Carousel */}
        <div className="relative w-7/12 h-23 flex items-center mx-auto ">
          {/* Left Arrow */}
          <div className="flex items-center w-8 h-24 ">
            <button
              onClick={() => setRotationY((prev) => prev - 45)}
              className="absolute left-2 z-10 text-gray-500 hover:text-red-700"
            >
              <FontAwesomeIcon
                icon={faChevronLeft}
                className="w-6 h-6 hover:cursor-pointer"
              />
            </button>
          </div>

          {/* Carousel */}
          <div
            className="relative w-11/12 max-w-5xl h-24 flex items-center mx-auto "
            style={{
              perspective: "1000px",
              clipPath: "inset(0px 0px -500px 0px)", // über , rechts, unten, links
            }}
          >
            <div
              className="w-full h-full absolute "
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${rotation}deg) rotateX(0deg) rotateZ(0deg)`,
                transition: "transform 0.7s ease",
              }}
            >
              {images.map((src, index) => {
                const angle = (360 / images.length) * index;
                const isOpen = openIndex === index;

                return (
                  <div
                    key={index}
                    onClick={() =>
                      setOpenIndex((prev) => (prev === index ? null : index))
                    }
                    className="absolute top-2/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-s text-gray-600 transition-all duration-200 transform hover:translate-y-0.5 hover:text-red-500 hover:cursor-pointer"
                    style={{
                      transform: `rotateY(${angle}deg) translateZ(400px)`,
                    }}
                  >
                    <img src={src} alt={labels[index]} className="h-7 w-7 " />
                    <span className="text-[10px]">{labels[index]}</span>

                    {/* Açılır kutu */}
                    {isOpen && (
                      <div className="absolute top-12 w-40 bg-white border border-gray-200 rounded-lg shadow-md p-2 z-[999] ">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          {labels[index]} Restaurants
                        </p>
                        <ul className="text-[11px] text-gray-600 space-y-1">
                          <li>Restaurant A</li>
                          <li>Restaurant B</li>
                          <li>Restaurant C</li>
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow */}
          <div className="flex items-center w-8 h-24 ">
            <button
              onClick={() => setRotationY((prev) => prev + 45)}
              className="absolute right-2 z-10 text-gray-500 hover:text-red-700"
            >
              <FontAwesomeIcon
                icon={faChevronRight}
                className="w-6 h-6 hover:cursor-pointer"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
