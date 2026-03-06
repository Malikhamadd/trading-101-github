"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const mainLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/markets", label: "Markets" },
  { href: "/charts", label: "Charts" },
  { href: "/bot", label: "Bot" },
  { href: "/signals", label: "Signals" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/strategy", label: "Strategy" },
  { href: "/research", label: "Research" },
  { href: "/news", label: "News" },
  { href: "/profile", label: "Profile" },
  { href: "/support", label: "Support" },
  { href: "/confluences", label: "Create Confluences" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
		<div className="flex h-screen bg-background text-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-shrink-0 border-r border-slate-800 bg-surface p-4 md:flex md:flex-col">
        <div className="mb-6 text-lg font-semibold tracking-tight">Trading 101</div>
        <nav className="flex-1 space-y-1 text-sm">
          {mainLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-md px-3 py-2 transition-colors ${
                  active
                    ? "bg-slate-800 text-sky-300"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-sky-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300">
          Bot status: <span className="font-semibold text-emerald-400">Paused</span>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-surface/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="text-base font-semibold md:hidden">Trading 101</div>
          <div className="hidden text-sm text-slate-300 md:block">
            Markets & Bot Trading PWA
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden rounded-full bg-slate-800 px-3 py-1 md:inline-flex">
              Search markets
            </span>
            <span className="h-8 w-8 rounded-full bg-slate-700" />
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 flex border-t border-slate-800 bg-surface px-2 py-1 text-xs text-slate-300 md:hidden">
          {mainLinks.slice(0, 5).map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center justify-center rounded-md px-2 py-1 ${
                  active ? "text-sky-300" : "text-slate-400"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
