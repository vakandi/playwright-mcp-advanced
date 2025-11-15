#!/usr/bin/env node
/**
 * Standalone script to sync Brave profile manually
 * Usage: node sync-profile.js
 */

// Load environment variables
try {
  require('dotenv').config();
} catch (error) {
  // dotenv not available, continue without it
}

const { getBraveConfig, syncBraveProfile, isBraveRunning } = require('./brave-config');

(async () => {
  console.log('[MCP-PLAYWRIGHT] 🔄 Starting Brave profile sync...\n');
  
  const braveConfig = getBraveConfig();
  
  if (!braveConfig.useBrave) {
    console.error('[MCP-PLAYWRIGHT] ❌ Brave mode is not enabled.');
    console.error('[MCP-PLAYWRIGHT] Set USE_BRAVE=true in your environment or .env file.');
    process.exit(1);
  }
  
  // Check if Brave is running
  try {
    const running = await isBraveRunning();
    if (running) {
      console.error('[MCP-PLAYWRIGHT] ❌ Brave browser is currently running.');
      console.error('[MCP-PLAYWRIGHT] Please close Brave before syncing the profile to avoid corruption.');
      process.exit(1);
    }
  } catch (error) {
    console.warn('[MCP-PLAYWRIGHT] ⚠️  Could not check if Brave is running. Continuing...');
  }
  
  // Sync profile
  try {
    await syncBraveProfile(braveConfig.sourceProfile, braveConfig.profilePath);
    console.log('\n[MCP-PLAYWRIGHT] ✅ Profile sync completed successfully!');
    console.log(`[MCP-PLAYWRIGHT] Profile location: ${braveConfig.profilePath}`);
  } catch (error) {
    console.error('\n[MCP-PLAYWRIGHT] ❌ Profile sync failed:', error.message);
    process.exit(1);
  }
})();

