export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="h-64 w-full animate-pulse rounded-2xl bg-gray-200" />
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
