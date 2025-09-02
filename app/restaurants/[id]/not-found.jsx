import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-2xl font-bold">Restaurant not found</h1>
      <p className="mt-2 text-gray-600">
        The restaurant you’re looking for doesn’t exist.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-white"
      >
        ← Go Home
      </Link>
    </div>
  );
}
