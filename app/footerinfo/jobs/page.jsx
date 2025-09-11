const Jobs = () => {
  const positions = [
    { title: "Delivery Rider", location: "Berlin", type: "Full-Time" },
    {
      title: "Restaurant Partner Manager",
      location: "Hamburg",
      type: "Part-Time",
    },
    {
      title: "Customer Support Specialist",
      location: "Munich",
      type: "Full-Time",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">
        Jobs at Liefrik.de
      </h1>
      <p className="text-gray-700 mb-8">
        Join our team! We are looking for motivated individuals who want to help
        us improve the food delivery experience.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {positions.map((job, idx) => (
          <div
            key={idx}
            className="bg-white/50 p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
            <p className="text-gray-600">
              {job.location} – {job.type}
            </p>
            <button className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jobs;
