"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BotSchematicType } from "@/lib/bots/types";

interface BacktestPanelProps {
  botType: BotSchematicType;
  envVars: Record<string, string>;
}

export function BacktestPanel({ botType, envVars }: BacktestPanelProps) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(fmt(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(fmt(today));
  const [capital, setCapital] = useState(10000);
  const [hasRun, setHasRun] = useState(false);

  const handleRunBacktest = () => {
    setHasRun(true);
    // Toast-like inline feedback — engine not yet wired
  };

  const envEntries = Object.entries(envVars).filter(([, v]) => v !== "");

  return (
    <Card className="border-border bg-[#0d0d0f]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">🧪 Backtest</CardTitle>
        <Badge variant="outline" className="text-xs text-[#00e5ff] border-[#00e5ff]/30">
          {botType}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#0d0d0f] border-border text-sm"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#0d0d0f] border-border text-sm"
            />
          </div>
        </div>

        {/* Initial Capital */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Initial Capital (USD)
          </label>
          <Input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="bg-[#0d0d0f] border-border text-sm"
            min={1}
          />
        </div>

        {/* Strategy Parameters */}
        {envEntries.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Strategy Parameters
            </label>
            <div className="rounded-lg border border-border bg-[#111113] p-3 space-y-1.5">
              {envEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-mono">
                    {key}
                  </span>
                  <span className="text-foreground font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="border-border" />

        {/* Run Button */}
        <Button
          onClick={handleRunBacktest}
          className="w-full bg-[#00e5ff] text-[#0d0d0f] hover:bg-[#00e5ff]/90 font-medium"
        >
          ▶ Run Backtest
        </Button>

        {/* Results Area */}
        <div className="space-y-3">
          {!hasRun ? (
            <div className="rounded-lg border border-border bg-[#111113] p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Run a backtest to see results here
              </p>
            </div>
          ) : (
            <>
              {/* Toast Message */}
              <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3 text-center">
                <p className="text-sm text-[#f59e0b]">
                  ⏳ Backtesting engine coming soon
                </p>
              </div>

              {/* Placeholder Chart */}
              <div
                className="h-40 rounded-lg border border-border flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,229,255,0.05) 0%, rgba(16,185,129,0.05) 50%, rgba(245,158,11,0.05) 100%)",
                }}
              >
                <span className="text-xs text-muted-foreground font-medium">
                  Chart
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Return", color: "text-[#10b981]" },
                  { label: "Sharpe Ratio", color: "text-[#00e5ff]" },
                  { label: "Max Drawdown", color: "text-[#f43f5e]" },
                  { label: "Win Rate", color: "text-[#f59e0b]" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border bg-[#111113] p-3 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className={`text-lg font-mono font-semibold ${stat.color}`}>
                      —
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
