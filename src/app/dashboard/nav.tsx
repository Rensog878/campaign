"use client";

import { CalendarClock, LayoutDashboard, MessagesSquare, Settings, SquarePen, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/messages", label: "Message log", icon: MessagesSquare },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: CalendarClock },
  { href: "/dashboard/templates", label: "Templates", icon: SquarePen },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function isActive(path: string, href: string) {
  return href === "/dashboard" ? path === href : path.startsWith(href);
}

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
            isActive(path, href) ? "bg-white/10 font-medium text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
          )}
        >
          <Icon className={cn("size-4", isActive(path, href) && "text-emerald-400")} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
            isActive(path, href) ? "bg-white/15 text-white" : "text-white/60",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
