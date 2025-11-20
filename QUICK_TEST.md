# Quick Test Guide - MCP Playwright with curl

## 🚀 Fastest Way to Test

### Step 1: Start the Server (Terminal 1)

```powershell
cd mcp-playwright-brave
node cli-brave.js --port 8931
```

You should see output like:
```
[MCP-PLAYWRIGHT] 🔌 Extension mode: Connecting to existing browser
[MCP-PLAYWRIGHT] 🔌 No new browser instance will be launched
Server listening on http://localhost:8931
```

### Step 2: Test with curl (Terminal 2)

#### Windows PowerShell:
```powershell
# Initialize
curl.exe -X POST http://localhost:8931/mcp `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2024-11-05\",\"capabilities\":{},\"clientInfo\":{\"name\":\"test\",\"version\":\"1.0\"}}}'

# Ping
curl.exe -X POST http://localhost:8931/mcp `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"ping\"}'

# List tools
curl.exe -X POST http://localhost:8931/mcp `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/list\"}'
```

#### Or use the PowerShell script:
```powershell
.\test-mcp-http.ps1
```

#### Linux/Mac:
```bash
# Initialize
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Ping
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"ping"}'

# List tools
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/list"}'
```

## 📋 Expected Responses

### Initialize Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {...},
    "serverInfo": {
      "name": "playwright-mcp",
      "version": "..."
    }
  }
}
```

### Ping Response:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {}
}
```

### Tools List Response:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "tools": [
      {
        "name": "mcp_playwright-brave_browser_navigate",
        "description": "Navigate to a URL",
        ...
      },
      ...
    ]
  }
}
```

## 🧪 Test Navigation (Extension Mode)

If you have `USE_EXTENSION=true`, test navigation:

```powershell
curl.exe -X POST http://localhost:8931/mcp `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"mcp_playwright-brave_browser_navigate\",\"arguments\":{\"url\":\"https://example.com\"}}}'
```

This should:
1. Open a tab selector page in your existing Brave browser
2. Let you select which tab to control
3. Navigate to example.com in that tab

## 🔧 Troubleshooting

**Port already in use?**
```powershell
# Use a different port
node cli-brave.js --port 8932
```

**Server not starting?**
- Check `.env` file exists in project root
- Verify `USE_EXTENSION=true` is set
- Make sure Brave is running (for extension mode)

**Connection refused?**
- Make sure server is running in Terminal 1
- Check the port number matches
- Try `http://127.0.0.1:8931/mcp` instead

