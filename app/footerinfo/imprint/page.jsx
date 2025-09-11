const Imprint = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Imprint</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          Information according to § 5 TMG
        </h2>
        <p className="text-gray-700">
          Liefrik.de GmbH
          <br />
          Musterstraße 123
          <br />
          10115 Berlin, Germany
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Represented by</h2>
        <p className="text-gray-700">Max Mustermann (Managing Director)</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Contact</h2>
        <p className="text-gray-700">
          Phone: +49 30 12345678
          <br />
          Email: info@liefrik.de
          <br />
          Website: www.liefrik.de
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          Commercial Register Entry
        </h2>
        <p className="text-gray-700">
          Entry in the commercial register.
          <br />
          Register Court: Amtsgericht Berlin Charlottenburg
          <br />
          Register Number: HRB 123456
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">VAT ID</h2>
        <p className="text-gray-700">
          VAT identification number according to §27a of the German VAT Act:
          DE123456789
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Disclaimer</h2>
        <p className="text-gray-700">
          Despite careful content control, we assume no liability for the
          content of external links. The operators of the linked pages are
          solely responsible for their content.
        </p>
      </section>
    </div>
  );
};

export default Imprint;
