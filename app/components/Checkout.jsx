"use client";

import { useState } from "react";

export default function Checkout({ cartItems, userId, restaurantId }) {
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleOrder = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const orderData = {
      userId,
      restaurantId,
      items: cartItems.map(({ id: productId, quantity }) => ({
        productId,
        quantity,
      })),
      totalPrice,
      address,
      paymentMethod,
    };

    try {
      const res = await fetch("http://localhost:5517/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        throw new Error("Bestellung fehlgeschlagen");
      }

      const data = await res.json();
      setSuccess("Bestellung erfolgreich erhalten! 🎉");
      console.log("Bestellung:", data);
      // Hier z.B. Warenkorb leeren, weiterleiten, etc.
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Bestellung abschicken</h2>

      <label className="block mb-2">
        Lieferadresse
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Deine Adresse"
        />
      </label>

      <label className="block mb-4">
        Zahlungsart
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="card">Kreditkarte</option>
          <option value="cash">Barzahlung</option>
        </select>
      </label>

      <button
        onClick={handleOrder}
        disabled={loading || !address}
        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Bestellung wird gesendet..." : "Bestellung absenden"}
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {success && <p className="mt-4 text-green-600">{success}</p>}
    </div>
  );
}
