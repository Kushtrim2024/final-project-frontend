"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function RootLayoutWrapper({ children }) {
  const pathnameRaw = usePathname() || "/";

  const pathname = useMemo(() => {
    if (pathnameRaw.endsWith("/") && pathnameRaw !== "/") {
      return pathnameRaw.slice(0, -1);
    }
    return pathnameRaw;
  }, [pathnameRaw]);

  const visiblePaths = useMemo(
    () => [
      "/",
      "/footerinfo/about",
      "/footerinfo/couriers",
      "/footerinfo/jobs",
      "/footerinfo/security",
      "/footerinfo/investors",
      "/footerinfo/sustainability",
      "/footerinfo/contact",
      "/footerinfo/terms",
      "/footerinfo/privacy",
      "/footerinfo/merchants",
      "/footerinfo/affiliates",
      "/footerinfo/help",
      "/footerinfo/cities",
      "/footerinfo/cookies",
      "/footerinfo/accessibility",
      "/footerinfo/imprint",
    ],
    []
  );

  const isRestaurantDetail = useMemo(() => {
    return /^\/restaurants?\/[^/]+$/i.test(pathname);
  }, [pathname]);

  const shouldShowShell = useMemo(() => {
    if (isRestaurantDetail) return false;

    return visiblePaths.some(
      (p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/"))
    );
  }, [isRestaurantDetail, pathname, visiblePaths]);

  useEffect(() => {
    const el = document.documentElement;
    if (shouldShowShell) {
      el.classList.add("has-shell");
      el.classList.remove("no-shell");
    } else {
      el.classList.remove("has-shell");
      el.classList.add("no-shell");
    }
  }, [shouldShowShell]);

  return (
    <>
      {shouldShowShell && <Header />}

      <main className={shouldShowShell ? "shell-pad" : "no-pad"}>
        {children}
      </main>

      {shouldShowShell && <Footer />}

      <style jsx global>{`
        :root {
          --shell-header-h: 4rem; /* mobile varsayılan */
          --shell-footer-h: 0rem;
        }
        @media (min-width: 700px) {
          :root {
            --shell-header-h: 11rem; /* büyük header için */
          }
        }

        .shell-pad {
          padding-top: 9rem; /* istersen var(--shell-header-h) kullan */
          padding-bottom: var(--shell-footer-h);
          min-height: 100dvh;
        }

        .no-pad {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          min-height: 100dvh;
        }

        html.no-shell main > *:first-child {
          margin-top: 0 !important;
        }
      `}</style>
    </>
  );
}
