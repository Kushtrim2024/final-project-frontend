// app/page.js
import { Suspense } from "react";
import Home from "./components/Home.jsx";

export const dynamic = "force-dynamic"; // avoid prerendering "/"
export const revalidate = 0; // no ISR for this page

export default function Page() {
  return (
    <Suspense
      fallback={<div className="p-4 text-sm text-gray-700">Loading…</div>}
    >
      <Home />
    </Suspense>
  );
}
