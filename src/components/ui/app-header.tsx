import { Link } from "@tanstack/react-router";
import { BarChart3, FileSpreadsheet, ScanText } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Analyze", icon: ScanText },
  { to: "/batch-upload", label: "Batch Upload", icon: FileSpreadsheet },
  { to: "/model-performance", label: "Model Performance", icon: BarChart3 },
] as const;

export function AppHeader({ active }: { active: (typeof navItems)[number]["to"] }) {
  return (
    <header className="border-b-2 border-foreground bg-card">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="भावSense home">
          <span className="grid size-10 place-items-center rounded-md bg-accent font-display text-xl text-accent-foreground shadow-[3px_3px_0_var(--ink)]">भा</span>
          <span><span className="block font-display text-xl leading-none">भावSense</span><span className="mt-1 block text-xs font-semibold text-muted-foreground">Hindi Sentiment Lab</span></span>
        </Link>
        <nav aria-label="Primary" className="grid grid-cols-3 gap-1 overflow-x-auto rounded-md border-2 border-foreground bg-secondary p-1 text-center text-xs font-bold sm:text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className={cn("flex min-w-max items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-muted-foreground", active === item.to && "bg-primary text-primary-foreground")}>
                <Icon className="size-4" />{item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}