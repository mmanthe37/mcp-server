import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { registerTools } from "./tools.js";
import { registerWeb3Tools } from "./web3-tools.js";

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || "3000", 10);
const MAX_SESSIONS = 1000;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  lastActivity: number;
}

const sessions = new Map<string, SessionEntry>();

// Evict expired sessions every 60 seconds
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (now - entry.lastActivity > SESSION_TTL_MS) {
      entry.transport.close?.();
      sessions.delete(id);
    }
  }
}, 60_000);
cleanupInterval.unref();

async function createServer(): Promise<McpServer> {
  const server = new McpServer({
    name: "M37-MCP",
    version: "2.0.0",
  });
  registerTools(server);
  registerWeb3Tools(server);
  return server;
}

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", sessions: sessions.size });
});

// MCP endpoint — handles POST (messages), GET (SSE stream), DELETE (session close)
app.all("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (req.method === "POST" && !sessionId) {
    if (sessions.size >= MAX_SESSIONS) {
      res.status(503).json({ error: "Server at capacity, try again later" });
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transport.onclose = () => {
          sessions.delete(id);
        };
        sessions.set(id, {
          transport,
          server,
          lastActivity: Date.now(),
        });
      },
    });

    const server = await createServer();

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      // Clean up any registered session on failure
      for (const [id, entry] of sessions) {
        if (entry.transport === transport) {
          sessions.delete(id);
          break;
        }
      }
      transport.close?.();
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to initialize session" });
      }
    }
    return;
  }

  // Existing session
  if (sessionId) {
    const entry = sessions.get(sessionId);
    if (!entry) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    entry.lastActivity = Date.now();

    try {
      await entry.transport.handleRequest(req, res, req.body);
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ error: "Request handling failed" });
      }
    }
    return;
  }

  res.status(400).json({ error: "Missing mcp-session-id header" });
});

const httpServer = app.listen(PORT, "0.0.0.0", () => {
  console.log(`MCP server listening on http://0.0.0.0:${PORT}/mcp`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`${signal} received — shutting down gracefully`);
  clearInterval(cleanupInterval);

  httpServer.close(() => {
    // Close all active sessions
    for (const [id, entry] of sessions) {
      entry.transport.close?.();
      sessions.delete(id);
    }
    console.log("All sessions closed, exiting");
    process.exit(0);
  });

  // Force exit after 25s (Container Apps sends SIGKILL at 30s)
  setTimeout(() => {
    console.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 25_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
