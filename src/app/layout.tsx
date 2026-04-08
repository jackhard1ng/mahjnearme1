import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageViewTracker from "@/components/PageViewTracker";
import PromoBanner from "@/components/PromoBanner";
import InAppBrowserWarning from "@/components/InAppBrowserWarning";
import { GOOGLE_ADS_ID } from "@/lib/gtag";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MahjNearMe | Find Mahjong Games Anywhere You Go",
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
  metadataBase: new URL("https://www.mahjnearme.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.mahjnearme.com",
    siteName: "MahjNearMe",
    title: "MahjNearMe | Find Mahjong Games Anywhere You Go",
    description:
      "The only directory of pickup mahjong games, open play, and events across the US. Search by city or use GPS to find games near you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MahjNearMe | Find Mahjong Games Anywhere You Go",
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#e8577a" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-[family-name:var(--font-sans)] text-charcoal bg-softpink-200 antialiased">
        {/* Google Ads (gtag.js) — loaded on every page so conversion events
            and remarketing audiences are available site-wide. */}
        {GOOGLE_ADS_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-ads-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', ${JSON.stringify(GOOGLE_ADS_ID)});
              `}
            </Script>
          </>
        )}
        <AuthProvider>
          <InAppBrowserWarning />
          <PromoBanner />
          <PageViewTracker />
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
