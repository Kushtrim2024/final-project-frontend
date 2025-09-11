// pages/accessibility.jsx
import React from "react";

const Accessibility = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Accessibility</h1>
      <p className="text-gray-700 mb-4">
        Liefrik.de is committed to providing a website that is accessible to all
        users, including people with disabilities. We focus on:
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Clear navigation and structure</li>
        <li>Screen reader support</li>
        <li>High-contrast colors for better readability</li>
        <li>Alternative text for images</li>
      </ul>
      <p className="text-gray-700 mt-4">
        If you encounter any issues accessing content, please contact us at{" "}
        <strong>info@liefrik.de</strong>.
      </p>
    </div>
  );
};

export default Accessibility;
