const Jobs = () => {
  const jobList = [
    {
      title: "Fahrer / Lieferant (m/w/d)",
      location: "Berlin",
      description: "Zustellung von Paketen und Bestellungen an unsere Kunden.",
    },
    {
      title: "Kundenservice-Mitarbeiter (m/w/d)",
      location: "Home Office / Berlin",
      description: "Betreuung unserer Kunden per Telefon und E-Mail.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Karriere bei Liefrik.de</h1>
      <div className="space-y-6">
        {jobList.map((job, index) => (
          <div
            key={index}
            className="p-6 border rounded-lg shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
            <p className="text-gray-500 mb-2">{job.location}</p>
            <p>{job.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jobs;
