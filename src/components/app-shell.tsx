import Link from "next/link";
import { Scale } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";
import { TopNav } from "./top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Scale className="h-5 w-5" />
            判断日志
          </Link>
          <TopNav />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
