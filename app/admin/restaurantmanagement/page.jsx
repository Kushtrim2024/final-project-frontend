"use client";
import { useEffect, useState, Fragment } from "react";
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

export default function RestaurantManagement() {
  // DATA
  const [restaurants, setRestaurants] = useState([]);

  // UI
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // SEARCH
  const [pendingQuery, setPendingQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // PAGINATION
  const [pendingPage, setPendingPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(5);
  const [activePageSize, setActivePageSize] = useState(5);

  // AUTH
  const [token, setToken] = useState("");
  const [tokenChecked, setTokenChecked] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_API_BASE_REST || "http://localhost:5517";

  // ---- helpers
  const readTokenFromStorage = () => {
    if (typeof window === "undefined") return "";
    const keys = ["adminToken", "token", "accessToken", "jwt", "authToken"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.trim()) return v.trim();
    }
    return "";
  };

  // address helpers
  const ensureAddressObject = (a) => {
    if (a && typeof a === "object") {
      return {
        street: a.street || "",
        city: a.city || "",
        postalCode: a.postalCode || "",
        country: a.country || "",
        full: a.full || "",
      };
    }
    const s = typeof a === "string" ? a : "";
    return { street: s, city: "", postalCode: "", country: "", full: s };
  };

  const handleEditAddressChange = (e) => {
    const { name, value } = e.target;
    setEditingRestaurant((prev) => ({
      ...prev,
      address: { ...ensureAddressObject(prev?.address), [name]: value },
    }));
  };

  const mapFromApi = (r, i) => {
    const normalizeAddress = (a) => {
      if (!a) return "-";
      if (typeof a === "string") return a;
      if (typeof a === "object") {
        if (a.full && typeof a.full === "string") return a.full;
        const parts = [a.street, a.city, a.postalCode, a.country]
          .filter(Boolean)
          .map(String);
        return parts.length ? parts.join(", ") : "-";
      }
      return String(a);
    };

    const normalizeStatus = (s) => {
      const val = (
        typeof s === "string" ? s : String(s || "inactive")
      ).toLowerCase();
      return val === "active" || val === "inactive" ? val : "inactive";
    };

    return {
      id: r?._id || r?.id || r?.restaurantId || String(i),
      restaurantName: r?.restaurantName || r?.restaurant?.name || "-",
      name: r?.name || r?.contactPerson || r?.ownerName || "-",
      email: r?.email || r?.contactEmail || "-",
      address: normalizeAddress(r?.address),
      taxNumber: r?.taxNumber || r?.taxNo || "-",
      status: normalizeStatus(r?.status),
      website: r?.website || "-",
      phone: r?.phone || r?.contactPhone || "-",
      taxDocument: r?.taxDocument || r?.documents?.tax || "",
      logo: r?.image || r?.logo || "",
      description: r?.description || "",
      restaurantId: r?.restaurantId || r?.restaurant?._id || "",
    };
  };

  const pickFirstArray = (obj) => {
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === "object") {
      const preferred = ["restaurants", "items", "data", "results", "list"];
      for (const k of preferred) {
        if (Array.isArray(obj?.[k])) return obj[k];
        if (Array.isArray(obj?.[k]?.items)) return obj[k].items;
      }
      for (const v of Object.values(obj)) {
        if (Array.isArray(v)) return v;
        if (v && typeof v === "object" && Array.isArray(v.items))
          return v.items;
      }
    }
    return [];
  };

  const fetchRestaurants = async (tk) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${BASE}/admin/restaurant-owners`, {
        headers: { Authorization: `Bearer ${tk}` },
        cache: "no-store",
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : [];
        console.log(data);
      } catch {
        data = [];
      }
      if (!res.ok)
        throw new Error(data?.message || text || `HTTP ${res.status}`);
      const list = pickFirstArray(data);
      setRestaurants(list.map(mapFromApi));
    } catch (e) {
      setErr(e.message || "List fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // token reader
  useEffect(() => {
    const t = readTokenFromStorage();
    if (t) setToken(t);
    setTokenChecked(true);
    const onStorage = () => setToken(readTokenFromStorage());
    const onFocus = onStorage;
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  // Fetch the list when the token is ready
  useEffect(() => {
    if (!tokenChecked) return;
    if (!token) {
      setLoading(false);
      setErr("Error: Login (token) not found. Please log in as admin.");
      return;
    }
    fetchRestaurants(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenChecked, token]);

  // ui helpers
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  // PAGINATION buttons: 1 … prev current next … last
  const getPageButtons = (current, total) => {
    if (total <= 1) return [1];

    current = Math.max(1, Math.min(current, total));

    const pages = [1];

    if (current > 2) {
      pages.push("…");
    }

    if (current !== 1 && current !== total) {
      pages.push(current);
    }

    if (current < total - 1) {
      pages.push("…");
    }

    if (total !== 1) {
      pages.push(total);
    }

    return pages;
  };

  // --- ACTIONS (optimistic + rollback)
  const approveRestaurant = async (id) => {
    if (!token) return alert("Token not found");
    const prevSnapshot = restaurants;
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "active" } : r))
    );
    try {
      const res = await fetch(`${BASE}/admin/restaurant-owners/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "active" }),
      });
      if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
      const data = await res.json();
      const updated = data.owner || data;
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === id || r._id === id ? { ...r, ...mapFromApi(updated) } : r
        )
      );
    } catch (e) {
      setRestaurants(prevSnapshot);
      alert(e.message);
    }
  };

  const setInactive = async (id) => {
    if (!token) return alert("Token not found");
    const prevSnapshot = restaurants;
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "inactive" } : r))
    );
    try {
      const res = await fetch(`${BASE}/admin/restaurant-owners/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "inactive" }),
      });
      if (!res.ok) throw new Error(`Deactivate failed: ${res.status}`);
      const data = await res.json();
      const updated = data.owner || data;
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === id || r._id === id ? { ...r, ...mapFromApi(updated) } : r
        )
      );
    } catch (e) {
      setRestaurants(prevSnapshot);
      alert(e.message);
    }
  };

  const handleEditClick = (restaurant) => {
    setEditingRestaurant({
      ...restaurant,
      address: ensureAddressObject(restaurant?.address),
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingRestaurant((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    if (!token) return alert("Token not found");
    try {
      const id = editingRestaurant.id;

      // --- MINI: Convert the address to the object the backend wants ---
      const toAddrObj = (val) => {
        if (val && typeof val === "object") {
          return {
            street: val.street || "",
            city: val.city || "",
            postalCode: val.postalCode || "",
            country: val.country || "",
            full: val.full || "",
          };
        }
        const s = String(val || "").trim();
        const parts = s
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const obj = {
          street: "",
          city: "",
          postalCode: "",
          country: "",
          full: s,
        };
        if (parts.length >= 4) {
          obj.country = parts.pop();
          obj.postalCode = parts.pop();
          obj.city = parts.pop();
          obj.street = parts.join(", ");
        } else if (parts.length === 3) {
          [obj.street, obj.city, obj.country] = parts;
        } else if (parts.length === 2) {
          [obj.street, obj.country] = parts;
        } else if (parts.length === 1) {
          obj.street = parts[0];
        }
        return obj;
      };

      const addr = toAddrObj(editingRestaurant.address);

      // Minimum client-side validation (schema required)
      if (!addr.street || !addr.city || !addr.postalCode || !addr.country) {
        alert(
          "Please fill in the address as 'Street, City, PostalCode, Country'."
        );
        return;
      }

      const payload = {
        restaurantName: editingRestaurant.restaurantName,
        name: editingRestaurant.name,
        description: editingRestaurant.description || "",
        address: addr,
        phone: editingRestaurant.phone,
        email: editingRestaurant.email,
        website: editingRestaurant.website,
        image: editingRestaurant.logo,
        taxNumber: editingRestaurant.taxNumber,
        taxDocument: editingRestaurant.taxDocument,
      };

      const res = await fetch(`${BASE}/admin/restaurant-owners/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Update failed: ${res.status} ${t}`);
      }

      const updated = await res.json();
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === id || r._id === id ? { ...r, ...mapFromApi(updated) } : r
        )
      );
      setShowEditModal(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!token) return alert("Token not found");
    if (!confirm("Do you want to delete this restaurant?")) return;
    const prevSnapshot = restaurants;
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`${BASE}/admin/restaurant-owners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
    } catch (e) {
      setRestaurants(prevSnapshot);
      alert(e.message);
    }
  };

  // derived lists (we use the backend status as is)
  const activeAll = restaurants.filter((r) => r.status === "active");
  const pendingAll = restaurants.filter((r) => r.status === "inactive");

  // search filters
  const matches = (r, q) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return [r.restaurantName, r.name, r.email, r.address, r.phone, r.taxNumber]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(s));
  };

  const activeFiltered = activeAll.filter((r) => matches(r, activeQuery));
  const pendingFiltered = pendingAll.filter((r) => matches(r, pendingQuery));

  // pagination
  const pendingTotalPages = Math.max(
    1,
    Math.ceil(pendingFiltered.length / pendingPageSize)
  );
  const activeTotalPages = Math.max(
    1,
    Math.ceil(activeFiltered.length / activePageSize)
  );
  useEffect(() => {
    setPendingPage((p) => clamp(p, 1, pendingTotalPages));
  }, [pendingFiltered.length, pendingPageSize]);
  useEffect(() => {
    setActivePage((p) => clamp(p, 1, activeTotalPages));
  }, [activeFiltered.length, activePageSize]);
  useEffect(() => {
    setExpandedRow(null);
  }, [
    pendingPage,
    activePage,
    pendingPageSize,
    activePageSize,
    pendingQuery,
    activeQuery,
  ]);

  const paginate = (arr, page, perPage) =>
    arr.slice((page - 1) * perPage, page * perPage);
  const pendingPageItems = paginate(
    pendingFiltered,
    pendingPage,
    pendingPageSize
  );
  const activePageItems = paginate(activeFiltered, activePage, activePageSize);

  if (!tokenChecked) return <div className="p-4">Checking…</div>;
  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;

  return (
    <div className="space-y-8">
      {/* PENDING (Awaiting Approval) */}
      <h2 className="text-2xl font-bold text-orange-500 max-[1250px]:text-[12px]">
        Restaurants Awaiting Approval
      </h2>

      {/* Search - Pending */}
      <div className="flex justify-between items-center gap-3">
        <div>
          <input
            value={pendingQuery}
            onChange={(e) => {
              setPendingQuery(e.target.value);
              setPendingPage(1);
            }}
            placeholder="Search awaiting approval…"
            className="w-full md:w-96 border rounded px-3 py-1 text-gray-600"
            type="text"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600 max-[750px]:hidden mr-1">
            Rows:
          </label>
          <select
            className="border rounded px-2 py-1 text-gray-600"
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
        </div>
      </div>

      <div className="relative rounded bg-white shadow max-[1320px]:text-[12px] ">
        <div className="max-h-[47rem] overflow-auto">
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
                    No awaiting approval restaurants.
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
                        {res.status /* 'inactive' */}
                      </td>
                      <td className="border px-4 py-2 flex justify-center gap-2 max-[1150px]:flex-col max-[1150px]:flex">
                        {/* APPROVE -> active */}
                        <button
                          type="button"
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            approveRestaurant(res.id);
                          }}
                        >
                          Approve
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

        {/* Pagination - Pending */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold">{pendingPage}</span>
            &nbsp;/&nbsp;{Math.max(1, pendingTotalPages)} &nbsp;•&nbsp;
            <span className="font-semibold">{pendingFiltered.length}</span>
            &nbsp;items
          </div>
          <div className="flex items-center gap-2  text-gray-800">
            <button
              type="button"
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
              disabled={pendingPage === 1}
            >
              Prev
            </button>

            <div className="flex items-center gap-1">
              {getPageButtons(pendingPage, pendingTotalPages).map((n, idx) =>
                n === "…" ? (
                  <span
                    key={`pend-ellipsis-${idx}`}
                    className="px-2 select-none max-[700px]:hidden"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={`pend-${n}`}
                    type="button"
                    aria-current={pendingPage === n ? "page" : undefined}
                    className={`px-3 py-1 border rounded ${
                      pendingPage === n
                        ? "bg-gray-800 text-white"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setPendingPage(n)}
                  >
                    {n}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
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

      {/* ACTIVE */}
      <div>
        <h3 className="text-2xl font-bold text-orange-500 mb-4 max-[1250px]:text-[12px] ">
          Active Partner Restaurants
        </h3>

        {/* Search - Active */}
        <div className="flex justify-between items-center gap-3 mb-2">
          <input
            value={activeQuery}
            onChange={(e) => {
              setActiveQuery(e.target.value);
              setActivePage(1);
            }}
            placeholder="Search active restaurants…"
            className="w-full md:w-96 border rounded px-3 py-1 text-gray-600"
            type="text"
          />
          <div>
            <label className="text-sm text-gray-800 max-[750px]:hidden mr-1">
              Rows:
            </label>
            <select
              className="border rounded px-2 py-1 text-gray-600"
              value={activePageSize}
              onChange={(e) => {
                setActivePageSize(Number(e.target.value));
                setActivePage(1);
              }}
            >
              {[6, 12, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative rounded bg-white shadow max-[1250px]:text-[12px] border">
          <div className="max-h-[47rem] overflow-auto">
            <table className="min-w-[1000px] w-full table-fixed border-collapse ">
              <thead className="bg-gray-800 sticky top-0 text-gray-100">
                <tr>
                  <th className="px-4 py-4 border border-black">Restaurant</th>
                  <th className="px-4 py-4 border border-black">Owner</th>
                  <th className="px-4 py-4 border border-black">Email</th>
                  <th className="px-4 py-4 border border-black">Address</th>
                  <th className="px-4 py-4 border border-black">Tax No</th>
                  <th className="px-4 py-4 border border-black">Status</th>
                  <th className="px-4 py-4 border border-black text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {activePageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-600">
                      No active restaurants.
                    </td>
                  </tr>
                ) : (
                  activePageItems.map((res) => (
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
                          {res.status /* 'active' */}
                        </td>
                        <td className="border px-4 py-2 flex flex-col justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditClick(res);
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            <FontAwesomeIcon icon={faEdit} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(res.id);
                            }}
                            className="text-red-600 hover:underline"
                          >
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setInactive(res.id);
                            }}
                            className="px-2 py-1 rounded bg-gray-300 hover:bg-gray-400"
                          >
                            Inactive
                          </button>
                        </td>
                      </tr>
                      {expandedRow === res.id && (
                        <tr className="bg-gray-50">
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

          {/* Pagination - Active */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white">
            <div className="text-sm text-gray-800">
              Page <span className="font-semibold">{activePage}</span>
              &nbsp;/&nbsp;{Math.max(1, activeTotalPages)}&nbsp;•&nbsp;
              <span className="font-semibold">{activeFiltered.length}</span>
              &nbsp;items
            </div>

            <div className="flex items-center gap-2 text-gray-800">
              <button
                type="button"
                className="px-2 py-1 border rounded disabled:opacity-50"
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {getPageButtons(activePage, activeTotalPages).map((n, idx) =>
                  n === "…" ? (
                    <span
                      key={`appr-ellipsis-${idx}`}
                      className="px-2 select-none max-[700px]:hidden"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={`appr-${n}`}
                      type="button"
                      aria-current={activePage === n ? "page" : undefined}
                      className={`px-2 py-1 border rounded ${
                        activePage === n
                          ? "bg-gray-800 text-white"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setActivePage(n)}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() =>
                  setActivePage((p) => Math.min(activeTotalPages, p + 1))
                }
                disabled={activePage === activeTotalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
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
                value={editingRestaurant?.restaurantName || ""}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Restaurant Name"
              />
              <input
                type="text"
                name="name"
                value={editingRestaurant?.name || ""}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Owner Name"
              />
              <input
                type="email"
                name="email"
                value={editingRestaurant?.email || ""}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Email"
              />

              {/* Address fields */}
              <input
                type="text"
                name="street"
                value={ensureAddressObject(editingRestaurant?.address).street}
                onChange={handleEditAddressChange}
                className="border p-2 rounded"
                placeholder="Street"
              />
              <input
                type="text"
                name="city"
                value={ensureAddressObject(editingRestaurant?.address).city}
                onChange={handleEditAddressChange}
                className="border p-2 rounded"
                placeholder="City"
              />
              <input
                type="text"
                name="postalCode"
                value={
                  ensureAddressObject(editingRestaurant?.address).postalCode
                }
                onChange={handleEditAddressChange}
                className="border p-2 rounded"
                placeholder="Postal Code"
              />
              <input
                type="text"
                name="country"
                value={ensureAddressObject(editingRestaurant?.address).country}
                onChange={handleEditAddressChange}
                className="border p-2 rounded"
                placeholder="Country"
              />

              <input
                type="text"
                name="taxNumber"
                value={editingRestaurant?.taxNumber || ""}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Tax Number"
              />
              <input
                type="text"
                name="website"
                value={editingRestaurant?.website || ""}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Website"
              />
              <input
                type="text"
                name="phone"
                value={editingRestaurant?.phone || ""}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Phone"
              />
              <input
                type="text"
                name="taxDocument"
                value={editingRestaurant?.taxDocument || ""}
                onChange={handleEditChange}
                className="border p-2 rounded"
                placeholder="Tax Document Link"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
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
