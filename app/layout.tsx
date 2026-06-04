import type { Metadata } from "next";
import { Inter } from "next/font/google";
import content from "@/data/content.json";
import Preloader from "@/components/Preloader";
import ScrollReveal from "@/components/ScrollReveal";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// -----------------------------------------------------------------------------
// SEO / social metadata.
//
// `metadataBase` — canonical production domain. Used by Next.js to resolve
// relative URLs in metadata into absolute ones (required by crawlers like
// Telegram / Facebook / Twitter that fetch metadata server-side and can't
// guess the origin).
//
// `title`, `description`, og.image, etc. are mirrored across regular meta,
// Open Graph and Twitter tags so all three audiences (Google, Facebook /
// LinkedIn, Twitter / X) get matching previews.
//
// OG_IMAGE_PATH — путь к открытому графу. Telegram/Facebook/LinkedIn
// кэшируют OG-картинку отдельно от страницы, и query-параметры (?v=N)
// у них ненадёжно пробивают image-cache. Самый верный способ обновить
// превью — переименовать файл целиком, тогда URL становится полностью
// новым, и crawler гарантированно делает свежий fetch.
// -----------------------------------------------------------------------------
const SITE_TITLE =
  "BWiGA Adriatic Edition — Balkan Web3 & iGaming Awards · September 30, 2026";
// Pulled from content.json (hero.tagline_primary) so the description stays
// in sync with the page's headline subtitle — single source of truth.
const SITE_DESCRIPTION = content.hero.tagline_primary;
const SITE_NAME = "BWiGA Adriatic Edition";
const SITE_URL = "https://www.adriaticawards.com";
const OG_IMAGE_PATH = "/og-cover.jpg";

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
        url: OG_IMAGE_PATH,
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
    images: [OG_IMAGE_PATH],
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
  image: `${SITE_URL}${OG_IMAGE_PATH}`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Preload hero-poster — это LCP-кандидат на mobile (full-bleed bg
            image на hero, ~309 KB). С preload + fetchPriority="high"
            браузер начинает качать его в первой же группе запросов,
            опережая non-critical assets. На desktop эффект слабее, но
            тоже полезен. */}
        <link
          rel="preload"
          as="image"
          href="/img/hero-poster.jpg"
          fetchPriority="high"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {/* Preloader первым ребёнком body — рендерится в SSR с inline-
            стилями, виден immediate'но при доставке HTML. Гаснет когда
            window.load + 500ms прошло. */}
        <Preloader />
        {/* Scroll-reveal — навешивает fade-up на секции ниже фолда после
            монтажа. На Hero/StatsPanel не влияет (они в начальном viewport
            и пропускаются). */}
        <ScrollReveal />
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
