"use client";

import MenuCard from "./menuCard";

export default function MenuPage() {
  const menuItems = [
    {
      id: 1,
      name: "Pizza Margherita",
      description: "Tomaten, Mozzarella, frisches Basilikum",
      price: 10,
      image: "/images/pizza.jpg",
    },
    {
      id: 2,
      name: "Sushi Box",
      description: "Frisches Sushi, 12 Stück",
      price: 12,
      image: "/images/sushi.jpg",
    },
    {
      id: 3,
      name: "Cheeseburger",
      description: "Saftiger Burger mit Käse, Pommes inklusive",
      price: 12,
      image: "/images/burger.jpg",
    },
    {
      id: 4,
      name: "Pasta Carbonara",
      description: "Spaghetti mit cremiger Specksoße",
      price: 11,
      image: "/images/pasta.jpg",
    },
    {
      id: 5,
      name: "Caesar Salad",
      description: "Frischer Salat mit Hähnchen und Parmesan",
      price: 9,
      image: "/images/salad.jpg",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Menu Management</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
