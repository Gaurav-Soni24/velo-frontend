import type React from "react"
import type { Metadata, Viewport } from "next"
import { Archivo, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://velo-frontend.vercel.app").replace(/\/$/, "")

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Velo Admin | Stand control room",
    template: "%s | Velo Admin",
  },
  description: "Admin dashboard for Velo, the RFID smart cycle-sharing system: live fleet status, RFID taps, rentals and camera alerts. Sign-in required.",
  applicationName: "Velo Admin",
  authors: [{ name: "Gaurav Soni", url: "https://gauravsoni.space" }],
  // A private control room: keep it out of search results.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: {
    type: "website",
    siteName: "Velo Admin",
    title: "Velo Admin | Stand control room",
    description: "Live fleet, rides, RFID taps and camera alerts for every Velo stand. Sign-in required.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Velo Admin: Stand control room" }],
  },
  twitter: { card: "summary_large_image", title: "Velo Admin | Stand control room", images: ["/og.png"] },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#0B1236",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
