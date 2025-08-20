"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function PartnerPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    router.push("/restaurantmanagement");
  };

  // input class
  const inputClass =
    " pl-2 w-4/5 max-[400px]:w-3/4  rounded-md border border-gray-200 bg-white text-gray-800 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-8 px-4 relative ">
      {/* Login ------------------------------------------------------------------------------------------------------------*/}
      <section className="w-full max-w-sm mb-4 z-10 ">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          </Link>
          <h2 className="text-xl font-bold text-gray-800">Partner Login</h2>
          <p className="text-sm text-gray-500">
            Log in to manage your partnership
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-row items-center">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 w-1/5 max-[400px]:w-1/4 max-[400px]:text-[14px]"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="example@example.com"
              className={inputClass}
              required
            />
          </div>
          <div className="flex flex-row items-center">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 w-1/5 max-[400px]:w-1/4 max-[400px]:text-[14px]"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="text-sm text-indigo-600 hover:underline"
          >
            Don't have an account? Register as Partner
          </button>
        </div>
      </section>

      {/* Register Modal --------------------------------------------------------------------------------------------------------*/}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-10 ">
          <div className="bg-white rounded-lg shadow-xl p-4 w-2xl relative m-4  max-[700px]:text-[14px] ">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-3xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col items-center mb-4 max-[700px]:m-0 ">
              <h2 className="text-xl font-bold text-gray-800">
                Become a Partner
              </h2>
              <p className="text-sm text-gray-500 text-center">
                Register and upload your business documents
              </p>
            </div>
            <form className="space-y-4 ">
              <div className="flex flex-row items-center max-[700px]:m-0">
                <label className=" mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5 ">
                  User Name
                </label>
                <input
                  type="text"
                  placeholder="User Name"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center max-[700px]:m-0">
                <label className=" mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5 ">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>

              <div className="flex flex-row items-center max-[700px]:m-0">
                <label className=" mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center max-[700px]:m-0 ">
                <label
                  htmlFor="register-name"
                  className="mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5"
                >
                  Full Name
                </label>
                <input
                  id="register-name"
                  type="text"
                  placeholder="name, surname"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center max-[700px]:m-0 ">
                <label
                  htmlFor="restaurant-name"
                  className="mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5 "
                >
                  Restaurant Name
                </label>
                <input
                  id="restaurant-name"
                  type="text"
                  placeholder="Example Restaurant"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center max-[700px]:m-0 ">
                <label className="mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5 ">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="example@example.com"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center max-[700px]:m-0">
                <label className="mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5  max-[700px]:w-2/5">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="+49 111 222 333"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center max-[700px]:m-0">
                <label className="mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5">
                  Website
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  className={inputClass}
                  required
                />
              </div>

              <div className="flex flex-row items-center max-[700px]:m-0">
                <label className="mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5  max-[700px]:w-2/5">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Nrw, Deutschland"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center max-[700px]:m-0">
                <label className="mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center w-1/5 max-[700px]:w-2/5 ">
                  Tax Number
                </label>
                <input
                  type="text"
                  placeholder="1234567890"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex flex-row items-center w-full m-0 ">
                <label className="text-align-left mt-2 text-sm font-medium text-gray-700 mb-2 flex items-center h-20 w-1/2 max-[700px]:text-[12px] ">
                  Business Document <br /> (PDF, JPG, PNG) <br />
                  (tax certificate etc.)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className=" pt-8 block w-1/2 h-25 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 "
                  required
                />
                {fileName && (
                  <p className="text-sm text-gray-500 mt-1 w-1/2">
                    Selected: {fileName}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
              >
                Register as Partner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerPage;
