import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "ZeroShot",
  description: "올클을 위한 간편한 서버시간 알리미",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr" className={`${pretendard.variable}`}>
      <body className={pretendard.className}>
        <main className="w-screen flex flex-col justify-center items-center">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
