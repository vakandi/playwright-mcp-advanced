# Quick Start - MCP Playwright Brave Edition

Get started with Brave Browser support for MCP Playwright in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Your Profile

**On Windows with Hot Sync**: No setup needed! The profile will be automatically synced on first launch, even if Brave is running.

**On macOS/Linux or if Hot Sync is disabled**: Close Brave browser first, then copy your profile manually (see [README-BRAVE.md](README-BRAVE.md) for details).

## 3. Create `.env` File

Create `.env` in project root:

```env
USE_BRAVE=true
BRAVE_EXECUTABLE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
BRAVE_PROFILE_PATH=C:\MCP_Brave_Profile
BRAVE_SOURCE_PROFILE=C:\Users\%USERNAME%\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default

# Hot sync is enabled by default (Windows only)
HOT_SYNC_ENABLED=true
```

**Adjust paths for your platform and Brave installation!**

## 4. Run It!

```bash
npm run brave
```

## 5. Configure MCP Client

### Cursor / VS Code

```json
{
  "mcpServers": {
    "playwright-brave": {
      "command": "node",
      "args": ["path/to/mcp-playwright-brave/cli-brave.js"],
      "env": {
        "USE_BRAVE": "true",
        "BRAVE_EXECUTABLE": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "BRAVE_PROFILE_PATH": "C:\\MCP_Brave_Profile"
      }
    }
  }
}
```

## Done! 🎉

Your MCP Playwright server is now using Brave Browser with your profile!

## Next Steps

- Read [README-BRAVE.md](README-BRAVE.md) for full documentation
- See [SETUP-WINDOWS.md](SETUP-WINDOWS.md) for detailed Windows setup

## Troubleshooting

**Brave not found?** Check `BRAVE_EXECUTABLE` path in `.env`

**Profile sync failed?** 
- On Windows: Hot sync should work automatically (Brave can be running)
- On macOS/Linux: Close Brave before syncing

**MCP not working?** Check that environment variables are set correctly

See full troubleshooting in [README-BRAVE.md](README-BRAVE.md)

## What's New

🔥 **Hot Sync**: On Windows, profile sync works even when Brave is running! No need to close Brave anymore.

