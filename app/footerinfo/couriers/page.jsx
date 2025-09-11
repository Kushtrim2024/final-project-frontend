const Couriers = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">For Couriers</h1>
      <p className="text-gray-700 mb-4">
        Liefrik.de offers drivers flexible opportunities to join our delivery
        network. Earn money by delivering orders reliably and quickly.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Flexible Working Hours</h3>
          <p className="text-gray-600">
            Work when you want – full-time, part-time, or on-demand.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Fair Payment</h3>
          <p className="text-gray-600">
            Earn per delivery or per hour with transparent rates.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Support & Safety</h3>
          <p className="text-gray-600">
            Our app supports you with every delivery and protects your data.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-gray-700 mb-4">
          Interested? Apply now and become part of our growing delivery team!
        </p>
        <a
          href="mailto:drivers@liefrik.de"
          className="inline-block bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
};

export default Couriers;
