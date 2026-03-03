import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MahjNearMe — Find Mahjong Games Anywhere You Go",
    template: "%s | MahjNearMe",
  },
  description:
    "Find mahjong games, open play sessions, lessons, and events anywhere in the United States. The only directory of pickup mahjong games across the US.",
  keywords: [
    "mahjong near me",
    "mahjong games",
    "mah jongg near me",
    "mahjongg near me",
    "mahjong open play",
    "find mahjong",
    "mahjong groups",
    "american mahjong",
    "mahjong lessons",
    "mahjong events",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MahjNearMe",
    title: "MahjNearMe — Find Mahjong Games Anywhere You Go",
    description:
      "The only directory of pickup mahjong games, open play, and events across the US. Search by city or use GPS to find games near you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MahjNearMe — Find Mahjong Games Anywhere You Go",
    description:
      "The only directory of pickup mahjong games, open play, and events across the US.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[family-name:var(--font-sans)] text-slate-800 bg-white antialiased">
        <AuthProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
