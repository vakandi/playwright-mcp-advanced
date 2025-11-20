# How to Test MCP Playwright Server

## ✅ Setup Complete!

I've fixed the issues:
1. ✅ Installed `dotenv` module
2. ✅ Created `.env` file in project root with:
   ```
   USE_BRAVE=false
   USE_EXTENSION=true
   BRAVE_EXECUTABLE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
   ```

## 🚀 Quick Test Steps

### Step 1: Start the Server

Open **Terminal 1** and run:

```powershell
cd C:\Users\vakandi\Documents\projects\n8n\mcp-playwright-brave
node cli-brave.js --port 8931
```

**Expected output:**
```
[MCP-PLAYWRIGHT] 📄 Loaded .env from: C:\Users\vakandi\Documents\projects\n8n\.env
[MCP-PLAYWRIGHT] 🔌 Extension mode: Connecting to existing browser
[MCP-PLAYWRIGHT] 🔌 No new browser instance will be launched
[MCP-PLAYWRIGHT] 🔌 Make sure the Playwright MCP Bridge extension is installed in Brave
Listening on http://localhost:8931
```

### Step 2: Test with curl (Terminal 2)

Open **Terminal 2** and run:

```powershell
cd C:\Users\vakandi\Documents\projects\n8n\mcp-playwright-brave
.\test-curl-simple.ps1
```

**Or manually test:**

```powershell
# 1. Initialize
curl.exe -X POST http://localhost:8931/mcp `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2024-11-05\",\"capabilities\":{},\"clientInfo\":{\"name\":\"test\",\"version\":\"1.0\"}}}'

# 2. Ping
curl.exe -X POST http://localhost:8931/mcp `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"ping\"}'

# 3. List tools
curl.exe -X POST http://localhost:8931/mcp `
  -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  -d '{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/list\"}'
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

## 🔍 Troubleshooting

**Server says "Using standard Chromium" instead of extension mode?**
- Check that `.env` file exists in project root
- Verify `USE_EXTENSION=true` is set
- Make sure `dotenv` is installed: `cd mcp-playwright-brave && npm install`

**Connection refused?**
- Make sure server is running in Terminal 1
- Check port 8931 is not in use
- Try a different port: `node cli-brave.js --port 8932`

**Extension mode not working?**
- Make sure Brave browser is running
- Verify extension is installed: Open `brave://extensions/`
- Check extension is enabled in Brave

## 📝 Notes

- The server uses **HTTP mode** when `--port` is specified
- You **must** include `Accept: application/json, text/event-stream` header
- Always send `initialize` request first before other commands
- Extension mode connects to your **existing** Brave browser (no new instance)

