#!/bin/bash
# M37 MCP Server - local launcher
# Run this to start the web3/crypto MCP server on localhost:3000
PID_FILE="/tmp/m37-mcp.pid"
LOG_FILE="/tmp/m37-mcp.log"

if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
  echo "M37-MCP already running (PID $(cat $PID_FILE))"
  exit 0
fi

cd "$(dirname "$0")"
nohup node dist/server.js > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
echo "M37-MCP started (PID $!) → http://localhost:3000/mcp"
echo "Logs: $LOG_FILE"
