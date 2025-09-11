"use client";

import { useState } from "react";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending message...");

    try {
      const res = await fetch("http://localhost:5517/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Your message has been sent successfully!");
        setStatus("Message sent successfully!");
        setForm({ name: "", email: "", message: "" });
      } else {
        alert("❌ Failed to send message: " + data.message);
        setStatus("Failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error while sending message.");
      setStatus("Error while sending.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Contact</h1>
      <p className="text-gray-700 mb-6">
        We’d love to hear from you! Whether feedback, questions, or partnership
        requests – we’re here for you.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Address</h3>
          <p className="text-gray-600">Example Street 1, 12345 Berlin</p>

          <h3 className="text-xl font-semibold mt-4 mb-2">Phone & Email</h3>
          <p className="text-gray-600">+49 123 456 789</p>
          <p className="text-gray-600">info@liefrik.de</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/50 p-6 rounded-lg shadow space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-3 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border p-3 rounded"
            required
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={form.message}
            onChange={handleChange}
            className="w-full border p-3 rounded h-32"
            required
          ></textarea>
          <button
            type="submit"
            className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
          >
            Send Message
          </button>
        </form>
      </div>

      {status && <p className="mt-4 text-gray-700">{status}</p>}
    </div>
  );
};

export default Contact;
