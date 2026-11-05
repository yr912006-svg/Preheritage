import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "./",
  },
  title: {
    default: "PREHERITAGE | Wear the Stories of India",
    template: "%s | PREHERITAGE",
  },
  description:
    "Don’t Just Wear Heritage. Carry It Forward. Handcrafted Indian sarees, Katan silk, Pashmina shawls, Chanderi kurtas, Gota Patti lehengas, and GI-certified heritage treasures.",
  keywords: [
    "Preheritage",
    "Indian Luxury Fashion",
    "Varanasi Katan Silk Saree",
    "Handloom Sarees",
    "Kashmir Pashmina Shawl",
    "Gota Patti Lehenga",
    "Chanderi Kurta",
    "Handcrafted Indian Clothing",
    "Wear the Stories of India",
  ],
  authors: [{ name: "PREHERITAGE", url: "https://preheritage.com" }],
  creator: "PREHERITAGE",
  publisher: "PREHERITAGE",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://preheritage.com",
    title: "PREHERITAGE | Wear the Stories of India",
    description: "Don’t Just Wear Heritage. Carry It Forward. Many Stories. One Thread.",
    siteName: "PREHERITAGE",
    images: [
      {
        url: "/images/og-share.jpg",
        width: 1200,
        height: 630,
        alt: "PREHERITAGE Luxury Indian Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PREHERITAGE | Wear the Stories of India",
    description: "Indian Soul. Global Luxury. Timeless Elegance.",
    images: ["/images/og-share.jpg"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-ivory text-charcoal-900 selection:bg-gold-200 selection:text-charcoal-950 font-sans">
        {children}
      </body>
    </html>
  );
}
