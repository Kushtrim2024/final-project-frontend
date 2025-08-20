import "./globals.css";
import RootLayoutWrapper from "./components/RootLayoutWrapper";

export const metadata = {
  title: "Liefrik",
  description: "Liefrik is a food ordering platform.",
  keywords: ["food", "ordering", "delivery", "restaurant"],
  authors: [
    { name: "Kushtrim Bilali" },
    { name: "Cihan Ünal" },
    { name: "Melissa Kebi" },
    { name: "Randy Born" },
  ],
  creator: "Kushtrim Bilali - Cihan Ünal - Melissa Kebi - Randy Born",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    android: "/android-chrome-192x192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white/50 text-[var(--foreground)] font-sans">
        <RootLayoutWrapper>{children}</RootLayoutWrapper>
      </body>
    </html>
  );
}
