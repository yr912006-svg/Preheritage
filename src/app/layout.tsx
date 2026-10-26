import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://preheritage.com"),
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
        url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200",
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
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200"],
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
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-ivory text-charcoal-900 selection:bg-gold-200 selection:text-charcoal-950">
        <CartProvider>
          <WishlistProvider>
            <AnnouncementBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
