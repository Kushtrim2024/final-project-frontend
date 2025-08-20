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

  // 3D ring settings
  const RADIUS = 400; // px
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
  const STEP = 360 / images.length; // arrows will rotate this much on each click

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)] flex flex-col w-full h-55  max-[700px]:h-42">
      {/* Main Header ---------------------------------------------------------------------------------------------------- */}

      <div className="relative flex items-center justify-center w-full  ">
        {/* Logo --------------------------------------------------------------------------------*/}
        <section className="absolute top-10 left-12 h-34 w-34 flex items-center justify-left max-[1000px]:scale-85 max-[1000px]:left-[15px] max-[650px]:scale-70 max-[600px]:left-[-5px]  max-[600px]:top-[-15px]">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Liefrik Logo"
              width={100}
              height={100}
              className="h-22 w-24 transition-all duration-200 transform hover:translate-y-1 cursor-pointer "
            />
          </Link>
        </section>
        {/* Search Bar (Desktop only) --------------------------------------------------------------------------------*/}
        <section className="flex flex-1 justify-center max-w-3xl mt-2 max-[1050px]:scale-85 max-[1050px]:ml-12 max-[700px]:hidden">
          <div className="relative w-full max-w-md mr-8">
            <input
              type="text"
              placeholder="Search for restaurants..."
              className="w-full pl-10 pr-4 py-2 h-10 text-sm text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:outline-none"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
            />
          </div>
        </section>
        {/* User Actions --------------------------------------------------------------------------------*/}
        <section className="absolute top-8 right-2 space-x-2  lg:w-70  sm:w-40 flex items-center justify-end   mr-2">
          <Link
            href="/partnerwithus"
            className="text-gray-700 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faStore} className="h-4 w-4 mr-0.5" />
            <span className="hidden  min-[1050px]:block">Partner with us</span>
          </Link>

          <Link
            href="/login"
            className="text-gray-700 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faUser} className="h-5 w-5 mr-0.5" />
            <span className="hidden min-[1050px]:block">Account</span>
          </Link>

          <Link
            href="/cart"
            className="text-gray-700 hover:text-red-500 transition-all duration-200 transform hover:translate-y-1 flex items-center cursor-pointer"
          >
            <FontAwesomeIcon icon={faShoppingCart} className="h-5 w-5 pr-0.5" />
          </Link>
        </section>
      </div>

      {/* Category Carousel – arrows will control, no background --------------------------------------------------------------------------------*/}
      <div className="relative w-7/12 h-40 flex items-center mx-auto  max-[700px]:mt-10 ">
        <div>
          {/* Left Arrow (always on top) */}

          <button
            onClick={() => setRotationY((prev) => prev - STEP)}
            className="absolute left-2 z-50 text-gray-500 hover:text-red-700"
            aria-label="Previous"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-6 h-6" />
          </button>
        </div>

        {/* Stage */}
        <div
          className="relative w-11/12 max-w-5xl h-40 mx-auto overflow-hidden"
          style={{ perspective: "1000px" }}
        >
          {/* ring stage is below the arrows--------------------------------------------------------------------------------*/}
          <div
            className="absolute inset-0 z-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {images.map((src, index) => {
              const base = STEP * index;
              const worldAngle = base + rotation; //screen real degrees
              const rad = (worldAngle * Math.PI) / 180;
              const depth = Math.cos(rad); // -1..1 (önde ≈1)
              const scale = 0.85 + 0.25 * ((depth + 1) / 2); // 0.85..1.10
              const opacity = 0.55 + 0.45 * ((depth + 1) / 2); // 0.55..1
              const zIndex = 1000 + Math.round(depth * 1000);
              const isOpen = openIndex === index;

              return (
                <div
                  key={index}
                  onClick={() =>
                    setOpenIndex((prev) => (prev === index ? null : index))
                  }
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                               flex flex-col items-center text-gray-600 hover:text-red-500 cursor-pointer max-[1000px]:scale-70 max-[700px]:scale-55"
                  style={{
                    transformStyle: "preserve-3d",
                    // photo look at the camera: rotateY(-worldAngle)
                    transform: `
                        rotateY(${worldAngle}deg)
                        translateZ(${RADIUS}px)
                        rotateY(${-worldAngle}deg)
                        scale(${scale})
                      `,
                    transition: "transform 700ms ease, opacity 300ms ease",
                    opacity,
                    zIndex,
                  }}
                >
                  {/* Transparent PNG, no background/shadow */}
                  <img src={src} alt={labels[index]} className="h-19 w-19" />
                  <span className="text-[8px]">{labels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          {/* Right Arrow (always on top) --------------------------------------------------------------------------------*/}

          <button
            onClick={() => setRotationY((prev) => prev + STEP)}
            className="absolute right-2 z-50 text-gray-500 hover:text-red-700"
            aria-label="Next"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-10 h-10" />
          </button>
        </div>
      </div>
    </header>
  );
}
