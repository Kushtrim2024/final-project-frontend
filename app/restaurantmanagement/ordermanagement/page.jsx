"use client";

import { useEffect, useState } from "react";

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 4; // Anzahl der Bestellungen pro Seite

  useEffect(() => {
    const fetchOrders = async () => {
      // 30 Dummy-Bestellungen
      const dummyOrders = Array.from({ length: 30 }, (_, i) => ({
        id: 100 + i + 1,
        customerName: `Kunde ${i + 1}`,
        total: Math.floor(Math.random() * 50) + 10, // zwischen 10 und 60 €
        status: i % 2 === 0 ? "offen" : "abgeschlossen",
        items: [
          { name: "Pizza Margherita", quantity: 1, price: 10 },
          { name: "Cola", quantity: 2, price: 4 },
          { name: "Tiramisu", quantity: 1, price: 6 },
        ],
      }));

      setTimeout(() => {
        setOrders(dummyOrders);
        setLoading(false);
      }, 1000);
    };

    fetchOrders();
  }, []);

  if (loading)
    return <div className="p-6 text-lg font-medium">Lade Bestellungen...</div>;
  if (orders.length === 0)
    return (
      <div className="p-6 text-lg font-medium">
        Keine Bestellungen gefunden.
      </div>
    );

  // Pagination Berechnung
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Bestellungen</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Bestellung #{order.id}</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === "offen"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-700 mb-2 font-medium">
              Kunde: {order.customerName}
            </p>
            <p className="text-gray-700 mb-3 font-medium">
              Gesamt: €{order.total.toFixed(2)}
            </p>
            <div className="mb-2">
              <span className="font-semibold text-gray-800">Artikel:</span>
              <ul className="list-disc list-inside mt-3 text-gray-600">
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.name} - €{item.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <button className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer">
              Details anzeigen
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-8 gap-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg ${
            currentPage === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          « Zurück
        </button>

        <span className="font-medium">
          Seite {currentPage} von {totalPages}
        </span>

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg ${
            currentPage === totalPages
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          Weiter »
        </button>
      </div>
    </div>
  );
}
