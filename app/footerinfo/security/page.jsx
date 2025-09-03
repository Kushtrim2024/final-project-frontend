const Security = () => {
  return (
    <div className="min-h-screen container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Sicherheit bei Liefrik.de</h1>
      <p className="text-gray-700 mb-4">
        Sicherheit hat bei Liefrik.de höchste Priorität. Wir schützen deine
        Daten durch modernste Verschlüsselung und halten unsere Systeme stets
        auf dem neuesten Stand.
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>SSL-Verschlüsselung für alle Datenübertragungen</li>
        <li>Regelmäßige Sicherheitsupdates und Penetrationstests</li>
        <li>Datenschutzkonformes Handling deiner Informationen</li>
      </ul>
    </div>
  );
};

export default Security;
