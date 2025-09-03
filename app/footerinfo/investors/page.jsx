const Investors = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Investoreninformationen</h1>
      <p className="text-gray-700 mb-4">
        Liefrik.de bietet Investoren eine transparente Übersicht über unser
        Geschäft, Wachstum und zukünftige Pläne. Wir informieren regelmäßig über
        Unternehmenszahlen und strategische Entwicklungen.
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Quartalsberichte und Finanzübersicht</li>
        <li>Unternehmensstrategie und Wachstumspläne</li>
        <li>Kontaktmöglichkeiten für Investorenanfragen</li>
      </ul>
      <p className="text-gray-700 mt-4">
        Für weitere Informationen kontaktieren Sie uns unter{" "}
        <strong>investors@liefrik.de</strong>.
      </p>
    </div>
  );
};

export default Investors;
