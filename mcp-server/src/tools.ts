import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hostname, platform, arch, uptime, totalmem, freemem } from "node:os";

export function registerTools(server: McpServer): void {
  // Echo tool — returns whatever text is sent
  server.tool(
    "echo",
    "Echoes back the provided message. Useful for testing connectivity.",
    { message: z.string().describe("The message to echo back") },
    async ({ message }) => ({
      content: [{ type: "text", text: message }],
    })
  );

  // Timestamp tool — returns the current server time
  server.tool(
    "get_timestamp",
    "Returns the current UTC timestamp from the server.",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            utc: new Date().toISOString(),
            unix: Math.floor(Date.now() / 1000),
          }),
        },
      ],
    })
  );

  // System info tool — returns server environment details
  server.tool(
    "system_info",
    "Returns information about the server environment (hostname, platform, memory, uptime).",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              hostname: hostname(),
              platform: platform(),
              arch: arch(),
              uptimeSeconds: Math.floor(uptime()),
              totalMemoryMB: Math.floor(totalmem() / 1024 / 1024),
              freeMemoryMB: Math.floor(freemem() / 1024 / 1024),
              nodeVersion: process.version,
            },
            null,
            2
          ),
        },
      ],
    })
  );

  // Calculator tool — evaluates basic arithmetic
  server.tool(
    "calculate",
    "Performs basic arithmetic: add, subtract, multiply, divide.",
    {
      operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The arithmetic operation"),
      a: z.number().describe("First operand"),
      b: z.number().describe("Second operand"),
    },
    async ({ operation, a, b }) => {
      let result: number;
      switch (operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0) {
            return {
              content: [{ type: "text", text: "Error: Division by zero" }],
              isError: true,
            };
          }
          result = a / b;
          break;
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ operation, a, b, result }),
          },
        ],
      };
    }
  );
}
