import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";
import { TopNav } from "./top-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-6 px-6">
          <Link
            href="/"
            className="font-display text-xl tracking-tight text-foreground"
          >
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
