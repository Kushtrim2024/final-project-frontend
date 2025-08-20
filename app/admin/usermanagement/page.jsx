"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";

const initialUsers = [
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
    role: "admin",
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
    role: "manager",
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
    role: "courier",
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
    role: "admin",
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
    role: "manager",
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
    role: "admin",
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
    role: "admin",
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
    role: "courier",
  },
  {
    id: 9,
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
    role: "courier",
  },
  {
    id: 10,
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
    role: "manager",
  },
  {
    id: 11,
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
    role: "admin",
  },
  {
    id: 12,
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
    role: "manager",
  },
  {
    id: 13,
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
    role: "courier",
  },
  {
    id: 14,
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
    role: "admin",
  },
  {
    id: 15,
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
    role: "manager",
  },
  {
    id: 16,
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
    role: "courier",
  },
];

export default function AdminUserManagement() {
  // Since the active field in initialUsers is missing, we set the default to false.
  const [users, setUsers] = useState(
    initialUsers.map((u) => ({ ...u, active: u.active ?? false }))
  );

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [roleFilter, setRoleFilter] = useState("all"); // all | admin | manager | courier

  // Edit modal
  const [editingUser, setEditingUser] = useState(null);

  // Restaurant Management style PAGINATION
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // options 6/12/24/48
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // Filter + Search
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const isActive = !!user.active;
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? isActive
        : !isActive;

    const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Total pages & active page slice
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageItems = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  // Restrict current page when data/rows change
  useEffect(() => {
    setPage((p) => clamp(p, 1, totalPages));
  }, [filteredUsers.length, pageSize]);

  const resetToFirstPage = () => setPage(1);

  // Actions
  const toggleActive = (id) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, active: !user.active } : user
      )
    );
  };

  const handleDelete = (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      setUsers((prev) => prev.filter((user) => user.id !== id));
    }
  };

  const handleSave = () => {
    setUsers((prev) =>
      prev.map((user) => (user.id === editingUser.id ? editingUser : user))
    );
    setEditingUser(null);
  };

  return (
    <div className="p-6 text-gray-800 max-[1250px]:text-[12px]">
      <h2 className="text-2xl font-bold mb-4 max-[1250px]:text-[16px]">
        Admin - User Management
      </h2>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="border px-3 py-2 rounded w-full md:w-1/3"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            resetToFirstPage();
          }}
        />

        <div className="flex gap-2 max-[1000px]:hidden">
          {/* Status */}
          <div>
            <span className="mr-2 font-semibold">Status:</span>
            <button
              className={`px-2 py-1 rounded mr-1 border ${
                statusFilter === "all" ? "bg-blue-500 text-white" : "bg-white"
              }`}
              onClick={() => {
                setStatusFilter("all");
                resetToFirstPage();
              }}
            >
              All
            </button>
            <button
              className={`px-2 py-1 rounded mr-1 border ${
                statusFilter === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => {
                setStatusFilter("active");
                resetToFirstPage();
              }}
            >
              Active
            </button>
            <button
              className={`px-2 py-1 rounded mr-1 border ${
                statusFilter === "inactive"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => {
                setStatusFilter("inactive");
                resetToFirstPage();
              }}
            >
              Passive
            </button>
          </div>

          {/* Role */}
          <div className="max-[1000px]:hidden">
            <span className="px-2 py-1 rounded mr-1 font-semibold">Role:</span>
            <button
              className={`px-2 py-1 rounded mr-1 border ${
                roleFilter === "all" ? "bg-green-500 text-white" : "bg-white"
              }`}
              onClick={() => {
                setRoleFilter("all");
                resetToFirstPage();
              }}
            >
              All
            </button>
            <button
              className={`px-2 py-1 rounded mr-1 border ${
                roleFilter === "admin" ? "bg-green-500 text-white" : "bg-white"
              }`}
              onClick={() => {
                setRoleFilter("admin");
                resetToFirstPage();
              }}
            >
              Admin
            </button>
            <button
              className={`px-2 py-1 rounded mr-1 border ${
                roleFilter === "manager"
                  ? "bg-green-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => {
                setRoleFilter("manager");
                resetToFirstPage();
              }}
            >
              Manager
            </button>
            <button
              className={`px-2 py-1 rounded mr-1 border ${
                roleFilter === "courier"
                  ? "bg-green-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => {
                setRoleFilter("courier");
                resetToFirstPage();
              }}
            >
              Courier
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative rounded bg-white border border-gray-200">
        <div className="max-h-[70vh] overflow-auto [max-height:600px]:max-h-64">
          <table className="min-w-full table-auto border border-gray-300 text-sm max-[1250px]:text-[12px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">Registered</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center">
                    User not found.
                  </td>
                </tr>
              ) : (
                pageItems.map((user) => (
                  <tr key={user.id} className="text-center hover:bg-gray-50">
                    <td className="px-4 py-2 border">{user.name}</td>
                    <td className="px-4 py-2 border">{user.email}</td>
                    <td className="px-4 py-2 border">{user.phone}</td>
                    <td className="px-4 py-2 border">
                      {format(new Date(user.createdAt), "dd.MM.yyyy")}
                    </td>
                    <td className="px-4 py-2 border capitalize">{user.role}</td>
                    <td className="px-4 py-2 border">
                      <span
                        className={`px-2 py-1 rounded text-white text-sm ${
                          user.active ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="flex flex-col gap-2 px-4 py-2 border ">
                      <button
                        className="text-white hover:bg-blue-300 bg-blue-500 px-1 py-1 rounded"
                        onClick={() => setEditingUser(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-white hover:bg-orange-300 bg-orange-500 px-1 py-1 rounded"
                        onClick={() => toggleActive(user.id)}
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="text-white hover:bg-red-300 bg-red-500 px-1 py-1 rounded"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RestaurantManagement style Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white mt-4">
        <div className="text-sm text-gray-800">
          Page <span className="font-semibold">{page}</span>&nbsp;/&nbsp;
          {totalPages}&nbsp;•&nbsp;
          <span className="font-semibold">{filteredUsers.length}</span>
          &nbsp;items
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold">Edit User</h3>
            <label className="block">
              Name:
              <input
                type="text"
                className="w-full border px-2 py-1 rounded"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
              />
            </label>
            <label className="block">
              Email:
              <input
                type="email"
                className="w-full border px-2 py-1 rounded"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
              />
            </label>
            <label className="block">
              Phone:
              <input
                type="text"
                className="w-full border px-2 py-1 rounded"
                value={editingUser.phone}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, phone: e.target.value })
                }
              />
            </label>
            <label className="block">
              Role:
              <select
                className="w-full border px-2 py-1 rounded"
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value })
                }
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="courier">Courier</option>
              </select>
            </label>
            <label className="block">
              Status:
              <select
                className="w-full border px-2 py-1 rounded"
                value={editingUser.active ? "active" : "inactive"}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    active: e.target.value === "active",
                  })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
