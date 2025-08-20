"use client";

import React, { useEffect, useState } from "react";
import CSVExportButton from "../componentsadmin/CSVExportButton.jsx";

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([
    {
      id: "ORD001",
      customer: "Cihan Ünal",
      restaurant: "Burger King",
      date: "2025-08-12",
      status: "Getting Ready",
    },
    {
      id: "ORD002",
      customer: "Randy Born",
      restaurant: "SushiCo",
      date: "2025-08-12",
      status: "Delivered",
    },
    {
      id: "ORD003",
      customer: "Kushtrim Bilali",
      restaurant: "KFC",
      date: "2025-08-11",
      status: "Cancelled",
    },
  ]);

  // CSV export kolonları
  const csvHeaders = [
    { label: "Order ID", key: "id" },
    { label: "Customer", key: "customer" },
    { label: "Restaurant", key: "restaurant" },
    { label: "Date", key: "date" },
    { label: "Status", key: "status" },
  ];

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // "update" | "details"
  const [newStatus, setNewStatus] = useState("");

  // --- PAGING  ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // 6 / 12 / 24 / 48
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const totalItems = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Keep current page within safe range when orders/pageSize changes
  useEffect(() => {
    setPage((p) => clamp(p, 1, totalPages));
  }, [totalItems, pageSize]);

  // active page rows
  const start = (page - 1) * pageSize;
  const pageRows = orders.slice(start, start + pageSize);

  // --- Modal helpers ---
  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setModalType("update");
  };
  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setModalType("details");
  };
  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
    setNewStatus("");
  };
  const handleUpdate = () => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id ? { ...o, status: newStatus } : o
      )
    );
    closeModal();
  };

  // UI helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Getting Ready":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 max-[1200px]:text-[16px]">
        Order Management
      </h1>

      {/* TABLO */}
      <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm text-left text-gray-900">
          <thead className="bg-gray-100 text-base font-semibold max-[1200px]:text-[14px]">
            <tr>
              <th className="px-6 py-4 border-b">Order ID</th>
              <th className="px-6 py-4 border-b">Customer</th>
              <th className="px-6 py-4 border-b">Restaurant</th>
              <th className="px-6 py-4 border-b">Date</th>
              <th className="px-6 py-4 border-b">Status</th>
              <th className="px-6 py-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageRows.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-gray-600" colSpan={6}>
                  No orders.
                </td>
              </tr>
            ) : (
              pageRows.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition max-[1200px]:text-[14px]"
                >
                  <td className="px-6 py-4">{order.id}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4">{order.restaurant}</td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => openUpdateModal(order)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => openDetailsModal(order)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium px-3 py-1 rounded"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGING CONTROLS */}
      <PaginationControls
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalItems={totalItems}
      />

      {/* Modal */}
      {selectedOrder && modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            {modalType === "update" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  Update Order Status
                </h2>
                <p className="mb-2 text-gray-800">
                  <strong>Order ID:</strong> {selectedOrder.id}
                </p>
                <label className="block mb-4 text-gray-800">
                  <span className="text-gray-800">New Status:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option>Getting Ready</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </label>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeModal}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </>
            )}

            {modalType === "details" && (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-900">
                  Order Details
                </h2>
                <div className="text-gray-800 space-y-2">
                  <p>
                    <strong>Order ID:</strong> {selectedOrder.id}
                  </p>
                  <p>
                    <strong>Customer:</strong> {selectedOrder.customer}
                  </p>
                  <p>
                    <strong>Restaurant:</strong> {selectedOrder.restaurant}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedOrder.date}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedOrder.status}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {/* CSV Export Button  */}
            <div className="mt-6">
              <CSVExportButton data={orders} headers={csvHeaders} />
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Button (page bottom) */}
      <div className="mt-6 max-[1200px]:text-[12px]">
        <CSVExportButton data={orders} headers={csvHeaders} />
      </div>
    </div>
  );
}

/* ===== Pagination Controls  ===== */
function PaginationControls({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white mt-4 rounded-lg">
      <div className="text-sm text-gray-800">
        Page <span className="font-semibold">{page}</span>&nbsp;/&nbsp;
        {totalPages}&nbsp;•&nbsp;
        <span className="font-semibold">{totalItems}</span>&nbsp;items
      </div>

      <div className="flex items-center gap-2 text-gray-800">
        <label className="text-sm text-gray-800 max-[750px]:hidden">
          Rows:
        </label>
        <select
          className="border rounded px-2 py-1"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
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
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              aria-current={page === n ? "page" : undefined}
              className={`px-3 py-1 border rounded ${
                page === n ? "bg-gray-800 text-white" : "hover:bg-gray-100"
              } ${n !== 1 ? "max-[1150px]:hidden" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          {totalPages > 1 && (
            <span className="hidden max-[1150px]:inline-block px-2 select-none">
              …
            </span>
          )}
        </div>

        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
