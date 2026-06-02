import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  href?: string;
  hint?: string;
};

export function StatCard({ label, value, icon: Icon, href, hint }: Props) {
  const inner = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-xl bg-card p-6 ring-1 ring-foreground/5 transition-colors",
        href && "hover:ring-primary/40 hover:bg-accent",
      )}
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      <div className="font-display text-4xl text-foreground sm:text-5xl">
        {value}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
