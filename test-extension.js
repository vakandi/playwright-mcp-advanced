#!/usr/bin/env node
/**
 * Quick test script to verify extension mode is working
 */

// Load environment variables
try {
  require('dotenv').config();
} catch (error) {
  // dotenv not available
}

const useExtension = process.env.USE_EXTENSION === 'true';
console.log('USE_EXTENSION:', useExtension);
console.log('process.argv:', process.argv);
console.log('--extension in argv:', process.argv.includes('--extension'));

if (useExtension) {
  console.log('✅ Extension mode is enabled');
  console.log('📋 Make sure:');
  console.log('   1. Extension is built: cd extension && npm run build');
  console.log('   2. Extension is installed in Brave: brave://extensions/');
  console.log('   3. Brave is running');
  console.log('   4. Extension is enabled in Brave');
} else {
  console.log('❌ Extension mode is NOT enabled');
  console.log('   Set USE_EXTENSION=true in your .env file');
}

