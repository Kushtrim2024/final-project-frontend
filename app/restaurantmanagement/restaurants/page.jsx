"use client";

import MenuCard from "./menuCard";
import React, { useState } from "react";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([
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
  ]);

  const [newItem, setNewItem] = useState({
    id: null,
    image: "",
    name: "",
    description: "",
    price: "",
    sizes: "",
    addOns: "",
    category: "",
    status: "Active",
  });

  const [editingItemId, setEditingItemId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) {
      alert("Name and Price are required!");
      return;
    }
    setMenuItems((prev) => [
      ...prev,
      {
        ...newItem,
        id: prev.length > 0 ? Math.max(...prev.map((item) => item.id)) + 1 : 1,
      },
    ]);
    clearForm();
  };

  const handleEditClick = (item) => {
    setEditingItemId(item.id);
    setNewItem({ ...item }); // Form füllt sich mit allen Infos
  };

  const handleUpdateItem = () => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === editingItemId ? { ...newItem } : item))
    );
    clearForm();
    setEditingItemId(null);
  };

  const handleDeleteItem = (id) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    if (editingItemId === id) {
      clearForm();
      setEditingItemId(null);
    }
  };

  const handleCancelEdit = () => {
    clearForm();
    setEditingItemId(null);
  };

  const clearForm = () => {
    setNewItem({
      id: null,
      image: "",
      name: "",
      description: "",
      price: "",
      sizes: "",
      addOns: "",
      category: "",
      status: "Active",
    });
  };

  return (
    <div className="p-6">
      {/* Add/Edit Item Form */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingItemId ? "Edit Menu Item" : "Add New Menu Item"}
        </h2>

        {/* Formular Felder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={newItem.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label htmlFor="price">Price (₺)</label>
            <input
              type="text"
              id="price"
              name="price"
              value={newItem.price}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label htmlFor="sizes">Sizes</label>
            <input
              type="text"
              id="sizes"
              name="sizes"
              value={newItem.sizes}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label htmlFor="addOns">Add-ons</label>
            <input
              type="text"
              id="addOns"
              name="addOns"
              value={newItem.addOns}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label htmlFor="category">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={newItem.category}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={newItem.status}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="image">Image URL</label>
            <input
              type="text"
              id="image"
              name="image"
              value={newItem.image}
              onChange={handleInputChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          {editingItemId ? (
            <>
              <button
                onClick={handleUpdateItem}
                className="py-2 px-4 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Update Item
              </button>
              <button
                onClick={handleCancelEdit}
                className="py-2 px-4 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleAddItem}
              className="py-2 px-4 rounded bg-orange-500 text-white hover:bg-orange-600"
            >
              Add Item
            </button>
          )}
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Menu Management</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <div key={item.id} className="relative">
            <MenuCard item={item} />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEditClick(item)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
