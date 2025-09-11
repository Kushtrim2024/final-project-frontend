const About = () => {
  return (
    <div className="container mx-auto px-4 py-12 bg-white/70 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-red-500">About Liefrik.de</h1>
      <p className="text-gray-700 mb-4">
        Liefrik.de is the modern food delivery app for anyone who wants fresh
        food, drinks, and snacks delivered quickly to their home.
      </p>
      <p className="text-gray-700 mb-4">
        We work with local restaurants and guarantee fast delivery times and
        high quality.
      </p>
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
          <p className="text-gray-600">
            Orders are delivered in the shortest possible time.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Fresh Ingredients</h3>
          <p className="text-gray-600">
            We work only with verified restaurants and fresh ingredients.
          </p>
        </div>
        <div className="p-6 bg-white/50 rounded-lg shadow hover:shadow-lg transition">
          <h3 className="text-xl font-semibold mb-2">Easy App</h3>
          <p className="text-gray-600">
            Order in just a few clicks and track your delivery live.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
