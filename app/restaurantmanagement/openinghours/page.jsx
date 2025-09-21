"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "../../lib/api.js";
export default function OpeningHoursPage() {
  const API_GET = `${API_BASE}/owner/restaurants/my-restaurant`;
  const API_PUT = `${API_BASE}/owner/restaurants/my-restaurant`;

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const [token, setToken] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [openingHours, setOpeningHours] = useState([]);
  const [loading, setLoading] = useState(true);

  // Token aus localStorage nur im Browser holen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken) setToken(storedToken);
    }
  }, []);

  // Restaurantdaten laden, wenn Token vorhanden
  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        const res = await fetch(API_GET, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("Response:", res.status, text);
          throw new Error("Failed to load profile");
        }

        const data = await res.json();
        setRestaurant(data);

        // Öffnungszeiten vom Backend übernehmen
        const hoursFromBackend = data.hours || {};
        const updatedHours = daysOfWeek.map((day) => ({
          day,
          open: hoursFromBackend[day]?.open || "Closed",
          close: hoursFromBackend[day]?.close || "Closed",
          closed: hoursFromBackend[day]?.open === "Closed",
        }));
        setOpeningHours(updatedHours);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  // Änderungen in lokalen State übernehmen
  const handleChange = (index, field, value) => {
    const updated = [...openingHours];
    updated[index][field] = value;
    setOpeningHours(updated);
  };

  // Änderungen ans Backend senden
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert("No token found!");

    const hours = {};
    openingHours.forEach((d) => {
      hours[d.day] = d.closed
        ? { open: "Closed", close: "Closed" }
        : { open: d.open, close: d.close };
    });

    try {
      const res = await fetch(API_PUT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hours }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setRestaurant(updated.restaurant);
      alert("Opening hours saved successfully ✅");
    } catch (err) {
      console.error("Error updating:", err);
      alert("Error saving opening hours ❌");
    }
  };

  if (loading) return <p className="p-4">Loading opening hours...</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 border-2 border-gray-300 rounded-lg bg-white shadow-md text-gray-800 ">
      <h2 className="text-xl font-bold mb-4">Opening Hours Setting</h2>
      <p className="mb-4">Manage opening hours in the system.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {openingHours.map((dayObj, index) => (
          <div
            key={dayObj.day}
            className="flex flex-row items-center gap-4 p-2 border rounded max-[800px]:flex-col"
          >
            <span className="w-24 font-medium capitalize">{dayObj.day}</span>
            <label className="flex items-center gap-2">
              <span>Open:</span>
              <input
                type="time"
                value={dayObj.open === "Closed" ? "" : dayObj.open}
                disabled={dayObj.closed}
                onChange={(e) => handleChange(index, "open", e.target.value)}
                className="border p-1 rounded"
              />
            </label>
            <label className="flex items-center gap-2">
              <span>Close:</span>
              <input
                type="time"
                value={dayObj.close === "Closed" ? "" : dayObj.close}
                disabled={dayObj.closed}
                onChange={(e) => handleChange(index, "close", e.target.value)}
                className="border p-1 rounded"
              />
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={dayObj.closed}
                onChange={(e) =>
                  handleChange(index, "closed", e.target.checked)
                }
              />
              Closed
            </label>
          </div>
        ))}
        <button
          type="submit"
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Save
        </button>
      </form>

      {restaurant && (
        <div className="mt-6 p-4 border rounded bg-gray-100">
          <h3 className="text-lg font-bold mb-2">Your Restaurant Data</h3>
          <p>
            <strong>Name:</strong> {restaurant.restaurantName}
          </p>
          <p>
            <strong>Email:</strong> {restaurant.email}
          </p>
          <p>
            <strong>Phone:</strong> {restaurant.phone}
          </p>
          <p>
            <strong>Address:</strong> {restaurant.address?.street},{" "}
            {restaurant.address?.city}, {restaurant.address?.postalCode},{" "}
            {restaurant.address?.country}
          </p>
          <p>
            <strong>Status:</strong> {restaurant.status}
          </p>
        </div>
      )}
    </div>
  );
}
