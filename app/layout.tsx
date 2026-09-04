import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/providers";
import { env } from "@/config/env";
import { getModeCookie } from "@/features/mode/server-actions";
import { CookieConsent } from "@/components/CookieConsent";
import { BackToTop } from "@/components/BackToTop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#060608",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "JobNest — Find What You Need Nearby",
    template: "JobNest — %s",
  },
  description: "Find local gigs, jobs, trusted people and professional opportunities with JobNest.",
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: {
      default: "JobNest — Find What You Need Nearby",
      template: "JobNest — %s",
    },
    description: "Find local gigs, jobs, trusted people and professional opportunities with JobNest.",
    url: env.NEXT_PUBLIC_APP_URL,
    siteName: "JobNest",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JobNest Open Graph",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobNest — Find What You Need Nearby",
    description: "Find local gigs, jobs, trusted people and professional opportunities with JobNest.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const initialMode = await getModeCookie();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-card text-foreground px-4 py-2 rounded-md shadow-luxury outline-none border border-primary/50 text-sm font-medium"
        >
          Skip to main content
        </a>
        <AppProviders initialMode={initialMode}>
          {children}
          <CookieConsent />
          <BackToTop />
        </AppProviders>
      </body>
    </html>
  );
}
