"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "서버시간", href: "/" },
  { name: "반응속도", href: "/reaction" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full">
      <div className="p-2 md:px-8 md:py-3 flex w-full items-center justify-between">
        <div className="mr-4 flex">
          <div className="flex flex-row items-center gap-2 mr-3">
            <Link href="/" passHref legacyBehavior>
              <Image src='/zeroshot_logo.png' alt="logo of zeroshot" width={24} height={24} />
            </Link>
            <p className="text-md font-semibold tracking-tight text-neutral-900">ZeroShot</p>
          </div>
          {/* <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav> */}
        </div>
        <div>
          <Button variant="outline" className="flex-1 rounded-full" asChild>
            <Link href="mailto:0x7dec@gmail.com">피드백</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
