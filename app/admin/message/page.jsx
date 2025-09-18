// app/admin/message/page.jsx
import { MongoClient } from "mongodb";

/**
 * Make this route render at runtime (no prerender),
 * and ensure it runs on the Node.js runtime so "net"/"tls" are available.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function MessagesPage() {
  const uri = process.env.MONGODB_URI || "";
  if (!uri) {
    throw new Error("Missing MONGODB_URI");
  }

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const db = client.db("liefrik");
    const messages = await db
      .collection("messages")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="mb-6 text-4xl font-bold text-red-500">Admin – News</h1>
        <ul className="space-y-4">
          {messages.map((msg) => (
            <li key={String(msg._id)} className="rounded bg-white p-4 shadow">
              <p>
                <strong>{msg.name}</strong> ({msg.email})
              </p>
              <p>{msg.message}</p>
              <p className="text-sm text-gray-400">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  } finally {
    await client.close();
  }
}
