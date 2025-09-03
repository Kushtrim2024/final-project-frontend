// pages/accessibility.jsx
import React from "react";

const Accessibility = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Barrierefreiheit</h1>
      <p className="text-gray-700 mb-4">
        Liefrik.de ist bestrebt, eine Website zu bieten, die für alle Benutzer
        zugänglich ist, einschließlich Menschen mit Behinderungen. Wir achten
        auf:
      </p>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Klare Navigation und Struktur</li>
        <li>Unterstützung von Bildschirmlesern</li>
        <li>Kontrastreiche Farben für bessere Lesbarkeit</li>
        <li>Alternativtexte für Bilder</li>
      </ul>
      <p className="text-gray-700 mt-4">
        Wenn Sie Probleme beim Zugriff auf Inhalte haben, kontaktieren Sie uns
        bitte unter <strong>info@liefrik.de</strong>.
      </p>
    </div>
  );
};

export default Accessibility;
