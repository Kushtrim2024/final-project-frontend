"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newMethod, setNewMethod] = useState({
    type: "Credit Card",
    cardType: "visa",
    details: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [token, setToken] = useState(null);

  const creditCardOptions = ["Visa", "MasterCard"];
  const paymentOptions = ["Credit Card", "PayPal", "Apple Pay", "Google Pay"];

  // Mapping: Frontend → Backend
  const mapTypeToBackend = {
    "Credit Card": "card",
    PayPal: "paypal",
    "Apple Pay": "applepay",
    "Google Pay": "googlepay",
  };

  // ✅ Icon passend zum Backend-Typ
  const getIcon = (type, cardType) => {
    switch (type) {
      case "card":
        if (cardType?.toLowerCase() === "visa") return "/visa.svg";
        if (cardType?.toLowerCase() === "mastercard") return "/mastercard.svg";
        return "/creditcard.svg";
      case "paypal":
        return "/paypal.svg";
      case "applepay":
        return "/applepay.svg";
      case "googlepay":
        return "/googlepay.svg";
      default:
        return "/creditcard.svg";
    }
  };

  // 🔑 Token laden
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  // ✅ Payment Methods laden nach Login
  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:5517/user/payment-methods", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API response:", data);
        if (data?.paymentMethods) {
          setPaymentMethods(data.paymentMethods);
        } else {
          console.warn("No paymentMethods in response");
        }
      })
      .catch(console.error);
  }, [token]);

  // Add new payment method
  const handleAdd = async () => {
    if (!token) return alert("Token missing! Please log in again.");
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (["PayPal", "Apple Pay", "Google Pay"].includes(newMethod.type)) {
      if (!validateEmail(newMethod.details))
        return alert("Invalid email address");
    }

    try {
      const res = await fetch("http://localhost:5517/user/add-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: mapTypeToBackend[newMethod.type],
          cardType:
            newMethod.type === "Credit Card" ? newMethod.cardType : undefined,
          cardNumber:
            newMethod.type === "Credit Card" ? newMethod.details : undefined,
          expiryDate:
            newMethod.type === "Credit Card" ? newMethod.expiryDate : undefined,
          email:
            newMethod.type !== "Credit Card" ? newMethod.details : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Could not save!");

      // ✅ Liste aktualisieren
      setPaymentMethods(data.paymentMethods);

      // Reset Input
      setNewMethod({ type: "Credit Card", cardType: "visa", details: "" });
    } catch (err) {
      console.error(err);
      alert("Could not add!");
    }
  };

  // Payment Method löschen
  const handleDelete = async (methodId) => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5517/user/delete-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ methodId }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Could not delete!");

      setPaymentMethods(data.paymentMethods || []);
    } catch (err) {
      console.error(err);
      alert("Could not delete!");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white/70 shadow-lg rounded-lg p-6 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">My Payment Methods</h1>

      {/* Gespeicherte Methoden */}
      <div className="space-y-4 mb-6">
        {paymentMethods.length === 0 && <p>No payment methods saved.</p>}
        {paymentMethods.map((method, index) => (
          <div
            key={method._id || index}
            className="flex justify-between items-center bg-white/50 p-3 rounded border"
          >
            <div className="flex items-center gap-3">
              <Image
                src={getIcon(method.type, method.cardType)}
                alt={method.type}
                width={40}
                height={40}
                className="object-contain"
              />
              <div>
                <p className="font-semibold">
                  {method.type === "card"
                    ? "Credit Card"
                    : method.type.charAt(0).toUpperCase() +
                      method.type.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                  {method.type === "card"
                    ? `**** **** **** ${method.last4}`
                    : method.email}
                  {method.cardType ? ` (${method.cardType.toUpperCase()})` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(method._id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Neue Zahlungsmethode */}
      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Add New Payment Method</h2>

        {/* Dropdown */}
        <div className="mb-3 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full border p-2 flex items-center justify-between rounded-md"
          >
            <span className="flex items-center gap-2">
              <Image
                width={20}
                height={20}
                src={getIcon(
                  mapTypeToBackend[newMethod.type],
                  newMethod.cardType
                )}
                alt=""
                className="w-5 h-5 object-contain"
              />
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
                  <Image
                    width={20}
                    height={20}
                    src={getIcon(mapTypeToBackend[type])}
                    alt=""
                    className="w-5 h-5 object-contain"
                  />
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credit Card Eingabe */}
        {newMethod.type === "Credit Card" && (
          <>
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

            <input
              type="text"
              value={newMethod.details}
              onChange={(e) =>
                setNewMethod({ ...newMethod, details: e.target.value })
              }
              placeholder="Card number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border mb-3"
            />

            <label className="block text-sm font-medium">
              Expiry Date (MM/YY)
            </label>
            <input
              type="text"
              value={newMethod.expiryDate || ""}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "");
                if (val.length > 2) {
                  val = val.slice(0, 2) + "/" + val.slice(2, 4);
                }
                setNewMethod({ ...newMethod, expiryDate: val.slice(0, 5) });
              }}
              placeholder="MM/YY"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border mb-3"
            />
          </>
        )}

        {/* Alternative Methoden */}
        {["PayPal", "Apple Pay", "Google Pay"].includes(newMethod.type) && (
          <>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={newMethod.details}
              onChange={(e) =>
                setNewMethod({ ...newMethod, details: e.target.value })
              }
              placeholder="Account email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border mb-3"
            />
          </>
        )}

        <button
          onClick={handleAdd}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
        >
          Add Payment Method
        </button>
      </div>
    </div>
  );
}
