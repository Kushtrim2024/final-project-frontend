"use client";

export default function CSVExportButton({ data, headers }) {
  const handleDownload = () => {
    const csvRows = [];

    // Title
    const headerRow = headers.map((h) => `"${h.label}"`).join(",");
    csvRows.push(headerRow);

    // Data
    data.forEach((row) => {
      const values = headers.map((h) => `"${row[h.key]}"`);
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded shadow"
    >
      Generate Report (CSV)
    </button>
  );
}
