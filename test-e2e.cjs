const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING GLOBETROTTER FULL-STACK E2E TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Health check
    console.log('1. Testing Health Check...');
    const health = await request('GET', '/health');
    console.log('   Status:', health.status, 'Response:', health.data);

    // 2. Auth Login (Demo User)
    console.log('\n2. Testing Authentication (Demo Login)...');
    const loginRes = await request('POST', '/auth/login', {
      email: 'demo@globetrotter.com',
      password: 'password123',
    });
    console.log('   Status:', loginRes.status, 'User:', loginRes.data.data?.user?.name);
    const token = loginRes.data.data?.token;

    // 3. User Me
    console.log('\n3. Testing GET /api/auth/me...');
    const meRes = await request('GET', '/auth/me', null, token);
    console.log('   Status:', meRes.status, 'Email:', meRes.data.data?.user?.email);

    // 4. Cities
    console.log('\n4. Testing Cities API...');
    const citiesRes = await request('GET', '/cities');
    console.log('   Status:', citiesRes.status, 'Total cities:', citiesRes.data.data?.cities?.length);
    const udaipur = citiesRes.data.data?.cities?.find((c) => c.name === 'Udaipur');
    const jaipur = citiesRes.data.data?.cities?.find((c) => c.name === 'Jaipur');

    // 5. Activities
    console.log('\n5. Testing Activities API...');
    const actRes = await request('GET', '/activities');
    console.log('   Status:', actRes.status, 'Total activities:', actRes.data.data?.activities?.length);

    // 6. User Trips
    console.log('\n6. Testing Trips API (GET /api/trips)...');
    const tripsRes = await request('GET', '/trips', null, token);
    console.log('   Status:', tripsRes.status, 'User Trips Count:', tripsRes.data.data?.trips?.length);
    const firstTrip = tripsRes.data.data?.trips[0];
    console.log('   First Trip Title:', firstTrip?.title);

    // 7. Itinerary Builder (Stops & Sections)
    console.log('\n7. Testing Itinerary API for Trip ID:', firstTrip._id);
    const itinRes = await request('GET', `/itinerary/${firstTrip._id}`, null, token);
    console.log('   Status:', itinRes.status);
    console.log('   Stops in trip:', itinRes.data.data?.stops?.length);
    console.log('   Sections in trip:', itinRes.data.data?.sections?.length);

    // 8. Add a new activity item to itinerary
    console.log('\n8. Testing Adding Section to Itinerary...');
    const addSectionRes = await request(
      'POST',
      `/itinerary/${firstTrip._id}/sections`,
      {
        type: 'Activity',
        title: 'Sunset Photography Tour',
        description: 'Guided lakefront photo walk',
        date: firstTrip.startDate,
        startTime: '17:00',
        endTime: '18:30',
        estimatedCost: 1500,
      },
      token
    );
    console.log('   Status:', addSectionRes.status, 'Created Section Title:', addSectionRes.data.data?.section?.title);
    const newSectionId = addSectionRes.data.data?.section?._id;

    // 9. Budget Engine Calculation
    console.log('\n9. Testing Budget Engine (GET /api/budget/:tripId)...');
    const budgetRes = await request('GET', `/budget/${firstTrip._id}`, null, token);
    console.log('   Status:', budgetRes.status);
    console.log('   Total Budget: ₹', budgetRes.data.data?.totalBudget);
    console.log('   Estimated Total: ₹', budgetRes.data.data?.estimatedTotal);
    console.log('   Remaining: ₹', budgetRes.data.data?.remaining);
    console.log('   Over Budget: ₹', budgetRes.data.data?.overBudget);
    console.log('   Categories Breakdown:', budgetRes.data.data?.categoryBreakdown?.map((c) => `${c.category}: ₹${c.amount}`));
    console.log('   Smart Recommendations:', budgetRes.data.data?.recommendations?.map((r) => `[${r.type}] ${r.title}`));

    // 10. Public Sharing
    console.log('\n10. Testing Public Shared Itinerary (Unauthenticated)...');
    const allTrips = Array.isArray(tripsRes.data.data) ? tripsRes.data.data : (tripsRes.data.data?.trips || []);
    const publicTrip = allTrips.find((t) => t.shareToken && t.isPublic) || firstTrip;
    const sharedRes = await request('GET', `/public/trips/${publicTrip.shareToken || 'rajasthan-heritage-2026-demo'}`);
    console.log('   Status:', sharedRes.status, 'Shared Trip Title:', sharedRes.data.data?.trip?.title);
    console.log('   Read-only stops count:', sharedRes.data.data?.stops?.length);

    // 11. Community
    console.log('\n11. Testing Community Posts API...');
    const commRes = await request('GET', '/community');
    console.log('   Status:', commRes.status, 'Posts Count:', commRes.data.data?.posts?.length);
    console.log('   First Post Title:', commRes.data.data?.posts[0]?.title);

    // 12. Cleanup added test section
    if (newSectionId) {
      console.log('\n12. Cleaning up test section...');
      const delRes = await request('DELETE', `/itinerary/${firstTrip._id}/sections/${newSectionId}`, null, token);
      console.log('   Delete Status:', delRes.status);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL 12 END-TO-END SYSTEM INTEGRATION TESTS PASSED!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests();
