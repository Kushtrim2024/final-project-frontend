const Affiliates = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">For Affiliates</h1>
      <p className="text-gray-700 mb-4">
        Earn commissions by referring Liefrik.de. Our affiliate program allows
        you to make money while introducing others to our platform.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Easy Sign-Up</h3>
          <p className="text-gray-600">
            Register as an affiliate in just a few minutes.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Tracking & Reports</h3>
          <p className="text-gray-600">
            Keep track of your referrals and earnings at any time.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Fair Commissions</h3>
          <p className="text-gray-600">
            Earn attractive commissions for every successful referral.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-gray-700 mb-4">
          Get started now and join our affiliate program!
        </p>
        <a
          href="mailto:affiliates@liefrik.de"
          className="inline-block bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
        >
          Sign Up Now
        </a>
      </div>
    </div>
  );
};

export default Affiliates;
