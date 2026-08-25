"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Palette,
  Users,
  Settings,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Artisans", href: "/artisans", icon: Palette },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink text-ivory">
      <div className="flex h-16 items-center border-b border-ivory/10 px-6">
        <Link href="/" className="font-display text-xl tracking-[0.28em] font-semibold">
          KALAKRITI<span className="text-gold">.</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-terracotta text-ivory"
                  : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory"
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ivory/10 px-6 py-4">
        <p className="text-xs text-ivory/40">Signed in as</p>
        <p className="mt-1 text-sm font-medium">Admin</p>
      </div>
    </aside>
  );
}
