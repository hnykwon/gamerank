// Script to populate games database with names, genres, images, and prices
// Run this with: node scripts/populateGames.mjs
// (The .mjs extension allows ES6 imports in Node.js)

import { syncAllGamePrices } from '../src/services/gamePriceSyncService.js';

console.log('🚀 Starting to populate games database...');
console.log('⏳ This may take 10-20 minutes for 200 games...');
console.log('📝 The script will:');
console.log('   1. Fetch games from RAWG.io API (names, genres, images)');
console.log('   2. Fetch prices from CheapShark API');
console.log('   3. Store everything in your Supabase database\n');

syncAllGamePrices((current, total) => {
  const percentage = Math.round((current / total) * 100);
  process.stdout.write(`\r📊 Progress: ${current}/${total} games (${percentage}%)`);
}).then(result => {
  console.log('\n\n✅ === Sync Complete ===');
  console.log(`📦 Total games processed: ${result.total}`);
  console.log(`✅ Successfully synced: ${result.successCount}`);
  console.log(`❌ Failed: ${result.failCount}`);
  console.log(`⏭️  Skipped (already up to date): ${result.skippedCount}`);
  console.log('\n🎉 Your games database is now populated!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error during sync:', error);
  process.exit(1);
});

