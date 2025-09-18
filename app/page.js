import React, { Suspense } from "react";

import Home from "./components/Home";
import LoaderOverlay from "./components/LoaderOverlay";

export default function HomePage() {
  return (
    <Suspense fallback={<LoaderOverlay text="Loading..." />}>
      <Home />
    </Suspense>
  );
}
