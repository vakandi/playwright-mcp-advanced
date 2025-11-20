# Connect to Existing Brave Browser (Extension Mode)

This is the **EASIEST** way to get cookies, extensions, and bookmarks working! Instead of syncing profiles, connect directly to your existing Brave browser.

## Quick Setup

### 1. Build the Extension

```bash
cd extension
npm install
npm run build
```

This creates the extension in `extension/dist/`

### 2. Install Extension in Brave

1. Open Brave and go to `brave://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder

### 3. Update Your .env

Add this line to your `.env`:

```env
USE_EXTENSION=true
```

Or remove `USE_BRAVE=true` and just use extension mode.

### 4. Restart Cursor

Restart Cursor to reload the MCP server with extension mode.

## How It Works

- **Extension mode** connects to your **existing** Brave browser
- Uses **all your cookies, extensions, and bookmarks** from your live browser
- No profile syncing needed!
- When you use MCP, it will open a tab selector page where you choose which tab to control

## Benefits

✅ **No profile sync issues** - uses your real browser  
✅ **All cookies work** - you're logged into everything  
✅ **All extensions available** - everything you have installed  
✅ **All bookmarks** - your full browser state  
✅ **Works with Brave running** - no need to close it  

## Usage

After setup, when MCP tries to use the browser:
1. A new tab opens showing all your open tabs
2. Select which tab you want MCP to control
3. MCP can now fully control that tab with all your cookies/extensions!

## Troubleshooting

**Extension not found?**
- Make sure you built it: `cd extension && npm run build`
- Check it's loaded in `brave://extensions/`

**Can't connect?**
- Make sure Brave is running
- Check the extension icon in Brave toolbar
- Restart Cursor after enabling `USE_EXTENSION=true`

