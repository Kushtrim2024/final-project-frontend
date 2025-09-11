const Investors = () => {
  const reports = [
    { quarter: "Q1 2025", link: "#" },
    { quarter: "Q2 2025", link: "#" },
    { quarter: "Q3 2025", link: "#" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Investors</h1>
      <p className="text-gray-700 mb-8">
        Information for investors and partners of Liefrik.de.
      </p>

      <ul className="space-y-4">
        {reports.map((report, idx) => (
          <li
            key={idx}
            className="bg-white/50 p-4 rounded-lg shadow hover:shadow-lg transition flex justify-between items-center"
          >
            <span>{report.quarter} Report</span>
            <a href={report.link} className="text-red-500 hover:underline">
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Investors;
