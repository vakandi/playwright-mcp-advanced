# ⚠️ Extension Not Connected!

The MCP server is trying to connect to the Playwright MCP Bridge extension, but it's timing out.

## Quick Fix:

### 1. Make sure extension is built:
```powershell
cd mcp-playwright-brave\extension
npm run build
```

### 2. Install extension in Brave:
1. Open Brave
2. Go to `brave://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select: `C:\Users\vakandi\Documents\projects\n8n\mcp-playwright-brave\extension\dist`

### 3. Verify extension is enabled:
- Check that "Playwright MCP Bridge" shows in your extensions list
- Make sure it's **enabled** (toggle should be ON)

### 4. Restart Cursor:
- Close Cursor completely
- Reopen it
- The MCP server will reconnect and should find the extension

## Test it:
After installing, try navigating again - it should open a tab selector page in Brave where you can choose which tab to control!

