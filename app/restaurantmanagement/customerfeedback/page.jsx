"use client";
import React, { useState } from "react";

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Feedback submitted:", formData);

    // Hier kannst du den API-Call einbauen, z.B.:
    // await fetch("/api/feedback", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(formData),
    // });

    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="max-w-xl mx-auto p-4 text-gray-800">
      <h2 className="text-xl font-bold mb-4">Feedback</h2>
      <p className="mb-4">
        We value your opinion! Please share your feedback with us.
      </p>

      {submitted && (
        <div className="p-3 mb-4 bg-green-100 text-green-800 rounded">
          Thank you for your feedback!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />

        <textarea
          name="message"
          placeholder="Your Feedback"
          value={formData.message}
          onChange={handleChange}
          required
          rows="5"
          className="w-full border p-2 rounded"
        ></textarea>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send Feedback
        </button>
      </form>
    </div>
  );
}
