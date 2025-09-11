const Sustainability = () => {
  const initiatives = [
    "Deliveries with electric vehicles",
    "Use of eco-friendly packaging",
    "Partnerships with sustainable restaurants",
    "Reducing food waste",
  ];

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Sustainability</h1>
      <p className="text-gray-700 mb-8">
        Sustainability is at the heart of our company strategy. We are committed
        to minimizing our environmental impact while supporting greener choices
        for our customers and partners.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {initiatives.map((item, idx) => (
          <div
            key={idx}
            className="bg-white/50 p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sustainability;
