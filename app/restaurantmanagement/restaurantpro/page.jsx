"use client";

import { useState, useEffect } from "react";

const API_GET = "http://localhost:5517/owner/getRestaurantOwnerProfile";
const API_PUT = "http://localhost:5517/owner/profile/update";

export default function RestaurantProfile() {
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [logo, setLogo] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisines, setCuisines] = useState([]);
  const [minOrder, setMinOrder] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const [owner, setOwner] = useState(null);

  const [loading, setLoading] = useState(true);

  const cuisineOptions = [
    "Turkish",
    "Vegan",
    "Pizza",
    "Dessert",
    "Sushi",
    "Burgers",
  ];

  // --- GET: Restaurant Profil laden ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("Kein Token gefunden. Bitte einloggen.");
          setLoading(false);
          return;
        }

        const res = await fetch(API_GET, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Fehler beim Laden des Profils");
        const data = await res.json();

        setName(data.restaurant?.name || "");
        setDescription(data.restaurant?.description || "");
        setCuisines(data.restaurant?.cuisines || []);
        setMinOrder(data.restaurant?.minOrder || "");
        setDeliveryTime(data.restaurant?.deliveryTime || "");
        setDeliveryFee(data.restaurant?.deliveryFee || "");
        setCoverPhoto(data.restaurant?.coverPhoto || null);
        setLogo(data.restaurant?.logo || null);

        setOwner(data.owner || null); // Owner-Daten merken
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleCuisine = (cuisine) => {
    setCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  // --- PUT: Restaurant Profil speichern ---
  const handleSave = async () => {
    const payload = {
      coverPhoto,
      logo,
      name,
      description,
      cuisines,
      minOrder,
      deliveryTime,
      deliveryFee,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bitte einloggen, um Änderungen zu speichern.");
        return;
      }

      const res = await fetch(API_PUT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Fehler beim Speichern des Profils");
      const updated = await res.json();
      alert("Änderungen gespeichert!");
      console.log("Gespeichert:", updated);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern");
    }
  };

  if (loading) {
    return <p className="text-center mt-10">Profil wird geladen...</p>;
  }

  return (
    <div className="p-6 border bg-white border-white rounded-xl max-w-5xl mx-auto text-gray-800 shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Restaurant Profile & Visuals</h1>

      {/* Cover Photo */}
      <div className="mb-4 border rounded-lg p-4">
        <label className="block mb-1 font-semibold">Cover Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setCoverPhoto(URL.createObjectURL(e.target.files[0]))
          }
          className="mb-2"
        />
        {coverPhoto && (
          <img
            src={coverPhoto}
            alt="Cover"
            className="w-full h-32 object-cover border"
          />
        )}
      </div>

      {/* Logo */}
      <div className="mb-4 border rounded-lg p-4">
        <label className="block mb-1 font-semibold">Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(URL.createObjectURL(e.target.files[0]))}
          className="mb-2"
        />
        {logo && (
          <img
            src={logo}
            alt="Logo"
            className="w-24 h-24 object-cover border rounded-full"
          />
        )}
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Restaurant Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Cuisine Types */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Cuisine Types</label>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCuisine(c)}
              className={`px-3 py-1 border rounded ${
                cuisines.includes(c) ? "bg-neutral-700 text-white" : "bg-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Info */}
      <div className="mb-4 flex gap-4">
        <input
          type="number"
          placeholder="€ Minimum Order"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          type="number"
          placeholder="Delivery Time (min)"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          type="number"
          placeholder="€ Delivery Fee"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          className="border p-2 rounded flex-1"
        />
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-orange-500 text-white font-semibold rounded"
      >
        Save Changes
      </button>

      {/* --- Owner Informationen --- */}
      {owner && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Owner Information</h2>
          <p>
            <span className="font-semibold">Name:</span>{" "}
            {owner.username || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {owner.email || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Phone:</span> {owner.phone || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {owner.role || "Owner"}
          </p>
        </div>
      )}
    </div>
  );
}
