"use client";

export default function MenuCard({ item }) {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <img
        src={item.image}
        alt={item.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
        <p className="text-gray-600 mb-2">{item.description}</p>
        <p className="text-green-600 font-bold">${item.price.toFixed(2)}</p>
      </div>
    </div>
  );
}
