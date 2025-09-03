"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function RootLayoutWrapper({ children }) {
  // Next App Router context'inde güvenli
  const pathnameRaw = usePathname() || "/";

  // sondaki / işaretini (ana sayfa hariç) kaldır
  const pathname = useMemo(() => {
    if (pathnameRaw.endsWith("/") && pathnameRaw !== "/") {
      return pathnameRaw.slice(0, -1);
    }
    return pathnameRaw;
  }, [pathnameRaw]);

  /** SADECE BU SAYFALARDA GÖSTER: */
  const visiblePaths = useMemo(
    () => [
      "/", // ana sayfa
      "/footerinfo/about",
      "/footerinfo/couriers",
      "/footerinfo/job",
      "/footerinfo/security",
      "/footerinfo/investors",
      "/footerinfo/sustainability",
    ],
    []
  );

  // /restaurant/:id veya /restaurants/:id detaylarını İSTEMİYORSAN gizle:
  const isRestaurantDetail = useMemo(() => {
    return /^\/restaurants?\/[^/]+$/i.test(pathname);
  }, [pathname]);

  const shouldShowShell = useMemo(() => {
    if (isRestaurantDetail) return false;

    // listedeki pathlerle birebir eşleşme veya onların alt yolları
    return visiblePaths.some(
      (p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/"))
    );
  }, [isRestaurantDetail, pathname, visiblePaths]);

  /** <html>’e bayrak class bas (global CSS kolay kontrol için) */
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
      {/* Header yalnızca izin verilen sayfalarda */}
      {shouldShowShell && <Header />}

      {/* İçerik: header/footer görünüyorsa üst/alt padding ver, değilse sıfır */}
      <main className={shouldShowShell ? "shell-pad" : "no-pad"}>
        {children}
      </main>

      {/* Footer yalnızca izin verilen sayfalarda */}
      {shouldShowShell && <Footer />}

      {/* Global yardımcı stiller */}
      <style jsx global>{`
        :root {
          /* Header ve Footer yüksekliğini buradan yönet (responsive de yapabiliriz) */
          --shell-header-h: 4rem; /* mobile varsayılan */
          --shell-footer-h: 0rem;
        }
        @media (min-width: 700px) {
          :root {
            --shell-header-h: 11rem; /* büyük header için */
          }
        }

        /* Header/Footer göründüğünde içeriğe güvenli boşluk */
        .shell-pad {
          padding-top: 10rem; /* istersen var(--shell-header-h) kullan */
          padding-bottom: var(--shell-footer-h);
          min-height: 100dvh;
        }

        /* Shell yoksa hiçbir extra boşluk bırakma */
        .no-pad {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          min-height: 100dvh;
        }

        /* İlk çocukta yanlışlıkla kalan margin'leri temizlemek için */
        html.no-shell main > *:first-child {
          margin-top: 0 !important;
        }
      `}</style>
    </>
  );
}
