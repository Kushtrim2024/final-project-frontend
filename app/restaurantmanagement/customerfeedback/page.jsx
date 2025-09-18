"use client";
import React, { useState, useEffect } from "react";
import { API_BASE } from "../../lib/api.js";
export default function FeedbackPage() {
  const [ratings, setRatings] = useState([]);
  const [responses, setResponses] = useState({}); // vorhandene Owner-Antworten
  const [replyInputs, setReplyInputs] = useState({}); // Eingaben für jede Bewertung
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState("");

  // Token nur im Browser auslesen
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setError("No token found. Please log in.");
      return;
    }
    setToken(storedToken);
  }, []);

  // Ratings laden
  useEffect(() => {
    if (!token) return;

    const fetchRatings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE}/owner/restaurants/my-restaurant/ratings?page=${page}&limit=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error fetching ratings");

        setRatings(data.ratings);
        setTotalPages(data.totalPages || 1);

        // Vorhandene Owner-Responses speichern
        const initialResponses = {};
        const initialInputs = {};
        data.ratings.forEach((r) => {
          if (r.ownerResponse) {
            initialResponses[r._id] = r.ownerResponse.text;
            initialInputs[r._id] = r.ownerResponse.text;
          }
        });
        setResponses(initialResponses);
        setReplyInputs(initialInputs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [token, page]);

  const handleReplyChange = (ratingId, value) => {
    setReplyInputs((prev) => ({ ...prev, [ratingId]: value }));
  };

  const submitOrUpdateResponse = async (ratingId) => {
    const responseText = replyInputs[ratingId];
    if (!responseText) return;

    const method = responses[ratingId] ? "PUT" : "POST";

    try {
      const res = await fetch(
        `${API_BASE}/owner/restaurants/my-restaurant/ratings/${ratingId}/response`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ response: responseText }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error submitting response");

      setResponses((prev) => ({ ...prev, [ratingId]: responseText }));
      setReplyInputs((prev) => ({ ...prev, [ratingId]: "" }));
      setMessage(
        method === "POST"
          ? "Response submitted successfully!"
          : "Response updated successfully!"
      );

      // Nachricht nach 3 Sekunden ausblenden
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;
  if (loading) return <p className="text-center mt-10">Loading ratings...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Customer Feedback</h1>

      {message && (
        <p className="text-green-600 font-semibold mb-4">{message}</p>
      )}

      {ratings.map((r) => (
        <div key={r._id} className="mb-6 border-b pb-4">
          <p>
            <span className="font-semibold">Anonymous</span> | Rating:{" "}
            {r.rating} / 5
          </p>
          <p className="mb-2">{r.comment}</p>

          <p className="font-semibold">Your Response:</p>
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              rows="2"
              value={replyInputs[r._id] ?? responses[r._id] ?? ""}
              onChange={(e) => handleReplyChange(r._id, e.target.value)}
              placeholder="Write your response..."
              className="w-full border p-2 rounded"
            />
            <button
              onClick={() => submitOrUpdateResponse(r._id)}
              className={`px-4 py-2 rounded text-white ${
                responses[r._id]
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-green-500 hover:bg-green-600"
              } transition-colors`}
            >
              {responses[r._id] ? "Update Response" : "Submit Response"}
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-3 py-1">
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
