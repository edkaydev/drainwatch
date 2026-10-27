import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LanguageProvider } from "@/components/layout/language-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DrainWatch AI — Smarter Drainage, Safer Kampala",
    template: "%s — DrainWatch AI",
  },
  description:
    "AI-assisted drainage hazard reporting and hotspot intelligence for a flood-resilient Kampala.",
  applicationName: "DrainWatch AI",
  keywords: [
    "drainage",
    "Kampala",
    "flooding",
    "hotspots",
    "civic technology",
    "Uganda",
  ],
  openGraph: {
    type: "website",
    siteName: "DrainWatch AI",
    title: "DrainWatch AI — Smarter Drainage, Safer Kampala",
    description:
      "Report drainage hazards, surface hotspots, and help Kampala prioritise flood-resilience work.",
    url: "/",
    images: [
      {
        url: "/drainwatch-hero-kampala.jpg",
        width: 1920,
        height: 1080,
        alt: "A community member and field inspector examining a blocked drainage channel in Kampala",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DrainWatch AI — Smarter Drainage, Safer Kampala",
    description:
      "AI-assisted drainage hazard reporting and hotspot intelligence for a flood-resilient Kampala.",
    images: ["/drainwatch-hero-kampala.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d211e",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-full bg-teal-900 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
