"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 md:px-8 flex flex-row h-14 items-center justify-between text-sm">
        <p className="text-foreground/60">
          © 2024 ZeroShot. All rights reserved.
        </p>
        <div className="flex items-center space-x-4">
          <Link
            href="mailto:0x7dec@gmail.com"
            rel="noopener noreferrer"
            className="text-foreground/60 hover:text-foreground/80 transition-colors"
          >
            문의하기
          </Link>
          <Link
            href="https://vynn.pro"
            className="text-foreground/60 hover:text-foreground/80 transition-colors"
          >
            제작자
          </Link>
        </div>
      </div>
    </footer>
  );
}
