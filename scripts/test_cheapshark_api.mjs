// Test script to verify CheapShark API parameters
// Run this after waiting for rate limits to reset

console.log('Testing CheapShark API endpoints...\n');

// Test 1: Games search endpoint
async function testGamesSearch() {
  console.log('1. Testing /api/1.0/games endpoint:');
  try {
    const url = 'https://www.cheapshark.com/api/1.0/games?title=witcher&limit=3';
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log('   ⚠️  Rate limited or error:', data.error);
      return;
    }
    
    console.log('   ✅ Response structure:');
    if (Array.isArray(data) && data.length > 0) {
      console.log('   Sample game object:', JSON.stringify(data[0], null, 2));
      console.log('   Available fields:', Object.keys(data[0]));
    } else {
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Test 2: Deals endpoint with gameID
async function testDealsByGameID() {
  console.log('\n2. Testing /api/1.0/deals?gameID= endpoint:');
  try {
    // Using a known gameID (The Witcher 3)
    const url = 'https://www.cheapshark.com/api/1.0/deals?gameID=1027';
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log('   ⚠️  Rate limited or error:', data.error);
      return;
    }
    
    console.log('   ✅ Response structure:');
    if (Array.isArray(data) && data.length > 0) {
      console.log('   Sample deal object:', JSON.stringify(data[0], null, 2));
      console.log('   Available fields:', Object.keys(data[0]));
      console.log('   Price fields:', {
        price: data[0].price,
        salePrice: data[0].salePrice,
        retailPrice: data[0].retailPrice,
        normalPrice: data[0].normalPrice,
      });
    } else {
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Test 3: Deals endpoint with steamAppID (alternative method)
async function testDealsBySteamID() {
  console.log('\n3. Testing /api/1.0/deals?steamAppID= endpoint:');
  try {
    // Using The Witcher 3 Steam App ID
    const url = 'https://www.cheapshark.com/api/1.0/deals?steamAppID=292030';
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log('   ⚠️  Rate limited or error:', data.error);
      return;
    }
    
    console.log('   ✅ Response structure:');
    if (Array.isArray(data) && data.length > 0) {
      console.log('   Sample deal object:', JSON.stringify(data[0], null, 2));
      console.log('   Available fields:', Object.keys(data[0]));
    } else {
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

// Test 4: Check what price fields we should use
async function testPriceFields() {
  console.log('\n4. Analyzing price field usage:');
  console.log('   Current script uses: deal.price || deal.salePrice');
  console.log('   Should also check: deal.normalPrice, deal.retailPrice');
  console.log('   Recommendation: Use deal.salePrice if available, else deal.price');
}

// Run all tests
async function runTests() {
  await testGamesSearch();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  await testDealsByGameID();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  await testDealsBySteamID();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  await testPriceFields();
  
  console.log('\n✅ Testing complete!');
  console.log('\nNote: If you see rate limit errors, wait 10-15 minutes and try again.');
}

runTests().catch(console.error);

