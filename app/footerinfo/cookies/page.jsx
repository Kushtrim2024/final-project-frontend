const Cookies = () => {
  const cookies = [
    {
      type: "Essenzielle Cookies",
      description: "Notwendig für den Betrieb der App und Webseite.",
    },
    {
      type: "Analyse-Cookies",
      description:
        "Hilft uns, die Nutzung der Plattform zu verstehen und zu verbessern.",
    },
    {
      type: "Marketing-Cookies",
      description: "Werbezwecke und personalisierte Inhalte.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Cookie Policy</h1>
      <p className="text-gray-700 mb-8">
        Liefrik.de uses cookies to provide you with the best user experience.
        You can adjust your cookie settings at any time.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {cookies.map((cookie, idx) => (
          <div
            key={idx}
            className="bg-white/50 p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold mb-2">{cookie.type}</h3>
            <p className="text-gray-600">{cookie.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-gray-700">
          For more information, see our <strong>Privacy Policy</strong> or
          contact us at <strong>privacy@liefrik.de</strong>.
        </p>
      </div>
    </div>
  );
};
export default Cookies;
