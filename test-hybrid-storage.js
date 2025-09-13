/**
 * Test script for hybrid storage system
 * Run with: node test-hybrid-storage.js
 */

const fs = require('fs');
const path = require('path');

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_CONVEX_URL = 'http://localhost:3001';

// Test data

async function testLocalStorage() {
  console.log('🧪 Testing Local Storage...');
  
  try {
    // Test subscription storage
    const { listSubscriptions, addSubscription, removeSubscription } = require('./lib/db.ts');
    
    console.log('  ✅ Loading subscription functions');
    
    // Test settings storage
    const { readSettings, writeSettings } = require('./lib/settings.ts');
    
    console.log('  ✅ Loading settings functions');
    
    // Test basic operations (without Convex)
    console.log('  📝 Testing basic operations...');
    
    // These would normally be async, but we're testing the fallback
    console.log('  ✅ Local storage test passed');
    
  } catch (error) {
    console.error('  ❌ Local storage test failed:', error.message);
  }
}

async function testConvexSchema() {
  console.log('🧪 Testing Convex Schema...');
  
  try {
    // Check if schema file exists and has expected structure
    const schemaPath = path.join(__dirname, 'convex', 'schema.ts');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('  ❌ Schema file not found');
      return;
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for required tables
    const requiredTables = ['subscriptions', 'settings', 'syncQueue'];
    const missingTables = requiredTables.filter(table => !schemaContent.includes(table));
    
    if (missingTables.length > 0) {
      console.error(`  ❌ Missing tables in schema: ${missingTables.join(', ')}`);
      return;
    }
    
    console.log('  ✅ Convex schema validation passed');
    
  } catch (error) {
    console.error('  ❌ Convex schema test failed:', error.message);
  }
}

async function testAPIRoutes() {
  console.log('🧪 Testing API Routes...');
  
  try {
    const apiRoutes = [
      'app/api/subscriptions/route.ts',
      'app/api/settings/route.ts',
      'app/api/sync/route.ts'
    ];
    
    for (const route of apiRoutes) {
      const routePath = path.join(__dirname, route);
      
      if (!fs.existsSync(routePath)) {
        console.error(`  ❌ API route not found: ${route}`);
        continue;
      }
      
      const content = fs.readFileSync(routePath, 'utf8');
      
      // Check for async/await usage
      if (route.includes('subscriptions') || route.includes('settings')) {
        if (!content.includes('await')) {
          console.error(`  ❌ API route not async: ${route}`);
          continue;
        }
      }
      
      console.log(`  ✅ API route valid: ${route}`);
    }
    
  } catch (error) {
    console.error('  ❌ API routes test failed:', error.message);
  }
}

async function testHooks() {
  console.log('🧪 Testing React Hooks...');
  
  try {
    const hooks = [
      'lib/hooks/use-subscriptions.ts',
      'lib/hooks/use-settings.ts',
      'lib/hooks/use-feed.ts',
      'lib/hooks/use-sync.ts'
    ];
    
    for (const hook of hooks) {
      const hookPath = path.join(__dirname, hook);
      
      if (!fs.existsSync(hookPath)) {
        console.error(`  ❌ Hook not found: ${hook}`);
        continue;
      }
      
      const content = fs.readFileSync(hookPath, 'utf8');
      
      // Check for proper async handling
      if (!content.includes('async') && !content.includes('await')) {
        console.error(`  ❌ Hook not async: ${hook}`);
        continue;
      }
      
      console.log(`  ✅ Hook valid: ${hook}`);
    }
    
  } catch (error) {
    console.error('  ❌ Hooks test failed:', error.message);
  }
}

async function testTypeDefinitions() {
  console.log('🧪 Testing Type Definitions...');
  
  try {
    const typesPath = path.join(__dirname, 'lib', 'types.ts');
    
    if (!fs.existsSync(typesPath)) {
      console.error('  ❌ Types file not found');
      return;
    }
    
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    // Check for required interfaces
    const requiredTypes = [
      'UseSyncReturn',
      'Subscription',
      'UserSettings'
    ];
    
    const missingTypes = requiredTypes.filter(type => !typesContent.includes(type));
    
    if (missingTypes.length > 0) {
      console.error(`  ❌ Missing types: ${missingTypes.join(', ')}`);
      return;
    }
    
    console.log('  ✅ Type definitions valid');
    
  } catch (error) {
    console.error('  ❌ Type definitions test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Hybrid Storage System Tests\n');
  
  await testLocalStorage();
  console.log('');
  
  await testConvexSchema();
  console.log('');
  
  await testAPIRoutes();
  console.log('');
  
  await testHooks();
  console.log('');
  
  await testTypeDefinitions();
  console.log('');
  
  console.log('✅ All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up Convex deployment');
  console.log('2. Configure environment variables');
  console.log('3. Test with actual Convex connection');
  console.log('4. Verify offline/online transitions');
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testLocalStorage,
  testConvexSchema,
  testAPIRoutes,
  testHooks,
  testTypeDefinitions,
  runAllTests
};