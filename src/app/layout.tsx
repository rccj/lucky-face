import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LuckyFace - 智能幸運兒抽選器 | AI人臉識別隨機抽獎",
  description: "LuckyFace 智能幸運兒抽選器 - 上傳團體照片，AI自動偵測人臉，隨機選出幸運兒！完美適用於活動、聚會、團隊抽獎等場合。支援多人照片，公平公正的隨機選擇。",
  keywords: "幸運兒,抽獎,隨機選擇,人臉識別,AI,團體照,活動抽獎,LuckyFace",
  authors: [{ name: "LuckyFace Team" }],
  creator: "LuckyFace",
  publisher: "LuckyFace",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    alternateLocale: "en_US",
    siteName: "LuckyFace",
    title: "LuckyFace - 智能幸運兒抽選器 | AI人臉識別隨機抽獎",
    description: "上傳團體照片，AI自動偵測人臉，隨機選出幸運兒！完美適用於活動、聚會、團隊抽獎等場合。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "LuckyFace - 智能幸運兒抽選器"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "LuckyFace - 智能幸運兒抽選器",
    description: "AI人臉識別，隨機選出幸運兒！完美的活動抽獎工具。",
    images: ["/og-image.jpg"]
  },
  manifest: "/manifest.json",
  metadataBase: new URL('https://localhost:3000'),
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍀</text></svg>" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "LuckyFace",
              "alternateName": "智能幸運兒抽選器",
              "description": "AI人臉識別隨機抽獎工具，上傳團體照片自動偵測人臉並隨機選出幸運兒",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "LuckyFace Team"
              },
              "featureList": [
                "AI人臉自動識別",
                "隨機公正抽選",
                "支援多人照片",
                "即時結果顯示",
                "多語言支援"
              ],
              "screenshot": "/og-image.jpg",
              "softwareVersion": "0.0.20"
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
