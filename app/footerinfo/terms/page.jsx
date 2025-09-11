const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Terms of Service</h1>
      <p className="text-gray-700 mb-4">
        Welcome to Liefrik.de. These Terms of Service govern your use of our
        platform. By accessing or using our services, you agree to comply with
        these terms.
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Orders are for personal use only.</li>
        <li>You are responsible for keeping your account details private.</li>
        <li>Liefrik.de is not responsible for third-party content.</li>
      </ul>

      <p className="text-gray-700 mt-6">
        Please read these terms carefully. If you do not agree, you may not use
        our platform. For any questions, contact us at{" "}
        <strong>legal@liefrik.de</strong>.
      </p>
    </div>
  );
};

export default Terms;
