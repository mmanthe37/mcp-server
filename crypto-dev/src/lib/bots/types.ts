export type BotSchematicType =
  | "arbitrage"
  | "mev"
  | "signal"
  | "scraper"
  | "social"
  | "ai-chat"
  | "sniper"
  | "liquidation"
  | "copy-trade"
  | "rebalancer";

export interface WizardQuestion {
  id: string;
  label: string;
  type: "text" | "select" | "toggle" | "number";
  options?: string[];
  required: boolean;
  envKey: string;
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

export interface BotSchematic {
  type: BotSchematicType;
  name: string;
  icon: string;
  description: string;
  dockerImage: string;
  envTemplate: Record<string, string>;
  questions: WizardQuestion[];
}

export interface BotInstance {
  id: string;
  name: string;
  schematicType: BotSchematicType;
  status: "deploying" | "running" | "paused" | "stopped" | "error";
  taskArn?: string;
  chain: string;
  envVars: Record<string, string>;
  createdAt: number;
  uptime?: string;
  pnl?: string;
}

export interface DeployBotRequest {
  schematicType: BotSchematicType;
  name: string;
  chain: string;
  envVars: Record<string, string>;
}

export interface DeployBotResponse {
  success: boolean;
  taskArn?: string;
  botId?: string;
  error?: string;
}
