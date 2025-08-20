"use client";
import React, { useState } from "react";

export default function OpeningHoursPage() {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const [openingHours, setOpeningHours] = useState(
    daysOfWeek.map((day) => ({
      day,
      open: "09:00",
      close: "17:00",
      closed: false,
    }))
  );

  const handleChange = (index, field, value) => {
    const updated = [...openingHours];
    updated[index][field] = value;
    setOpeningHours(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saved Opening Hours:", openingHours);
    // Hier kannst du ein API-Call machen, z.B.:
    // fetch("/api/opening-hours", { method: "POST", body: JSON.stringify(openingHours) })
  };

  return (
    <div className="max-w-2xl mx-auto p-4 border-2 border-gray-300 rounded-lg bg-white shadow-md">
      <h2 className="text-xl font-bold mb-4">Opening Hours Setting</h2>
      <p className="mb-4">Manage opening hours in the system.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {openingHours.map((dayObj, index) => (
          <div
            key={dayObj.day}
            className="flex items-center gap-4 p-2 border rounded"
          >
            <span className="w-24 font-medium">{dayObj.day}</span>
            <label className="flex items-center gap-2">
              <span>Open:</span>
              <input
                type="time"
                value={dayObj.open}
                disabled={dayObj.closed}
                onChange={(e) => handleChange(index, "open", e.target.value)}
                className="border p-1 rounded"
              />
            </label>
            <label className="flex items-center gap-2">
              <span>Close:</span>
              <input
                type="time"
                value={dayObj.close}
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
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 pointer-cursor-pointer"
        >
          Save
        </button>
      </form>
    </div>
  );
}
