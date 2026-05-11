"use client";

import { Wallet, Wifi, WifiOff, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileSidebar } from "@/lib/store";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { open: openSidebar } = useMobileSidebar();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[var(--topbar-height)] px-4 md:px-6 border-b border-border glass">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={openSidebar}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Network status indicator */}
        <div
          className="flex items-center gap-1.5 text-xs text-text-dim"
          aria-label="Network status: connected to Mainnet"
          role="status"
        >
          <Wifi className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          <span className="hidden sm:inline">Mainnet</span>
        </div>

        {/* Wallet connect button */}
        <button
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
            "bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          )}
          aria-label="Connect wallet"
        >
          <Wallet className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Connect</span>
        </button>
      </div>
    </header>
  );
}
