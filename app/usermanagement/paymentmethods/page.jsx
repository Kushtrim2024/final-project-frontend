"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newMethod, setNewMethod] = useState({
    type: "Credit Card",
    details: "",
  });

  const getIcon = (type) => {
    switch (type) {
      case "Credit Card":
        return "/creditcard.svg";
      case "PayPal":
        return "/paypal.svg";
      case "Apple Pay":
        return "/applepay.svg";
      case "Google Pay":
        return "/googlepay.svg";
      default:
        return "/creditcard.svg";
    }
  };

  // Load payment methods (later from API)
  useEffect(() => {
    const demoPayments = [
      { id: 1, type: "Credit Card", details: "**** **** **** 1234" },
      { id: 2, type: "PayPal", details: "user@example.com" },
    ];
    setPaymentMethods(demoPayments);
  }, []);

  const handleAdd = () => {
    if (!newMethod.details.trim()) {
      alert("Please enter payment details");
      return;
    }
    const newItem = { id: Date.now(), ...newMethod };
    setPaymentMethods([...paymentMethods, newItem]);
    setNewMethod({ type: "Credit Card", details: "" });
    alert("Payment method added!");
  };

  const handleDelete = (id) => {
    setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
    alert("Payment method removed!");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-lg rounded-lg p-6 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">My Payment Methods</h1>

      {/* List of payment methods */}
      <div className="space-y-4 mb-6">
        {paymentMethods.length === 0 && <p>No payment methods saved.</p>}
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex justify-between items-center bg-gray-50 p-3 rounded border"
          >
            <div className="flex items-center gap-3">
              <Image
                src={getIcon(method.type)}
                alt={method.type}
                width={32}
                height={32}
              />
              <div>
                <p className="font-semibold">{method.type}</p>
                <p className="text-sm text-gray-600">{method.details}</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(method.id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add new payment method */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Add New Payment Method</h2>

        <label className="block text-sm font-medium">Type</label>
        <select
          value={newMethod.type}
          onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border mb-3"
        >
          <option>Credit Card</option>
          <option>PayPal</option>
          <option>Apple Pay</option>
          <option>Google Pay</option>
        </select>

        <label className="block text-sm font-medium">Details</label>
        <input
          type="text"
          value={newMethod.details}
          onChange={(e) =>
            setNewMethod({ ...newMethod, details: e.target.value })
          }
          placeholder={
            newMethod.type === "Credit Card"
              ? "Card number (will be masked)"
              : "Account email"
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border mb-3"
        />

        <button
          onClick={handleAdd}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Payment Method
        </button>
      </div>
    </div>
  );
}
