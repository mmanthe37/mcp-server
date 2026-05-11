"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  Globe,
  Bot,
  Compass,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Vote,
  BarChart3,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { useMobileSidebar } from "@/lib/store";

const ICONS: Record<string, React.ElementType> = {
  Terminal,
  Globe,
  Bot,
  Compass,
  Settings,
  LayoutDashboard,
  Vote,
  BarChart3,
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isOpen: mobileOpen, close: closeMobile } = useMobileSidebar();

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) closeMobile();
    },
    [mobileOpen, closeMobile]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen flex flex-col border-r border-border bg-surface transition-all",
          // Desktop: show normally with collapse support
          "hidden md:flex",
          collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]",
          // Mobile: overlay mode
          mobileOpen && "!flex w-[280px]"
        )}
        style={{ transitionDuration: "var(--duration)", transitionTimingFunction: "var(--ease-out)" }}
        aria-label="Main navigation sidebar"
      >
        {/* Logo + mobile close */}
        <div className="flex items-center h-[var(--topbar-height)] px-4 border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="font-semibold text-sm whitespace-nowrap">
                Crypto Dev
              </span>
            )}
          </div>
          {/* Mobile close button */}
          <button
            onClick={closeMobile}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 flex flex-col gap-1 p-2 mt-2" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const Icon = ICONS[icon];
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-label={`Navigate to ${label}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-muted text-primary"
                    : "text-text-muted hover:text-text hover:bg-surface-2"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {(!collapsed || mobileOpen) && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center h-12 border-t border-border text-text-dim hover:text-text transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </>
  );
}
