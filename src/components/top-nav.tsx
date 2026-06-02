"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, PenLine, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "录入", icon: PenLine },
  { href: "/library", label: "判断库", icon: Library },
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/settings", label: "设置", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {active && (
              <span className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-foreground" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
