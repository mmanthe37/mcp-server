"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BacktestPanel } from "./BacktestPanel";
import type { BotSchematicType } from "@/lib/bots/types";

interface BacktestDialogProps {
  botType: BotSchematicType;
  envVars: Record<string, string>;
}

export function BacktestDialog({ botType, envVars }: BacktestDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10"
        onClick={() => setOpen(true)}
      >
        🧪 Backtest
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0d0d0f] border-border">
          <DialogHeader>
            <DialogTitle>Strategy Backtester</DialogTitle>
          </DialogHeader>
          <BacktestPanel botType={botType} envVars={envVars} />
        </DialogContent>
      </Dialog>
    </>
  );
}
