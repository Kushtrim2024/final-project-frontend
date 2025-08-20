"use client";

import { useState } from "react";

export default function RestaurantProfile() {
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [logo, setLogo] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cuisines, setCuisines] = useState([]);
  const [minOrder, setMinOrder] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");

  const cuisineOptions = [
    "Turkish",
    "Vegan",
    "Pizza",
    "Dessert",
    "Sushi",
    "Burgers",
  ];

  const toggleCuisine = (cuisine) => {
    setCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleSave = () => {
    console.log({
      coverPhoto,
      logo,
      name,
      description,
      cuisines,
      minOrder,
      deliveryTime,
      deliveryFee,
    });
    alert("Changes saved (dummy)");
  };

  return (
    <div className="p-6 border bg-white border-white rounded-xl max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Restaurant Profile & Visuals</h1>

      {/* Cover Photo */}
      <div className="mb-4 border-1 rounded-lg p-4">
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
      <div className="mb-4 border-1 rounded-lg p-4">
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
    </div>
  );
}
