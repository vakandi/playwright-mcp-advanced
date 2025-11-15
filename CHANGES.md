# Changes from Original Playwright MCP

This is a custom fork of the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) that adds Brave Browser support.

## Key Changes

### 1. Brave Browser Support

- **New file**: `cli-brave.js` - Custom CLI wrapper that detects Brave configuration and launches MCP server with Brave browser
- **New file**: `brave-config.js` - Configuration and utility functions for Brave browser integration
- **Modified**: `package.json` - Added Brave dependencies and scripts

### 2. Profile Management

- **New file**: `sync-profile.js` - Standalone script to sync Brave profile manually
- Supports persistent user profiles using a cloned copy of your Brave profile
- Optional automatic profile syncing before launch

### 3. Configuration

- Environment variable support:
  - `USE_BRAVE` - Enable/disable Brave mode
  - `BRAVE_EXECUTABLE` - Path to Brave executable
  - `BRAVE_PROFILE_PATH` - Path to cloned Brave profile
  - `BRAVE_SOURCE_PROFILE` - Path to original Brave profile
  - `HOT_SYNC_ENABLED` - Enable hot sync when Brave is running (Windows, default: true)
  - `SYNC_RETRY_COUNT` - Number of retry attempts for locked files (default: 5)
  - `SYNC_RETRY_DELAY` - Delay between retries in seconds (default: 2)

### 4. Safety Features

- Checks if Brave is already running (uses hot sync if enabled)
- Validates Brave executable exists
- **Hot Sync (Windows)**: Syncs profile even when Brave is running using robocopy with retry logic
- Never modifies original Brave profile
- Handles locked files gracefully with retry logic

### 5. Hot Sync Feature (Windows)

- **New file**: `hot-sync-profile.ps1` - PowerShell script for hot syncing profile while Brave is running
- Uses robocopy with retry logic to handle locked files
- Automatically syncs essential files (Cookies, Bookmarks, Extensions, Preferences, Local State)
- Works seamlessly - no need to close Brave!

### 6. Documentation

- **New file**: `README-BRAVE.md` - Complete documentation for Brave edition
- **New file**: `SETUP-WINDOWS.md` - Windows-specific setup guide
- **Updated**: `QUICK-START.md` - Updated with hot sync information
- Updated `package.json` with Brave scripts

## Technical Implementation

### How Brave Mode Works

1. **Detection**: `cli-brave.js` checks for `USE_BRAVE=true` environment variable
2. **Validation**: Validates Brave executable exists at specified path
3. **Profile Sync** (optional): Copies source profile to MCP profile directory
4. **Config Generation**: Creates temporary JSON config file with Brave settings:
   ```json
   {
     "browser": {
       "browserName": "chromium",
       "userDataDir": "C:\\MCP_Brave_Profile",
       "launchOptions": {
         "executablePath": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
         "headless": false
       }
     }
   }
   ```
5. **MCP Launch**: Passes config to Playwright MCP server via `--config` argument

### Profile Sync

**Hot Sync (Windows, Brave Running)**:
- Uses PowerShell script with robocopy and retry logic
- Handles locked files gracefully
- Copies essential files with individual retry attempts
- Works even when Brave is running

**Normal Sync (Brave Closed or macOS/Linux)**:
- Uses `fs-extra` (if available) or native `fs` to copy profile directory
- Skips lock files (`SingletonLock`, `lockfile*`)
- Recursively copies all profile data with retry logic for database files
- Safe error handling if sync fails

### Running Detection

Platform-specific checks:
- **Windows**: Uses `tasklist` command
- **macOS**: Uses `pgrep -f "Brave Browser"`
- **Linux**: Uses `pgrep -f brave`

## Files Added

- `cli-brave.js` - Main CLI wrapper for Brave mode
- `brave-config.js` - Brave configuration utilities with hot sync support
- `sync-profile.js` - Manual profile sync script
- `hot-sync-profile.ps1` - PowerShell script for hot syncing (Windows)
- `README-BRAVE.md` - Complete documentation
- `SETUP-WINDOWS.md` - Windows setup guide
- `.env.example` - Environment variable template

## Files Modified

- `package.json`:
  - Changed name to `@playwright/mcp-brave`
  - Added `dotenv` and `fs-extra` dependencies
  - Added `brave` and `sync-profile` scripts
  - Added `mcp-server-playwright-brave` binary

## Compatibility

- ✅ All MCP Playwright APIs work normally
- ✅ Compatible with all MCP clients (Cursor, VS Code, Claude Desktop, etc.)
- ✅ Maintains full MCP schema compatibility
- ✅ Works on Windows, macOS, and Linux

## Usage

### Enable Brave Mode

```bash
# Set environment variable
export USE_BRAVE=true

# Run with Brave
npm run brave
# or
node cli-brave.js
```

### Standard Mode (Chromium)

```bash
# Unset or set to false
export USE_BRAVE=false

# Run standard
node cli.js
```

## Backwards Compatibility

- Original `cli.js` still works for standard Chromium
- Can switch between Brave and Chromium via environment variables
- All original functionality preserved

## Future Enhancements

Potential improvements:
- GUI for profile management
- Profile diff/merge capabilities
- Multiple profile support
- Profile backup/restore
- Integration with Brave Sync (if API available)

