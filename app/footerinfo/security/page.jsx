const Security = () => {
  const measures = [
    "SSL-encrypted data transmission",
    "Two-factor authentication",
    "Secure storage of customer data",
    "Regular security updates",
  ];

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Security</h1>
      <p className="text-gray-700 mb-8">
        We place the highest importance on the security of our platform and your
        data.
      </p>

      <ul className="space-y-4">
        {measures.map((item, idx) => (
          <li
            key={idx}
            className="bg-white/50 p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Security;
