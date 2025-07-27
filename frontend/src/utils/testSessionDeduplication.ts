/**
 * Test script to verify the session rate limiting fix
 * This script demonstrates that multiple simultaneous calls to getOrCreateSessionUUID
 * will be deduplicated and only result in a single backend request.
 */

import { getOrCreateSessionUUID } from './sessionUtils';

async function testDeduplication() {
  console.log('Testing UUID request deduplication...');
  
  // Clear localStorage to start fresh
  localStorage.removeItem('session_uuid');
  
  // Make multiple simultaneous calls
  const promises = [
    getOrCreateSessionUUID(),
    getOrCreateSessionUUID(),
    getOrCreateSessionUUID(),
    getOrCreateSessionUUID(),
    getOrCreateSessionUUID()
  ];
  
  console.log('Started 5 simultaneous requests...');
  
  try {
    const results = await Promise.all(promises);
    
    // All results should be the same UUID
    const uniqueResults = new Set(results);
    
    console.log('Results:', results);
    console.log('Unique results:', uniqueResults.size);
    
    if (uniqueResults.size === 1) {
      console.log('✅ SUCCESS: All requests returned the same UUID - deduplication working!');
    } else {
      console.log('❌ FAIL: Multiple different UUIDs returned - deduplication not working');
    }
    
    // Check that UUID is now in localStorage
    const storedUuid = localStorage.getItem('session_uuid');
    console.log('Stored UUID:', storedUuid);
    
    if (storedUuid === results[0]) {
      console.log('✅ SUCCESS: UUID properly stored in localStorage');
    } else {
      console.log('❌ FAIL: UUID not properly stored in localStorage');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

// Export for potential use in tests
export { testDeduplication };

// Run immediately if called directly
if (typeof window !== 'undefined') {
  testDeduplication();
}
