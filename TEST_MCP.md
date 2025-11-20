# Testing MCP Playwright Server Directly

## Quick Test Methods

### Method 1: HTTP Mode (Easiest - Use curl!)

The Playwright MCP server supports HTTP mode, which makes it easy to test with curl.

#### Step 1: Start the MCP server in HTTP mode

```bash
cd mcp-playwright-brave
node cli-brave.js --port 8931
```

Or with npm:
```bash
cd mcp-playwright-brave
npm run brave -- --port 8931
```

#### Step 2: Test with curl

Once the server is running, open a **new terminal** and test it:

```bash
# Test 1: Initialize the connection
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'

# Test 2: Ping
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "ping"
  }'

# Test 3: List available tools
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/list"
  }'

# Test 4: Navigate to a page
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "mcp_playwright-brave_browser_navigate",
      "arguments": {
        "url": "https://example.com"
      }
    }
  }'
```

### Method 2: Interactive Test Script

Use the interactive test script for easier testing:

```bash
cd mcp-playwright-brave
node test-mcp-interactive.js
```

This gives you an interactive prompt where you can type commands:
- `init` - Initialize connection
- `ping` - Ping the server
- `tools` - List available tools
- `{json}` - Send raw JSON
- `help` - Show help
- `exit` - Quit

### Method 3: Direct Test Script

Run a quick automated test:

```bash
cd mcp-playwright-brave
node test-mcp-direct.js
```

This will:
1. Start the MCP server
2. Send an initialize request
3. Send a ping
4. Show all output
5. Exit after 5 seconds

## Environment Setup

Make sure your `.env` file is in the project root with:

```env
USE_BRAVE=false
USE_EXTENSION=true
BRAVE_EXECUTABLE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
```

## Testing Extension Mode

When `USE_EXTENSION=true`:
1. Make sure Brave is running
2. Make sure the Playwright MCP Bridge extension is installed
3. Start the MCP server
4. When you navigate to a page, it should open a tab selector in your existing Brave browser

## Troubleshooting

**Server won't start?**
- Check that Node.js 18+ is installed: `node --version`
- Check that dependencies are installed: `cd mcp-playwright-brave && npm install`

**Extension mode not working?**
- Verify extension is installed: Open `brave://extensions/`
- Check that `USE_EXTENSION=true` in `.env`
- Make sure Brave is running

**HTTP mode not working?**
- Make sure you're using `--port 8931` flag
- Check that port 8931 is not already in use
- Try a different port: `--port 8932`

## Example: Full Test Session

```bash
# Terminal 1: Start the server
cd mcp-playwright-brave
node cli-brave.js --port 8931

# Terminal 2: Test it
curl -X POST http://localhost:8931/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Should return something like:
# {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{...},"serverInfo":{"name":"playwright-mcp","version":"..."}}}
```

