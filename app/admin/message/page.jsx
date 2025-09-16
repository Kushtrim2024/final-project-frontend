import { MongoClient } from "mongodb";

export default async function MessagesPage() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("liefrik");
  const messages = await db
    .collection("messages")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  await client.close();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-red-500 mb-6">Admin – News</h1>
      <ul className="space-y-4">
        {messages.map((msg) => (
          <li key={msg._id.toString()} className="bg-white p-4 rounded shadow">
            <p>
              <strong>{msg.name}</strong> ({msg.email})
            </p>
            <p>{msg.message}</p>
            <p className="text-sm text-gray-400">
              {new Date(msg.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
