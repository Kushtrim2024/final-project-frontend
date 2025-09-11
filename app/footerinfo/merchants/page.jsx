const Merchants = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">For Merchants</h1>
      <p className="text-gray-700 mb-4">
        Join Liefrik.de and expand your restaurant or business to reach more
        customers. We help you increase your reach and manage your orders
        efficiently.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">More Customers</h3>
          <p className="text-gray-600">
            Reach customers in your city through our app.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Easy Management</h3>
          <p className="text-gray-600">
            Manage orders, delivery times, and promotions centrally on our
            platform.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Transparent Fees</h3>
          <p className="text-gray-600">
            No hidden costs – everything is clear and fairly calculated.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-gray-700 mb-4">
          Interested? Become a partner and increase your revenue today!
        </p>
        <a
          href="mailto:merchants@liefrik.de"
          className="inline-block bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
        >
          Become a Partner
        </a>
      </div>
    </div>
  );
};

export default Merchants;
