import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Script from "next/script";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

const baseUrl = 'https://zeroshot.kr';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "제로샷 - 올클을 위한 서버시간 타이머",
    template: "%s | 제로샷"
  },
  description: "실시간 서버시간 확인, 반응속도 테스트를 한 번에. 티켓팅과 수강신청을 위한 필수 도구, ZeroShot에서 시작하세요.",
  keywords: [
    "서버시간",
    "서버시간 확인",
    "티켓팅",
    "티켓팅 팁",
    "티켓팅 꿀팁",
    "수강신청",
    "수강신청 꿀팁",
    "수강신청 팁",
    "반응속도",
    "반응속도 테스트",
    "웹사이트 성능",
    "시간 동기화",
    "올클",
    "올클리어",
    "예매",
    "인터파크",
    "멜론티켓",
    "예스24",
    "서울과학기술대학교"
  ],
  authors: [
    {
      name: "ZeroShot Team",
      url: baseUrl,
    },
  ],
  creator: "ZeroShot Team",
  publisher: "ZeroShot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
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
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: baseUrl,
    title: "ZeroShot - 올클을 위한 서버시간 타이머",
    description: "실시간 서버시간 확인, 반응속도 테스트를 한 번에. 티켓팅과 수강신청을 위한 필수 도구, ZeroShot에서 시작하세요.",
    siteName: "ZeroShot",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("ZeroShot")}`,
        width: 1200,
        height: 630,
        alt: "ZeroShot - 올클을 위한 서버시간 타이머",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeroShot - 올클을 위한 서버시간 타이머",
    description: "실시간 서버시간 확인, 반응속도 테스트를 한 번에. 티켓팅과 수강신청을 위한 필수 도구, ZeroShot에서 시작하세요.",
    images: [`${baseUrl}/api/og?title=${encodeURIComponent("ZeroShot")}`],
    creator: "@zeroshot",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  other: {
    "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const naverAnalyticsId = process.env.NEXT_PUBLIC_NAVER_ANALYTICS_ID || "";

  return (
    <html lang="ko" className={`${pretendard.variable}`}>
      <head>
        <meta name="naver-site-verification" content="948d6c2395ab2547cf7ddfb2336857782525aa23" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Schema.org structured data for better search engine understanding */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ZeroShot",
              "description": "실시간 서버시간 확인, 반응속도 테스트를 한 번에. 티켓팅과 수강신청을 위한 필수 도구, ZeroShot에서 시작하세요.",
              "url": baseUrl,
              "applicationCategory": "WebApplication",
              "operatingSystem": "Any",
              "featureList": [
                "실시간 서버시간 확인",
                "반응속도 테스트",
                "웹사이트 성능 분석",
                "티켓팅 도우미",
                "수강신청 도우미"
              ],
            })
          }}
        />

        {/* Naver Analytics */}
        {naverAnalyticsId && (
          <Script
            id="naver-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if(!wcs_add) var wcs_add = {};
                wcs_add["wa"] = "${naverAnalyticsId}";
                if(window.wcs) {
                  wcs_do();
                }
              `
            }}
          />
        )}
      </head>
      <body className={pretendard.className}>
        <div className="bg-white relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 px-2 md:px-8 flex flex-col items-center justify-center py-2 md:py-10">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
