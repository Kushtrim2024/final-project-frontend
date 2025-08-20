"use client";
import { useEffect, useState } from "react";
import { getOrders } from "../services/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrders()
      .then((data) => {
        // Alle Kategorien zusammenführen
        const allOrders = [
          ...(data.desserts || []),
          ...(data.drinks || []),
          ...(data.pasta || []),
        ];
        setOrders(allOrders);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p style={{ color: "red" }}>Fehler: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bestellungen</h1>
      {orders.length === 0 ? (
        <p>Keine Bestellungen vorhanden.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          }}
        >
          {orders.map((order) => (
            <div
              key={order.id + order.category} // sicherstellen, dass der key eindeutig ist
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={order.image || "/placeholder.png"} // Platzhalter falls kein Bild vorhanden
                alt={order.name}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <h3>{order.name}</h3>
              <p>
                <strong>Preis:</strong> {order.price} €
              </p>
              <p>
                <strong>Bewertung:</strong> {order.rating} ⭐
              </p>
              <p>
                <strong>Kategorie:</strong> {order.category}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
