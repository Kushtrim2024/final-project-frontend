"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { API_BASE } from "../../../lib/api.js";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function KundenUsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [addingOpen, setAddingOpen] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [q, setQ] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const token = getToken();

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : [];
      } catch {
        data = [];
      }
      if (!res.ok)
        throw new Error(data?.message || raw || `HTTP ${res.status}`);

      const list = Array.isArray(data) ? data : data?.users || [];
      const norm = list.map((u, i) => ({
        id: u?._id || u?.id || i,
        name: u?.name || "-",
        email: u?.email || "-",
        phone: u?.phone || "-",
        role: u?.role || "user",
        createdAt: u?.createdAt || new Date().toISOString(),
      }));
      setRows(norm);
    } catch (e) {
      setErr(e.message || "Could not get list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  async function handleDelete(id) {
    if (!confirm("This user will be deleted. Are you sure?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok)
        throw new Error(data?.message || raw || `HTTP ${res.status}`);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e.message || "Delete error");
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setAddErr("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    // all fields are required + password confirmation
    const requiredNames = [
      "name",
      "email",
      "password",
      "passwordConfirm",
      "phone",
      "street",
      "postalCode",
      "city",
      "country",
    ];
    for (const n of requiredNames) {
      if (!String(fd.get(n) || "").trim()) {
        setAddErr("All fields are required.");
        return;
      }
    }
    if (String(fd.get("password")) !== String(fd.get("passwordConfirm"))) {
      setAddErr("Passwords do not match.");
      return;
    }

    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      passwordConfirm: fd.get("passwordConfirm"),
      phone: fd.get("phone"),
      address: {
        street: fd.get("street"),
        city: fd.get("city"),
        postalCode: fd.get("postalCode"),
        country: fd.get("country"),
      },
      role: "user",
    };

    try {
      const res = await fetch(`${API_BASE}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok)
        throw new Error(data?.message || raw || `HTTP ${res.status}`);

      setAddingOpen(false);
      form.reset();
      await load();
      setPage(1);
    } catch (e) {
      setAddErr(e.message || "User adding error.");
    }
  }

  const getPageButtons = (current, total) => {
    if (total <= 1) return [1];

    current = Math.max(1, Math.min(current, total));

    if (total === 2) return [1, 2];
    if (total === 3) return Array.from(new Set([1, current, total]));

    if (current === 1 || current === total) {
      return [1, "…", total];
    }

    const out = [1];
    if (current > 2) out.push("…");
    out.push(current);
    if (current < total - 1) out.push("…");
    out.push(total);
    return out;
  };

  return (
    <div className="p-6 text-gray-800">
      <div className="flex flex-row max-[600px]:flex-col max-[600px]:items-start items-center justify-between mb-4">
        <h2 className="text-2xl font-bold max-[700px]:text-[16px]">
          Admin - User Management
        </h2>
        <button
          className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          onClick={() => setAddingOpen(true)}
        >
          + Add User
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <input
          placeholder="Search name/email…"
          className="border rounded px-3 py-1 w-full md:w-1/3"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm">Rows:</label>
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
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      <div className="overflow-auto border rounded">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Email</th>
              <th className="px-3 py-2 border">Phone</th>
              <th className="px-3 py-2 border">Registered</th>
              <th className="px-3 py-2 border">Role</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan={6}>
                  {loading ? "Loading..." : "No users"}
                </td>
              </tr>
            ) : (
              pageItems.map((r) => (
                <tr key={r.id} className="text-center hover:bg-gray-50">
                  <td className="border px-3 py-2">{r.name}</td>
                  <td className="border px-3 py-2">{r.email}</td>
                  <td className="border px-3 py-2">{r.phone}</td>
                  <td className="border px-3 py-2">
                    {format(new Date(r.createdAt), "dd.MM.yyyy")}
                  </td>
                  <td className="border px-3 py-2 capitalize">{r.role}</td>
                  <td className="border px-3 py-2">
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white"
                      onClick={() => handleDelete(r.id)}
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

      {/* Pagination: Prev | dynamic buttons | Next */}
      <div className="flex flex-row max-[600px]:flex-col items-center justify-between gap-3 p-3 border-t bg-white mt-4">
        <div className="text-sm text-gray-800">
          Page <b>{page}</b> / {totalPages} • <b>{filtered.length}</b> items
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {getPageButtons(page, totalPages).map((n, idx) =>
              n === "…" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 select-none max-[700px]:hidden"
                >
                  …
                </span>
              ) : (
                <button
                  key={`pg-${n}`}
                  type="button"
                  aria-current={page === n ? "page" : undefined}
                  className={`px-3 py-1 border rounded ${
                    page === n ? "bg-gray-800 text-white" : "hover:bg-gray-100"
                  }`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              )
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

      {/* Add Modal */}
      {addingOpen && (
        <div className="fixed top-30 inset-0 bg-black/80 flex items-start justify-center p-4 z-50 overflow-auto">
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-lg p-6 w-full max-w-md space-y-3"
          >
            <h3 className="text-lg font-semibold mb-2">Add User</h3>

            <input
              name="name"
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="Name"
            />
            <input
              name="email"
              required
              type="email"
              className="border rounded px-3 py-2 w-full"
              placeholder="Email"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="password"
                required
                type="password"
                className="border rounded px-3 py-2 w-full"
                placeholder="Password"
              />
              <input
                name="passwordConfirm"
                required
                type="password"
                className="border rounded px-3 py-2 w-full"
                placeholder="Confirm Password"
              />
            </div>
            <input
              name="phone"
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="Phone"
            />
            <input
              name="street"
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="Street"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                name="postalCode"
                required
                className="border rounded px-3 py-2"
                placeholder="Postal Code"
              />
              <input
                name="city"
                required
                className="border rounded px-3 py-2"
                placeholder="City"
              />
              <input
                name="country"
                required
                className="border rounded px-3 py-2"
                placeholder="Country"
              />
            </div>

            {addErr && <p className="text-red-600 text-sm">{addErr}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddingOpen(false)}
                className="px-3 py-2 rounded bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded bg-green-600 text-white"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
