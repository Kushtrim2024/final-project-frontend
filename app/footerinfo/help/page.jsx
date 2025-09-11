const HelpCenter = () => {
  const faqs = [
    {
      question: "How can I place an order?",
      answer:
        "Simply select a restaurant in the app or on the website, choose your dishes, and click 'Order'.",
    },
    {
      question: "How can I track my order?",
      answer:
        "After placing an order, you can track the delivery in real-time via the app.",
    },
    {
      question: "What should I do if I have an issue with my order?",
      answer:
        "Contact our support through the app or by emailing support@liefrik.de.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">Help Center</h1>
      <p className="text-gray-700 mb-8">
        Here you’ll find answers to the most frequently asked questions about
        Liefrik.de.
      </p>

      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white/50 p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
            <p className="text-gray-600">{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-gray-700">
          If you have further questions, feel free to contact us at{" "}
          <strong>support@liefrik.de</strong>.
        </p>
      </div>
    </div>
  );
};

export default HelpCenter;
