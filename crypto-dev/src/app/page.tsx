"use client";

import dynamic from "next/dynamic";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Terminal, Monitor } from "lucide-react";

const DevShell = dynamic(
  () => import("@/components/shell/DevShell").then((m) => m.DevShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[#0d0d0f]">
        <div className="text-cyan-400 font-mono text-sm animate-pulse flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Loading terminal...
        </div>
      </div>
    ),
  }
);

export default function DevShellPage() {
  return (
    <>
      <TopBar title="Developer Shell" />

      {/* Mobile notice — shown below md breakpoint */}
      <div className="flex md:hidden flex-1 items-center justify-center p-6">
        <div className="max-w-sm w-full rounded-xl bg-[var(--cd-surface)] border border-[var(--cd-border)] p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[var(--cd-cyan-dim)] flex items-center justify-center mb-4">
            <Monitor className="w-6 h-6 text-[var(--cd-cyan)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--cd-text)] mb-2">
            Desktop Recommended
          </h2>
          <p className="text-sm text-[var(--cd-text-muted)] leading-relaxed">
            DevShell works best on desktop. For the full terminal experience,
            please use a desktop browser.
          </p>
          <div className="mt-4 h-px bg-[var(--cd-border)]" />
          <p className="mt-3 text-xs text-[var(--cd-text-faint)]">
            Other pages like Dashboard, Ecosystems, and Bot Forge are fully
            available on mobile.
          </p>
        </div>
      </div>

      {/* Desktop shell content — hidden on mobile */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden p-4 gap-4">
        {/* Terminal container */}
        <div className="flex-1 rounded-lg bg-[var(--cd-surface)] border border-border overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-[var(--cd-surface-2)]">
            <Terminal size={14} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-mono text-text-muted">
              crypto-dev@shell:~$
            </span>
            <div className="ml-auto flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--cd-red)] opacity-60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--cd-amber)] opacity-60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--cd-green)] opacity-60" />
            </div>
          </div>
          <div className="flex-1">
            <DevShell sessionId="default" />
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="flex gap-3">
          {[
            { label: "Sessions", value: "0" },
            { label: "Commands", value: "0" },
            { label: "Aliases", value: "0" },
            { label: "API Keys", value: "0" },
          ].map((stat) => (
            <Card key={stat.label} className="flex-1 bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-mono text-primary">{stat.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
