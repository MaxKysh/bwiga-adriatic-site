import type { Metadata } from "next";
import { Inter } from "next/font/google";
import content from "@/data/content.json";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// -----------------------------------------------------------------------------
// SEO / social metadata.
//
// `metadataBase` is a placeholder — swap it for the real canonical URL once
// the site goes live on Vercel. Until then, OG / Twitter image URLs resolve
// against this base when crawlers fetch the page from a deploy preview, so
// keep it pointed at *some* https origin (relative paths in `images` get
// prefixed with this).
//
// `title`, `description`, og.image, etc. are mirrored across regular meta,
// Open Graph and Twitter tags so all three audiences (Google, Facebook /
// LinkedIn, Twitter / X) get matching previews.
// -----------------------------------------------------------------------------
const SITE_TITLE =
  "BWiGA Adriatic Edition — Balkan Web3 & iGaming Awards · September 30, 2026";
// Pulled from content.json (hero.tagline_primary) so the description stays
// in sync with the page's headline subtitle — single source of truth.
const SITE_DESCRIPTION = content.hero.tagline_primary;
const SITE_NAME = "BWiGA Adriatic Edition";
// TODO: replace with the real canonical origin after the Vercel deploy.
const SITE_URL = "https://bwiga-adriatic.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "BWiGA Adriatic Edition — Balkan Web3 & iGaming Awards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

// -----------------------------------------------------------------------------
// Schema.org Event JSON-LD. Inlined as a <script type="application/ld+json">
// in <body> (per Google's structured-data guidance — head or body both work).
// Image is an absolute URL so search engines / rich previews can resolve it
// without depending on the request origin.
// -----------------------------------------------------------------------------
const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "BWiGA Adriatic Edition",
  description: "Balkan Web3 & iGaming Awards · Adriatic Edition",
  startDate: "2026-09-30T14:00:00+02:00",
  endDate: "2026-09-30T23:00:00+02:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "Avala Resort & Villas",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Mediteranska 2",
      addressLocality: "Budva",
      addressCountry: "ME",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "Lead Volume",
    url: "https://lead-volume.com",
  },
  image: `${SITE_URL}/og-image.jpg`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <script
          type="application/ld+json"
          // Stringify once at render time. dangerouslySetInnerHTML is the
          // standard React pattern for injecting JSON-LD — we control the
          // payload entirely, so no XSS surface.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      </body>
    </html>
  );
}
