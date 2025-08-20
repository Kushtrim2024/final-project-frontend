"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faFileDownload,
  faChevronDown,
  faChevronUp,
  faGlobe,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import React, { Fragment } from "react";

const initialRestaurants = [
  {
    id: 1,
    name: "Cihan Ünal",
    restaurantName: "CHN Vegetarian Burger",
    email: "cihan@chnburger.com",
    website: "https://chnburger.com",
    phone: "+49 123 456 789",
    category: "Vegan Burger",
    createdAt: "2024-06-10",
    deliveryType: "Package + Onsite",
    menuLink: "/uploads/chnburger-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Herne, Deutschland",
    taxDocument: "/uploads/chnburger-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
  {
    id: 2,
    name: "Randy Born",
    restaurantName: "RDY Pizza",
    email: "randy@rdypizza.com",
    website: "https://rdypizza.com",
    phone: "+49 987 654 321",
    category: "Pizza",
    createdAt: "2024-07-01",
    deliveryType: "Package Only",
    menuLink: "/uploads/rdypizza-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Castrop-Rauxel, Deutschland",
    taxDocument: "/uploads/rdypizza-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
  {
    id: 3,
    name: "Meli Kebriari",
    restaurantName: "Meli Kebab",
    email: "m@melikebab.com",
    website: "https://melikebab.com",
    phone: "+49 555 333 222",
    category: "Kebap",
    createdAt: "2024-05-20",
    deliveryType: "Package + Onsite",
    menuLink: "/uploads/melikebab-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Stuttgart, Deutschland",
    taxDocument: "/uploads/melikebab-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
  {
    id: 4,
    name: "Kushtrim Bilali",
    restaurantName: "Ksh Burger",
    email: "Ksh@kshburger.com",
    website: "https://kshburger.com",
    phone: "+49 222 111 000",
    category: "Burger",
    createdAt: "2024-06-05",
    deliveryType: "Package Only",
    menuLink: "/uploads/kshburger-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Leipzig, Deutschland",
    taxDocument: "/uploads/kshburger-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
  {
    id: 5,
    name: "Cihan Ünal",
    restaurantName: "CHN Vegetarian Burger",
    email: "cihan@chnburger.com",
    website: "https://chnburger.com",
    phone: "+49 123 456 789",
    category: "Vegan Burger",
    createdAt: "2024-06-10",
    deliveryType: "Package + Onsite",
    menuLink: "/uploads/chnburger-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Herne, Deutschland",
    taxDocument: "/uploads/chnburger-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
  {
    id: 6,
    name: "Randy Born",
    restaurantName: "RDY Pizza",
    email: "randy@rdypizza.com",
    website: "https://rdypizza.com",
    phone: "+49 987 654 321",
    category: "Pizza",
    createdAt: "2024-07-01",
    deliveryType: "Package Only",
    menuLink: "/uploads/rdypizza-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Castrop-Rauxel, Deutschland",
    taxDocument: "/uploads/rdypizza-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
  {
    id: 7,
    name: "Meli Kebriari",
    restaurantName: "Meli Kebab",
    email: "m@melikebab.com",
    website: "https://melikebab.com",
    phone: "+49 555 333 222",
    category: "Kebap",
    createdAt: "2024-05-20",
    deliveryType: "Package + Onsite",
    menuLink: "/uploads/melikebab-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Stuttgart, Deutschland",
    taxDocument: "/uploads/melikebab-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
  {
    id: 8,
    name: "Kushtrim Bilali",
    restaurantName: "Ksh Burger",
    email: "Ksh@kshburger.com",
    website: "https://kshburger.com",
    phone: "+49 222 111 000",
    category: "Burger",
    createdAt: "2024-06-05",
    deliveryType: "Package Only",
    menuLink: "/uploads/kshburger-menu.pdf",
    taxNumber: "1234567890",
    openHour: "10:00",
    closeHour: "22:00",
    address: "Leipzig, Deutschland",
    taxDocument: "/uploads/kshburger-steuer.pdf",
    status: "pending",
    logo: "/logo.png",
    rateus: 4.5,
  },
];

export default function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeStates, setActiveStates] = useState({});

  // PAGINATION STATES
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(5);
  const [approvedPageSize, setApprovedPageSize] = useState(5);

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  const approveRestaurant = (id) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
  };
  const rejectRestaurant = (id) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  };
  const toggleActive = (id) => {
    setActiveStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const handleEditClick = (restaurant) => {
    setEditingRestaurant(restaurant);
    setShowEditModal(true);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingRestaurant((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSave = () => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === editingRestaurant.id ? editingRestaurant : r))
    );
    setShowEditModal(false);
  };
  const handleDelete = (id) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  };

  const approvedRestaurants = restaurants.filter(
    (r) => r.status === "approved"
  );
  const pendingRestaurants = restaurants.filter((r) => r.status === "pending");

  // TOTAL PAGES
  const pendingTotalPages = Math.max(
    1,
    Math.ceil(pendingRestaurants.length / pendingPageSize)
  );
  const approvedTotalPages = Math.max(
    1,
    Math.ceil(approvedRestaurants.length / approvedPageSize)
  );

  // CLAMP PAGES WHEN DATA OR PAGESIZE CHANGES
  useEffect(() => {
    setPendingPage((p) => clamp(p, 1, pendingTotalPages));
  }, [pendingRestaurants.length, pendingPageSize]);
  useEffect(() => {
    setApprovedPage((p) => clamp(p, 1, approvedTotalPages));
  }, [approvedRestaurants.length, approvedPageSize]);

  // CLOSE EXPANDED ROW ON PAGE/PAGESIZE CHANGE
  useEffect(() => {
    setExpandedRow(null);
  }, [pendingPage, approvedPage, pendingPageSize, approvedPageSize]);

  // PAGINATED SLICES
  const paginate = (arr, page, perPage) =>
    arr.slice((page - 1) * perPage, page * perPage);
  const pendingPageItems = paginate(
    pendingRestaurants,
    pendingPage,
    pendingPageSize
  );
  const approvedPageItems = paginate(
    approvedRestaurants,
    approvedPage,
    approvedPageSize
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-orange-500 max-[1250px]:text-[12px]">
        Restaurants Awaiting Approval
      </h2>

      {/* Pending Restaurant Table */}
      <div className="relative rounded bg-white shadow max-[1320px]:text-[12px] ">
        <div className="max-h-96 overflow-auto">
          <table className="min-w-[1000px] w-full table-fixed border-collapse">
            <thead className="bg-gray-800 sticky top-0 text-gray-100">
              <tr>
                <th className="px-4 py-4 border border-black">Restaurant</th>
                <th className="px-4 py-4 border border-black">Owner</th>
                <th className="px-4 py-4 border border-black">Email</th>
                <th className="px-4 py-4 border border-black">Address</th>
                <th className="px-4 py-4 border border-black">Tax No</th>
                <th className="px-4 py-4 border border-black">Status</th>
                <th className="px-4 py-4 border border-black text-center ">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingPageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-600">
                    No pending restaurants.
                  </td>
                </tr>
              ) : (
                pendingPageItems.map((res) => (
                  <Fragment key={res.id}>
                    <tr
                      className="even:bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer"
                      onClick={() => toggleRow(res.id)}
                    >
                      <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[16rem]">
                        {res.restaurantName}
                      </td>
                      <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[12rem]">
                        {res.name}
                      </td>
                      <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[18rem]">
                        {res.email}
                      </td>
                      <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[18rem]">
                        {res.address}
                      </td>
                      <td className="border px-4 py-2 whitespace-nowrap">
                        {res.taxNumber}
                      </td>
                      <td className="border px-4 py-2 capitalize whitespace-nowrap">
                        {res.status}
                      </td>
                      <td className="border px-4 py-2 flex justify-center gap-2 max-[1150px]:flex-col max-[1150px]:flex">
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            approveRestaurant(res.id);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            rejectRestaurant(res.id);
                          }}
                        >
                          Reject
                        </button>
                        <FontAwesomeIcon
                          icon={
                            expandedRow === res.id ? faChevronUp : faChevronDown
                          }
                          className="ml-2 text-gray-600"
                        />
                      </td>
                    </tr>
                    {expandedRow === res.id && (
                      <tr className="bg-gray-50">
                        {/* Pending tabloda 7 kolon var */}
                        <td colSpan={7} className="p-4 border-t">
                          <div className="flex gap-4">
                            <div className="text-sm text-gray-700 space-y-1">
                              <p>
                                <FontAwesomeIcon
                                  icon={faGlobe}
                                  className="mr-2"
                                />
                                {res.website}
                              </p>
                              <p>
                                <FontAwesomeIcon
                                  icon={faPhone}
                                  className="mr-2"
                                />
                                {res.phone}
                              </p>
                              <p>
                                <FontAwesomeIcon
                                  icon={faFileDownload}
                                  className="mr-2"
                                />
                                <a
                                  href={res.taxDocument}
                                  target="_blank"
                                  className="text-blue-600 underline"
                                >
                                  Tax Document
                                </a>
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - Pending */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold">{pendingPage}</span>
            &nbsp;/&nbsp;
            {pendingTotalPages} &nbsp;•&nbsp;
            <span className="font-semibold">{pendingRestaurants.length}</span>
            &nbsp;items
          </div>

          <div className="flex items-center gap-2  text-gray-800">
            <label className="text-sm text-gray-600 max-[750px]:hidden">
              Rows:
            </label>
            <select
              className="border rounded px-2 py-1"
              value={pendingPageSize}
              onChange={(e) => {
                setPendingPageSize(Number(e.target.value));
                setPendingPage(1);
              }}
            >
              {[6, 12, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
              disabled={pendingPage === 1}
            >
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pendingTotalPages }, (_, i) => i + 1).map(
                (n) => (
                  <button
                    key={n}
                    aria-current={pendingPage === n ? "page" : undefined}
                    className={`px-3 py-1 border rounded ${
                      pendingPage === n
                        ? "bg-gray-800 text-white"
                        : "hover:bg-gray-100"
                    } ${n !== 1 ? "max-[1150px]:hidden" : ""}`}
                    onClick={() => setPendingPage(n)}
                  >
                    {n}
                  </button>
                )
              )}
              {pendingTotalPages > 1 && (
                <span className="hidden max-[1150px]:inline-block px-2 select-none">
                  …
                </span>
              )}
            </div>

            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() =>
                setPendingPage((p) => Math.min(pendingTotalPages, p + 1))
              }
              disabled={pendingPage === pendingTotalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Approved Restaurant Table */}
      <div>
        <h3 className="text-2xl font-bold text-orange-500 mb-4 max-[1250px]:text-[12px]">
          Active Partner Restaurants
        </h3>

        <div className="relative rounded bg-white shadow max-[1250px]:text-[12px] border">
          <div className="max-h-96 overflow-auto">
            <table className="min-w-[1000px] w-full table-fixed border-collapse">
              <thead className="bg-gray-800 sticky top-0 text-gray-100">
                <tr>
                  <th className="px-4 py-4 border border-black">Restaurant</th>
                  <th className="px-4 py-4 border border-black">Owner</th>
                  <th className="px-4 py-4 border border-black">Email</th>
                  <th className="px-4 py-4 border border-black">Address</th>
                  <th className="px-4 py-4 border border-black">Tax No</th>
                  <th className="px-4 py-4 border border-black">Status</th>
                  <th className="px-4 py-4 border border-black">Status</th>
                  <th className="px-4 py-4 border border-black text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {approvedPageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-600">
                      No approved restaurants.
                    </td>
                  </tr>
                ) : (
                  approvedPageItems.map((res) => (
                    <Fragment key={res.id}>
                      <tr
                        className="even:bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer"
                        onClick={() => toggleRow(res.id)}
                      >
                        <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[16rem]">
                          {res.restaurantName}
                        </td>
                        <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[12rem]">
                          {res.name}
                        </td>
                        <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[18rem]">
                          {res.email}
                        </td>
                        <td className="border px-4 py-2 whitespace-nowrap truncate max-w-[18rem]">
                          {res.address}
                        </td>
                        <td className="border px-4 py-2 whitespace-nowrap">
                          {res.taxNumber}
                        </td>
                        <td className="border px-4 py-2 capitalize whitespace-nowrap">
                          {res.status}
                        </td>
                        <td className="border px-4 py-2 whitespace-nowrap">
                          {activeStates[res.id] ? "Aktif" : "Pasif"}
                        </td>
                        <td className="border px-4 py-2 flex  flex-col justify-center gap-2  ">
                          <button
                            onClick={() => handleEditClick(res)}
                            className="text-blue-600 hover:underline"
                          >
                            <FontAwesomeIcon icon={faEdit} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(res.id)}
                            className="text-red-600 hover:underline"
                          >
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                          <button
                            onClick={() => toggleActive(res.id)}
                            className={`px-2 py-1 rounded ${
                              activeStates[res.id]
                                ? "bg-gray-300"
                                : "bg-green-300"
                            }`}
                          >
                            {activeStates[res.id] ? "Passive" : "Active"}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === res.id && (
                        <tr className="bg-gray-50">
                          {/* Approved tabloda 8 kolon var */}
                          <td colSpan={8} className="p-4 border-t">
                            <div className="flex gap-4">
                              <div className="text-sm text-gray-700 space-y-1">
                                <p>
                                  <FontAwesomeIcon
                                    icon={faGlobe}
                                    className="mr-2"
                                  />
                                  {res.website}
                                </p>
                                <p>
                                  <FontAwesomeIcon
                                    icon={faPhone}
                                    className="mr-2"
                                  />
                                  {res.phone}
                                </p>
                                <p>
                                  <FontAwesomeIcon
                                    icon={faFileDownload}
                                    className="mr-2"
                                  />
                                  <a
                                    href={res.taxDocument}
                                    target="_blank"
                                    className="text-blue-600 underline"
                                  >
                                    Tax Document
                                  </a>
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls - Approved */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white">
            <div className="text-sm text-gray-800">
              Page <span className="font-semibold">{approvedPage}</span>&nbsp;/
              &nbsp;{approvedTotalPages}&nbsp;•&nbsp;
              <span className="font-semibold">
                {approvedRestaurants.length}
              </span>
              &nbsp;&nbsp;items
            </div>

            <div className="flex items-center gap-2 text-gray-800">
              <label className="text-sm text-gray-800 max-[750px]:hidden ">
                Rows:
              </label>
              <select
                className="border rounded px-2 py-1"
                value={approvedPageSize}
                onChange={(e) => {
                  setApprovedPageSize(Number(e.target.value));
                  setApprovedPage(1);
                }}
              >
                {[6, 12, 24, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button
                className="px-2 py-1 border rounded disabled:opacity-50"
                onClick={() => setApprovedPage((p) => Math.max(1, p - 1))}
                disabled={approvedPage === 1}
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: approvedTotalPages },
                  (_, i) => i + 1
                ).map((n) => (
                  <button
                    key={n}
                    aria-current={approvedPage === n ? "page" : undefined}
                    className={`px-2 py-1 border rounded ${
                      approvedPage === n
                        ? "bg-gray-800 text-white"
                        : "hover:bg-gray-100"
                    } ${n !== 1 ? "max-[1150px]:hidden" : ""}`}
                    onClick={() => setApprovedPage(n)}
                  >
                    {n}
                  </button>
                ))}
                {pendingTotalPages > 1 && (
                  <span className="hidden max-[1150px]:inline-block px-2 select-none">
                    …
                  </span>
                )}
              </div>

              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() =>
                  setApprovedPage((p) => Math.min(approvedTotalPages, p + 1))
                }
                disabled={approvedPage === approvedTotalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit Page */}
      {showEditModal && (
        <div className="fixed inset-0 z-40 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl rounded-lg p-6 space-y-6 overflow-y-auto max-h-[90vh] relative">
            <h3 className="text-2xl font-semibold text-gray-800">
              Edit Restaurant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
              <input
                type="text"
                name="restaurantName"
                value={editingRestaurant.restaurantName}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Restaurant Name"
              />
              <input
                type="text"
                name="name"
                value={editingRestaurant.name}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Owner Name"
              />
              <input
                type="email"
                name="email"
                value={editingRestaurant.email}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Email"
              />
              <input
                type="text"
                name="address"
                value={editingRestaurant.address}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Address"
              />
              <input
                type="text"
                name="taxNumber"
                value={editingRestaurant.taxNumber}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Tax Number"
              />
              <input
                type="text"
                name="website"
                value={editingRestaurant.website}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Website"
              />
              <input
                type="text"
                name="phone"
                value={editingRestaurant.phone}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Phone"
              />
              <input
                type="text"
                name="taxDocument"
                value={editingRestaurant.taxDocument}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Tax Document Link"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleEditSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
