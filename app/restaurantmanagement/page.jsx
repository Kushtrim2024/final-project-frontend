"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const res = await fetch("https://api.npoint.io/0d6723b0f22745a68586");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRestaurants(data.restaurants); // <--- wichtig: .restaurants
      } catch (error) {
        console.error(error);
      }
    }
    fetchRestaurants();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Restaurants</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {restaurants &&
          restaurants.map((r) => (
            <Link key={r.id} href={`/restaurant/${r.id}`}>
              <div className="border rounded p-4 hover:shadow-lg cursor-pointer">
                <h2 className="font-semibold text-xl">{r.name}</h2>
                <p>{r.description}</p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
