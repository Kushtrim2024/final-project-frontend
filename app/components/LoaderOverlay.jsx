// components/LoaderOverlay.jsx
"use client";
import React from "react";

/**
 * Full-screen loading overlay with a floating emoji/logo and dot animation.
 * Drop-in component; hide/show from parent via state.
 */
export default function LoaderOverlay({ text = "Loading…" }) {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white/75 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        {/* Animated emoji (replace with <img src="/logo.svg" ... /> if you want) */}
        <div className="text-6xl select-none animate-float">
          <img src="/logo.png" alt="Logo" className="h-16 w-16 animate-float" />
        </div>

        <div className="text-gray-900 font-semibold">
          {text}
          <span className="inline-flex w-10 justify-start align-middle ml-1">
            <span className="loading-dot delay-0">.</span>
            <span className="loading-dot delay-150">.</span>
            <span className="loading-dot delay-300">.</span>
          </span>
        </div>
      </div>

      {/* Local styles (scoped by styled-jsx) */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
          100% {
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float 1.8s ease-in-out infinite;
        }
        @keyframes dot {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .loading-dot {
          display: inline-block;
          animation: dot 1.2s infinite;
        }
        .delay-0 {
          animation-delay: 0ms;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
