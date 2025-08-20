"use client";
import React, { useEffect, useMemo, useState } from "react";

export default function SupportFeedbackPage() {
  const [activeTab, setActiveTab] = useState("tickets");

  // --- Tickets state ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tickets, setTickets] = useState([
    {
      id: 1,
      type: "Customer",
      subject: "Order delayed",
      status: "Open",
      date: "2025-08-10",
    },
    {
      id: 2,
      type: "Restaurant",
      subject: "Menu update request",
      status: "Pending",
      date: "2025-08-11",
    },
    {
      id: 3,
      type: "Customer",
      subject: "Wrong item delivered",
      status: "Resolved",
      date: "2025-08-09",
    },
  ]);

  // --- Feedbacks  ---
  const feedbacks = [
    {
      id: 1,
      user: "Cihan Ünal",
      rating: 5,
      type: "Positive",
      comment: "Great service!",
      date: "2025-08-12",
    },
    {
      id: 2,
      user: "Randy Born",
      rating: 2,
      type: "Complaint",
      comment: "Cold food",
      date: "2025-08-11",
    },
    {
      id: 3,
      user: "Meli Kebriari",
      rating: 4,
      type: "Suggestion",
      comment: "Add more vegan options",
      date: "2025-08-10",
    },
  ];

  // --- Team messages (ticket based) ---
  const [teamMessages, setTeamMessages] = useState({
    1: [
      {
        id: 1,
        sender: "Admin1",
        message: "Remember to check pending tickets.",
        date: "2025-08-12 10:30",
      },
    ],
    2: [
      {
        id: 2,
        sender: "SupportAgent",
        message: "Resolved order #453 complaint.",
        date: "2025-08-12 11:00",
      },
    ],
    3: [],
  });

  // --- Ticket detail & send message ---
  const [viewTicket, setViewTicket] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // --- FILTERED lists ---
  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(search.toLowerCase()) &&
        (statusFilter === "" || t.status === statusFilter)
    );
  }, [tickets, search, statusFilter]);

  // --- Tickets actions ---
  const handleToggleStatus = (ticketId) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: t.status === "Resolved" ? "Open" : "Resolved" }
          : t
      )
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !viewTicket) return;
    const ticketId = viewTicket.id;
    const nextId = teamMessages[ticketId]?.length
      ? Math.max(...teamMessages[ticketId].map((m) => m.id)) + 1
      : 1;

    setTeamMessages((prev) => ({
      ...prev,
      [ticketId]: [
        ...(prev[ticketId] || []),
        {
          id: nextId,
          sender: "You",
          message: newMessage,
          date: new Date().toISOString(),
        },
      ],
    }));
    setNewMessage("");
  };

  // PAGINATION

  // Tickets pagination
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsPageSize, setTicketsPageSize] = useState(6);
  const ticketsTotalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / ticketsPageSize)
  );
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  useEffect(() => {
    setTicketsPage((p) => clamp(p, 1, ticketsTotalPages));
  }, [filteredTickets.length, ticketsPageSize]);

  const pagedTickets = useMemo(() => {
    const start = (ticketsPage - 1) * ticketsPageSize;
    return filteredTickets.slice(start, start + ticketsPageSize);
  }, [filteredTickets, ticketsPage, ticketsPageSize]);

  // Feedback pagination
  const [fbPage, setFbPage] = useState(1);
  const [fbPageSize, setFbPageSize] = useState(6);
  const fbTotalPages = Math.max(1, Math.ceil(feedbacks.length / fbPageSize));

  useEffect(() => {
    setFbPage((p) => clamp(p, 1, fbTotalPages));
  }, [feedbacks.length, fbPageSize]);

  const pagedFeedbacks = useMemo(() => {
    const start = (fbPage - 1) * fbPageSize;
    return feedbacks.slice(start, start + fbPageSize);
  }, [feedbacks, fbPage, fbPageSize]);

  // Communication pagination (ticket thread list)
  const commThreads = useMemo(
    () => Object.entries(teamMessages),
    [teamMessages]
  );
  const [commPage, setCommPage] = useState(1);
  const [commPageSize, setCommPageSize] = useState(6);
  const commTotalPages = Math.max(
    1,
    Math.ceil(commThreads.length / commPageSize)
  );

  useEffect(() => {
    setCommPage((p) => clamp(p, 1, commTotalPages));
  }, [commThreads.length, commPageSize]);

  const pagedCommThreads = useMemo(() => {
    const start = (commPage - 1) * commPageSize;
    return commThreads.slice(start, start + commPageSize);
  }, [commThreads, commPage, commPageSize]);

  // When the tab changes, pull the relevant page to 1
  useEffect(() => {
    if (activeTab === "tickets") setTicketsPage(1);
    if (activeTab === "feedback") setFbPage(1);
    if (activeTab === "communication") setCommPage(1);
  }, [activeTab]);

  return (
    <div className="p-6">
      <h2 className="text-2xl text-gray-800 font-bold mb-6">
        Support & Feedback
      </h2>

      {/* Tab Menu */}
      <div className="flex gap-4 mb-6">
        {["tickets", "feedback", "communication"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab === "tickets" && "Support Tickets"}
            {tab === "feedback" && "Feedback & Complaints"}
            {tab === "communication" && "Team Communication"}
          </button>
        ))}
      </div>

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div>
          <div className="flex gap-4 mb-4 text-gray-800">
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setTicketsPage(1);
              }}
              className="border p-2 rounded w-1/3 text-gray-800"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTicketsPage(1);
              }}
              className="border p-2 rounded text-gray-800"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="relative rounded bg-white border border-gray-200">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full border-collapse border border-gray-300 text-gray-800">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border p-2">ID</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Subject</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border p-6 text-center text-gray-600"
                      >
                        No tickets.
                      </td>
                    </tr>
                  ) : (
                    pagedTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="border p-2">{ticket.id}</td>
                        <td className="border p-2">{ticket.type}</td>
                        <td className="border p-2">{ticket.subject}</td>
                        <td className="border p-2">{ticket.status}</td>
                        <td className="border p-2">{ticket.date}</td>
                        <td className="border p-2">
                          <button
                            onClick={() => setViewTicket(ticket)}
                            className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleToggleStatus(ticket.id)}
                            className={`px-2 py-1 rounded ${
                              ticket.status === "Resolved"
                                ? "bg-red-500 text-white"
                                : "bg-green-500 text-white"
                            }`}
                          >
                            {ticket.status === "Resolved"
                              ? "Not Solved"
                              : "Resolve"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Tickets */}
          <PaginationControls
            page={ticketsPage}
            setPage={setTicketsPage}
            pageSize={ticketsPageSize}
            setPageSize={setTicketsPageSize}
            totalItems={filteredTickets.length}
          />

          {/* Ticket Detail */}
          {viewTicket && (
            <div className="mt-6 p-4 border rounded bg-gray-50 text-gray-800">
              <h3 className="text-xl font-bold mb-2">Ticket Details</h3>
              <p>
                <strong>ID:</strong> {viewTicket.id}
              </p>
              <p>
                <strong>Type:</strong> {viewTicket.type}
              </p>
              <p>
                <strong>Subject:</strong> {viewTicket.subject}
              </p>
              <p>
                <strong>Status:</strong> {viewTicket.status}
              </p>
              <p>
                <strong>Date:</strong> {viewTicket.date}
              </p>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Team Communication</h4>
                <div className="border p-2 rounded bg-white max-h-40 overflow-y-auto mb-2">
                  {(teamMessages[viewTicket.id] || []).map((msg) => (
                    <div key={msg.id} className="mb-1">
                      <strong>{msg.sender}:</strong> {msg.message}{" "}
                      <span className="text-gray-500 text-sm">
                        ({msg.date})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="border p-2 rounded flex-grow text-gray-800"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-orange-500 text-white px-4 py-2 rounded"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Tab */}
      {activeTab === "feedback" && (
        <div>
          <div className="relative rounded bg-white border border-gray-200">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full border-collapse border border-gray-300 text-gray-800">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border p-2">ID</th>
                    <th className="border p-2">User</th>
                    <th className="border p-2">Rating</th>
                    <th className="border p-2">Type</th>
                    <th className="border p-2">Comment</th>
                    <th className="border p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedFeedbacks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border p-6 text-center text-gray-600"
                      >
                        No feedback.
                      </td>
                    </tr>
                  ) : (
                    pagedFeedbacks.map((fb) => (
                      <tr key={fb.id}>
                        <td className="border p-2">{fb.id}</td>
                        <td className="border p-2">{fb.user}</td>
                        <td className="border p-2">{fb.rating} ⭐</td>
                        <td className="border p-2">{fb.type}</td>
                        <td className="border p-2">{fb.comment}</td>
                        <td className="border p-2">{fb.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Feedback */}
          <PaginationControls
            page={fbPage}
            setPage={setFbPage}
            pageSize={fbPageSize}
            setPageSize={setFbPageSize}
            totalItems={feedbacks.length}
          />
        </div>
      )}

      {/* Communication Tab */}
      {activeTab === "communication" && (
        <div className="space-y-4">
          <div className="border p-4 rounded bg-white max-h-80 overflow-y-auto text-gray-800">
            {pagedCommThreads.length === 0 ? (
              <div className="text-gray-600">No threads.</div>
            ) : (
              pagedCommThreads.map(([ticketId, messages]) => (
                <div key={ticketId} className="mb-4">
                  <strong>Ticket #{ticketId}:</strong>
                  {messages.length === 0 ? (
                    <div className="text-gray-600"> (no messages)</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id}>
                        <strong>{msg.sender}:</strong> {msg.message}{" "}
                        <span className="text-gray-500 text-sm">
                          ({msg.date})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination - Communication */}
          <PaginationControls
            page={commPage}
            setPage={setCommPage}
            pageSize={commPageSize}
            setPageSize={setCommPageSize}
            totalItems={commThreads.length}
          />
        </div>
      )}
    </div>
  );
}

/* ===== Pagination Controls===== */
function PaginationControls({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-white mt-4 rounded">
      <div className="text-sm text-gray-800">
        Page <span className="font-semibold">{page}</span>&nbsp;/&nbsp;
        {totalPages}&nbsp;•&nbsp;
        <span className="font-semibold">{totalItems}</span>
        &nbsp;items
      </div>

      <div className="flex items-center gap-2 text-gray-800">
        <label className="text-sm text-gray-800 max-[750px]:hidden">
          Rows:
        </label>
        <select
          className="border rounded px-2 py-1"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          {[6, 12, 24, 48].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              aria-current={page === n ? "page" : undefined}
              className={`px-3 py-1 border rounded ${
                page === n ? "bg-gray-800 text-white" : "hover:bg-gray-100"
              } ${n !== 1 ? "max-[1150px]:hidden" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          {totalPages > 1 && (
            <span className="hidden max-[1150px]:inline-block px-2 select-none">
              …
            </span>
          )}
        </div>

        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
