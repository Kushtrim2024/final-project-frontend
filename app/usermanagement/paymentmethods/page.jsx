"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newMethod, setNewMethod] = useState({
    type: "Credit Card",
    cardType: "visa",
    details: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const creditCardOptions = ["Visa", "MasterCard"];
  const paymentOptions = ["Credit Card", "PayPal", "Apple Pay", "Google Pay"];

  const getIcon = (type, cardType) => {
    if (type === "Credit Card" && cardType) {
      switch (cardType.toLowerCase()) {
        case "visa":
          return "/visa.svg";
        case "mastercard":
          return "/mastercard.svg";
        default:
          return "/creditcard.svg";
      }
    }
    switch (type) {
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

  const mapTypeToBackend = {
    "Credit Card": "card",
    PayPal: "paypal",
    "Apple Pay": "applepay",
    "Google Pay": "googlepay",
  };

  // Load payment methods
  useEffect(() => {
    if (!token || !userId) return;

    fetch(`http://localhost:5517/cart/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.cart?.paymentMethods) {
          setPaymentMethods(data.cart.paymentMethods);
        }
      })
      .catch((err) => console.error("Error loading payment methods:", err));
  }, [token, userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = async () => {
    if (!newMethod.details.trim()) {
      alert("Bitte Zahlungsdetails eingeben!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5517/cart/choose-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          paymentMethod: mapTypeToBackend[newMethod.type],
          cardType:
            newMethod.type === "Credit Card" ? newMethod.cardType : undefined,
          details: newMethod.details,
        }),
      });

      if (!res.ok) throw new Error("Fehler beim Speichern!");

      const data = await res.json();
      setPaymentMethods(data.cart.paymentMethods || []);
      setNewMethod({ type: "Credit Card", cardType: "visa", details: "" });
      alert("Payment method added!");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Hinzufügen!");
    }
  };

  const handleDelete = (id) => {
    setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
    alert("Payment method removed!");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white shadow-lg rounded-lg p-6 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">My Payment Methods</h1>

      <div className="space-y-4 mb-6">
        {paymentMethods.length === 0 && <p>No payment methods saved.</p>}
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex justify-between items-center bg-gray-50 p-3 rounded border"
          >
            <div className="flex items-center gap-3">
              <Image
                src={getIcon(method.type, method.cardType)}
                alt={method.type}
                width={32}
                height={32}
              />
              <div>
                <p className="font-semibold">{method.type}</p>
                <p className="text-sm text-gray-600">
                  {method.details}{" "}
                  {method.cardType ? `(${method.cardType.toUpperCase()})` : ""}
                </p>
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

      {/* Custom Dropdown */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Add New Payment Method</h2>

        <div className="mb-3 relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full border p-2 flex items-center justify-between rounded-md"
          >
            <span className="flex items-center gap-2">
              <img src={getIcon(newMethod.type)} alt="" className="w-5 h-5" />
              {newMethod.type}
            </span>
            <span>▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute w-full bg-white border mt-1 rounded shadow-lg z-10">
              {paymentOptions.map((type) => (
                <div
                  key={type}
                  onClick={() => {
                    setNewMethod({ ...newMethod, type, cardType: "visa" });
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <img src={getIcon(type, null)} alt="" className="w-5 h-5" />
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>

        {newMethod.type === "Credit Card" && (
          <div className="mb-3">
            <label className="block text-sm font-medium">Card Type</label>
            <select
              value={newMethod.cardType}
              onChange={(e) =>
                setNewMethod({ ...newMethod, cardType: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              {creditCardOptions.map((c) => (
                <option key={c} value={c.toLowerCase()}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

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
