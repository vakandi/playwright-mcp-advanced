# Playwright MCP Server - Brave Edition

> **🔥 Forget about MCP Puppeteer, MCP BrowserMCP - they all suck!**  
> **Playwright is the most stable one from hundreds of hours of testing.**  
> **Now it has all your accounts available, extensions, and bookmarks.**  
> **Cursor now has access to all your life. Enjoy! 🚀**

A custom fork of the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) that uses **Brave Browser** instead of Chromium, with support for persistent user profiles and automatic profile syncing.

## Features

- 🦁 **Brave Browser Support**: Uses Brave browser executable instead of Chromium
- 📁 **Persistent Profiles**: Uses a cloned copy of your Brave profile for session persistence
- 🔄 **Profile Sync**: Automatic syncing of your Brave profile before launch (always enabled)
- 🔥 **Hot Sync** (Windows): Syncs profile even when Brave is running - no need to close Brave!
- ✅ **Safe Checks**: Detects if Brave is already running and uses appropriate sync method
- 🔧 **Easy Configuration**: Simple environment variables or `.env` file configuration
- 🌐 **Full MCP Compatibility**: All MCP Playwright APIs continue to work normally

## Requirements

- Node.js 18 or newer
- Brave Browser installed on your system
- Windows, macOS, or Linux

## Installation

### 1. Clone or Download This Repository

```bash
git clone <your-repo-url> mcp-playwright-brave
cd mcp-playwright-brave
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Brave Browser Settings

Create a `.env` file in the project root (or copy `.env.example`):

```env
# Enable Brave browser
USE_BRAVE=true

# Path to Brave executable (Windows default shown)
BRAVE_EXECUTABLE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe

# Path to cloned Brave profile for MCP (must be different from your actual profile)
BRAVE_PROFILE_PATH=C:\MCP_Brave_Profile

# Optional: Path to your original Brave profile (for syncing)
BRAVE_SOURCE_PROFILE=C:\Users\%USERNAME%\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default

# Optional: Sync profile on startup (true/false) - DEPRECATED: Profile sync is now always enabled
SYNC_PROFILE_ON_STARTUP=false

# Optional: Enable hot sync when Brave is running (Windows only, default: true)
HOT_SYNC_ENABLED=true

# Optional: Number of retry attempts for locked files (default: 5)
SYNC_RETRY_COUNT=5

# Optional: Delay between retries in seconds (default: 2)
SYNC_RETRY_DELAY=2
```

### 4. Set Up Your Brave Profile (One-Time Setup)

**On Windows with Hot Sync**: You don't need to close Brave! The profile will be automatically synced on first launch.

**On macOS/Linux or if Hot Sync is disabled**: Close Brave browser first, then copy your profile:

#### Windows (Manual Setup - Optional)

```powershell
# If hot sync is disabled, close Brave first!
# Then copy your profile:
.\fix-profile-copy.ps1
```

Or manually:
```powershell
xcopy /E /I "%USERPROFILE%\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default" "C:\MCP_Brave_Profile\User Data\Default"
```

#### macOS

```bash
# Close Brave browser first!
cp -r ~/Library/Application\ Support/BraveSoftware/Brave-Browser/Default ~/.mcp-brave-profile/User\ Data/Default
```

#### Linux

```bash
# Close Brave browser first!
cp -r ~/.config/BraveSoftware/Brave-Browser/Default ~/.mcp-brave-profile/User\ Data/Default
```

**Note**: With hot sync enabled on Windows, the profile will be automatically synced on first launch, so manual setup is optional.

### 5. Profile Sync Configuration

Profile sync is **always enabled** by default. The MCP server will automatically sync your Brave profile before each launch to ensure you have the latest cookies, bookmarks, and extensions.

**Hot Sync (Windows)**: When Brave is running, the MCP uses "hot sync" which can copy files even while Brave is active. This means you don't need to close Brave!

**Normal Sync**: When Brave is closed, or on macOS/Linux, the MCP uses standard file copying.

To configure sync behavior:

```env
# Enable/disable hot sync (Windows only, default: true)
HOT_SYNC_ENABLED=true

# Number of retry attempts for locked files (default: 5)
SYNC_RETRY_COUNT=5

# Delay between retries in seconds (default: 2)
SYNC_RETRY_DELAY=2
```

## Usage

### Method 1: Use the Brave CLI Wrapper

```bash
# Set environment variables
export USE_BRAVE=true
export BRAVE_EXECUTABLE="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
export BRAVE_PROFILE_PATH="C:\MCP_Brave_Profile"

# Run the Brave-enabled MCP server
node cli-brave.js
```

Or using npm:

```bash
npm run brave
```

### Method 2: Configure in MCP Client (Cursor, VS Code, etc.)

Update your MCP client configuration to use the Brave CLI:

#### For Cursor

Edit your MCP configuration (usually in `.cursor/mcp.json` or Cursor Settings):

```json
{
  "mcpServers": {
    "playwright-brave": {
      "command": "node",
      "args": [
        "path/to/mcp-playwright-brave/cli-brave.js"
      ],
      "env": {
        "USE_BRAVE": "true",
        "BRAVE_EXECUTABLE": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "BRAVE_PROFILE_PATH": "C:\\MCP_Brave_Profile"
      }
    }
  }
}
```

#### For VS Code

Add to your VS Code settings:

```json
{
  "mcp.servers": {
    "playwright-brave": {
      "command": "node",
      "args": [
        "path/to/mcp-playwright-brave/cli-brave.js"
      ],
      "env": {
        "USE_BRAVE": "true",
        "BRAVE_EXECUTABLE": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "BRAVE_PROFILE_PATH": "C:\\MCP_Brave_Profile"
      }
    }
  }
}
```

### Method 3: Using npx (if published to npm)

```bash
npx @playwright/mcp-brave@latest
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USE_BRAVE` | No | `false` | Set to `true` to enable Brave browser |
| `BRAVE_EXECUTABLE` | Yes (if `USE_BRAVE=true`) | Platform-specific | Path to Brave browser executable |
| `BRAVE_PROFILE_PATH` | Yes (if `USE_BRAVE=true`) | Platform-specific | Path to cloned Brave profile directory |
| `BRAVE_SOURCE_PROFILE` | No | Platform-specific | Path to original Brave profile (for syncing) |
| `SYNC_PROFILE_ON_STARTUP` | No | `false` | **Deprecated**: Profile sync is now always enabled |
| `HOT_SYNC_ENABLED` | No | `true` | Enable hot sync when Brave is running (Windows only) |
| `SYNC_RETRY_COUNT` | No | `5` | Number of retry attempts for locked files |
| `SYNC_RETRY_DELAY` | No | `2` | Delay between retries in seconds |

### Platform-Specific Defaults

#### Windows
- **Executable**: `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
- **Profile**: `C:\MCP_Brave_Profile`
- **Source Profile**: `%USERPROFILE%\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default`

#### macOS
- **Executable**: `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`
- **Profile**: `~/.mcp-brave-profile`
- **Source Profile**: `~/Library/Application Support/BraveSoftware/Brave-Browser/Default`

#### Linux
- **Executable**: `/usr/bin/brave-browser`
- **Profile**: `~/.mcp-brave-profile`
- **Source Profile**: `~/.config/BraveSoftware/Brave-Browser/Default`

## How It Works

1. **Brave Mode Detection**: When `USE_BRAVE=true`, the CLI wrapper detects this and prepares Brave configuration
2. **Executable Validation**: Checks if Brave executable exists at the specified path
3. **Running Check**: Detects if Brave is already running to determine sync method
4. **Profile Sync** (always enabled): Automatically syncs your latest Brave profile before launch
   - **Hot Sync** (Windows, Brave running): Uses PowerShell script with robocopy to copy files even when locked
   - **Normal Sync** (Brave closed or macOS/Linux): Uses standard file copying with retry logic
5. **Config Generation**: Creates a temporary JSON config file with Brave settings
6. **MCP Server Launch**: Launches the Playwright MCP server with Brave configuration

The MCP server uses Playwright's `launchPersistentContext()` with:
- `executablePath`: Points to Brave executable
- `userDataDir`: Points to your cloned Brave profile (`{BRAVE_PROFILE_PATH}/User Data`)

### Hot Sync Details (Windows)

When Brave is running and hot sync is enabled:
- Uses `robocopy` with retry logic (`/R` and `/W` flags) to handle locked files
- Copies essential files (Cookies, Bookmarks, Extensions, Preferences) with individual retry attempts
- Skips files that remain locked after retries (continues with partial sync)
- Works seamlessly - no need to close Brave!

## Troubleshooting

### Issue: "Brave executable not found"

**Solution**: 
1. Check if Brave is installed
2. Verify the path in `BRAVE_EXECUTABLE` environment variable
3. On Windows, the default path is `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`

### Issue: "Profile sync skipped - Brave is running"

**Solution**: 
1. **On Windows**: Hot sync should work automatically. Make sure `HOT_SYNC_ENABLED=true` (default)
2. **On macOS/Linux**: Close Brave browser completely, then restart the MCP server
3. Check that `BRAVE_SOURCE_PROFILE` is set correctly

### Issue: "Profile corruption" or "Profile in use"

**Solution**: 
1. **On Windows with Hot Sync**: This shouldn't happen - hot sync handles locked files automatically
2. **On macOS/Linux or if Hot Sync is disabled**: 
   - Make sure Brave is completely closed before syncing
   - Close any Brave-related processes: `taskkill /F /IM brave.exe` (Windows)
   - Wait a few seconds after closing Brave before syncing
3. Increase retry count: Set `SYNC_RETRY_COUNT=10` and `SYNC_RETRY_DELAY=3`
4. Some files may remain locked - this is normal and the sync will continue with available files

### Issue: MCP server won't start

**Solution**: 
1. Check that all environment variables are set correctly
2. Verify the profile path exists and is accessible
3. Check Node.js version: `node --version` (must be 18+)
4. Try running without Brave first: `USE_BRAVE=false node cli-brave.js`

### Issue: MCP tools not working

**Solution**: 
1. Ensure you're using the Brave CLI: `node cli-brave.js` or configure your MCP client to use it
2. Check that the MCP server started successfully (look for `[MCP-PLAYWRIGHT] 🦁 Brave mode enabled`)
3. Verify the browser launches (should see Brave window open)

## Safety Features

- ✅ **Profile Protection**: Never modifies your original Brave profile
- ✅ **Running Detection**: Detects if Brave is running and uses appropriate sync method
- ✅ **Hot Sync Safety**: Uses robocopy with retry logic to safely copy locked files
- ✅ **Sync Safety**: Handles locked files gracefully, continues with partial sync if needed
- ✅ **Executable Validation**: Checks if Brave exists before launching
- ✅ **Isolated Profile**: Uses a separate profile directory
- ✅ **Retry Logic**: Automatically retries copying locked files with configurable delays

## Differences from Standard Playwright MCP

- Uses Brave browser executable instead of Chromium
- Supports automatic profile syncing
- Uses a persistent cloned profile instead of temporary profile
- Provides additional safety checks

## All MCP Features Still Work

All standard Playwright MCP features continue to work:
- Page navigation
- DOM querying and snapshots
- Screenshots
- Browser automation (click, type, etc.)
- Tab management
- Network monitoring
- Console messages
- And more!

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

Same as the original Playwright MCP server: Apache-2.0

## Acknowledgments

- Based on [Playwright MCP](https://github.com/microsoft/playwright-mcp) by Microsoft
- Uses [Playwright](https://playwright.dev/) for browser automation

