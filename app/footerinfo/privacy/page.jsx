const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Privacy Policy</h1>
      <p className="text-gray-700 mb-4">
        We take privacy seriously. Here you can learn how we collect, store, and
        protect your data.
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>SSL-encrypted transmissions</li>
        <li>No sharing with third parties without consent</li>
        <li>User rights to access, delete, and correct their data</li>
      </ul>
    </div>
  );
};

export default Privacy;
