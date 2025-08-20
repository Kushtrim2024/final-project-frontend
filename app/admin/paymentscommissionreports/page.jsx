"use client";

import React, { useEffect, useState } from "react";

const restaurants = [
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
    address: "Herne, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Castrop-Rauxel, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Stuttgart, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Leipzig, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Herne, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Castrop-Rauxel, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Stuttgart, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Leipzig, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Herne, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Castrop-Rauxel, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Stuttgart, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
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
    address: "Leipzig, Deutschland",
    status: "pending",
    totalSales: 1500,
    commissionRate: 0.1,
    paidCommission: 0,
  },
];

// Dummy Data
const payments = [
  {
    id: 1,
    restaurant: "CHN Vegetarian Burger",
    amount: 300,
    method: "Bank Transfer",
    date: "2025-08-10",
  },
  {
    id: 2,
    restaurant: "RDY Pizza",
    amount: 960,
    method: "PayPal",
    date: "2025-08-01",
  },
];

const invoices = [
  {
    id: "INV-001",
    restaurant: "CHN Vegetarian Burger",
    amount: 300,
    date: "2025-08-05",
    status: "Sent",
  },
  {
    id: "INV-002",
    restaurant: "RDY Pizza",
    amount: 960,
    date: "2025-08-02",
    status: "Paid",
  },
];

export default function AdminPanelPage() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tab, setTab] = useState("order");

  const [data, setData] = useState(restaurants);

  // --- RestaurantManagement style PAGINATION state ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // 6 / 12 / 24 / 48
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // Filtreli restoran list
  const filteredRestaurants = data.filter(
    (r) =>
      r.restaurantName.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === "" || r.status === statusFilter)
  );

  // Tab title
  const tabs = [
    { key: "order", label: "Order Management" },
    { key: "commission", label: "Commission Tracking" },
    { key: "payments", label: "Payment Reports" },
    { key: "invoices", label: "Invoice Management" },
    { key: "history", label: "Payment History" },
  ];

  // --- Generate headers and rows based on Tab A ---
  const { headers, rows } = React.useMemo(() => {
    if (tab === "order") {
      return {
        headers: [
          "#",
          "Restaurant",
          "Owner",
          "Phone",
          "Delivery",
          "Status",
          "Actions",
        ],
        rows: filteredRestaurants.map((res) => [
          res.id,
          res.restaurantName,
          res.name,
          res.phone,
          res.deliveryType,
          <span
            key={`status-${res.id}`}
            className={`px-2 py-1 rounded text-xs font-medium uppercase ${
              res.status === "pending"
                ? "bg-yellow-200 text-yellow-800"
                : "bg-green-200 text-green-800"
            }`}
          >
            {res.status}
          </span>,
          <button
            key={`btn-${res.id}`}
            className="text-blue-600 hover:underline"
            onClick={() => setSelected((s) => (s === res.id ? null : res.id))}
          >
            {selected === res.id ? "Hide" : "Details"}
          </button>,
        ]),
      };
    }

    if (tab === "commission") {
      return {
        headers: [
          "Restaurant",
          "Sales",
          "Rate",
          "Commission",
          "Paid",
          "Actions",
        ],
        rows: data.map((res) => {
          const commission = res.totalSales * res.commissionRate;
          return [
            res.restaurantName,
            `₺${res.totalSales}`,
            `${(res.commissionRate * 100).toFixed(0)}%`,
            `₺${commission}`,
            `₺${res.paidCommission}`,
            <button
              key={`mark-${res.id}`}
              className="text-blue-600 hover:underline"
              onClick={() => markAsPaid(res.id)}
            >
              Mark as Paid
            </button>,
          ];
        }),
      };
    }

    if (tab === "payments") {
      return {
        headers: ["Restaurant", "Amount", "Method", "Date"],
        rows: payments.map((p) => [
          p.restaurant,
          `₺${p.amount}`,
          p.method,
          p.date,
        ]),
      };
    }

    if (tab === "invoices") {
      return {
        headers: ["Invoice #", "Restaurant", "Amount", "Date", "Status"],
        rows: invoices.map((inv) => [
          inv.id,
          inv.restaurant,
          `₺${inv.amount}`,
          inv.date,
          inv.status,
        ]),
      };
    }

    // history
    return {
      headers: ["Restaurant", "Amount", "Method", "Date"],
      rows: payments.map((p) => [
        p.restaurant,
        `₺${p.amount}`,
        p.method,
        p.date,
      ]),
    };
  }, [tab, filteredRestaurants, data, selected]);

  // Total items and page count
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Prevent overflow (when data/rows/pageSize changes)
  useEffect(() => {
    setPage((p) => clamp(p, 1, totalPages));
  }, [totalItems, pageSize]);

  // Return to page 1 when tab, search or filter change
  useEffect(() => {
    setPage(1);
  }, [tab]);

  const onSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const onStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // Sliced rows (active sheet)
  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  // Actions
  const markAsPaid = (id) => {
    setData((prev) =>
      prev.map((res) =>
        res.id === id
          ? { ...res, paidCommission: res.totalSales * res.commissionRate }
          : res
      )
    );
  };

  return (
    <div className="p-6 text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded transition ${
              tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ORDER MANAGEMENT */}
      {tab === "order" && (
        <>
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search restaurant..."
              value={search}
              onChange={onSearchChange}
              className="border px-4 py-2 rounded w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={onStatusChange}
              className="border px-4 py-2 rounded"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <Table headers={headers} rows={pageRows} />

          {/* Pagination Controls */}
          <PaginationControls
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />

          {selected && (
            <DetailsCard restaurant={data.find((r) => r.id === selected)} />
          )}
        </>
      )}

      {/* COMMISSION TRACKING */}
      {tab === "commission" && (
        <>
          <Table headers={headers} rows={pageRows} />
          <PaginationControls
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />
        </>
      )}

      {/* PAYMENT REPORTS */}
      {tab === "payments" && (
        <>
          <Table headers={headers} rows={pageRows} />
          <PaginationControls
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />
        </>
      )}

      {/* INVOICE MANAGEMENT */}
      {tab === "invoices" && (
        <>
          <Table headers={headers} rows={pageRows} />
          <PaginationControls
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />
        </>
      )}

      {/* PAYMENT HISTORY */}
      {tab === "history" && (
        <>
          <Table headers={headers} rows={pageRows} />
          <PaginationControls
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
          />
        </>
      )}
    </div>
  );
}

// Reusable Table Component
function Table({ headers, rows, emptyText = "No data." }) {
  return (
    <div className="relative rounded bg-white border border-gray-200">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full border bg-white text-sm">
          <thead className="bg-gray-200 text-gray-900 sticky top-0">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2 border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 border text-center text-gray-600"
                  colSpan={headers.length}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 border align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pagination Controls
function PaginationControls({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white mt-4">
      <div className="text-sm text-gray-800">
        Page <span className="font-semibold">{page}</span>&nbsp;/&nbsp;
        {totalPages}&nbsp;•&nbsp;
        <span className="font-semibold">{totalItems}</span>
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
  );
}

// Restaurant Details Card
function DetailsCard({ restaurant }) {
  if (!restaurant) return null;
  return (
    <div className="bg-gray-100 p-4 rounded border text-sm mt-4">
      <h2 className="text-lg font-semibold mb-2">
        {restaurant.restaurantName} Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong>Email:</strong> {restaurant.email}
        </div>
        <div>
          <strong>Website:</strong>{" "}
          <a
            href={restaurant.website}
            className="text-blue-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            Visit
          </a>
        </div>
        <div>
          <strong>Address:</strong> {restaurant.address}
        </div>
        <div>
          <strong>Created At:</strong> {restaurant.createdAt}
        </div>
      </div>
    </div>
  );
}
