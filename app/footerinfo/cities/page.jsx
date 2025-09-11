"use client";

import { useState, useRef, useEffect } from "react";

const AllCities = () => {
  const availableCities = [
    "Berlin",
    "Hamburg",
    "München",
    "Köln",
    "Frankfurt",
    "Stuttgart",
    "Düsseldorf",
    "Dortmund",
    "Essen",
    "Leipzig",
    "Bremen",
    "Dresden",
    "Hannover",
    "Nürnberg",
    "Ulm",
  ];

  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  // Dropdown schließen bei Klick außerhalb
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredCities = availableCities.filter((city) =>
    city.toLowerCase().includes(search.toLowerCase())
  );

  const deliveryStatus = selectedCity
    ? availableCities.includes(selectedCity)
      ? "Delivery available ✅"
      : "Delivery not available ❌"
    : "";

  // Dynamische Map-URL
  const mapSrc = selectedCity
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        selectedCity
      )}&output=embed`
    : `https://www.google.com/maps?q=Germany&output=embed`;

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">All Cities</h1>
      <p className="text-gray-700 mb-4">
        Select your city to check the availability of Liefrik.de:
      </p>

      {/* Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left side: City dropdown */}
        <div>
          <div className="relative w-full max-w-md" ref={wrapperRef}>
            <input
              type="text"
              placeholder="Search city..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={selectedCity || search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedCity("");
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />

            {open && (
              <ul className="absolute z-50 w-full bg-white/50 border rounded-lg shadow max-h-60 overflow-y-auto mt-1">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city, idx) => (
                    <li
                      key={idx}
                      className="p-3 hover:bg-red-50 cursor-pointer transition"
                      onClick={() => {
                        setSelectedCity(city);
                        setSearch("");
                        setOpen(false);
                      }}
                    >
                      {city}
                    </li>
                  ))
                ) : (
                  <li className="p-3 text-gray-400">No city found</li>
                )}
              </ul>
            )}
          </div>

          {selectedCity && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-gray-700 max-w-md">
              <strong>{selectedCity}</strong>: {deliveryStatus}
            </div>
          )}
        </div>

        {/* Right side: Dynamic Google Map */}
        <div className="w-full h-64 lg:h-[500px]">
          <iframe
            title="Google Map"
            src={mapSrc}
            className="w-full h-full rounded-lg shadow"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default AllCities;
