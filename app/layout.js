import "./globals.css";
import RootLayoutWrapper from "./components/RootLayoutWrapper";
import AuthProvider from "./components/auth-provider";
import Providers from "./components/Providers";
import { Suspense } from "react";
import Localhost5517Patch from "./components/Localhost5517Patch";

export const metadata = {
  /* ...senin metadata... */
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white/50 font-sans">
        {/* Wrap EVERYTHING that might use router hooks */}
        <Suspense
          fallback={<div className="p-4 text-sm text-gray-700">Loading…</div>}
        >
          <Providers>
            <RootLayoutWrapper>
              <AuthProvider>
                <Localhost5517Patch />
                <div className="min-h-[35rem]">{children}</div>
              </AuthProvider>
            </RootLayoutWrapper>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
