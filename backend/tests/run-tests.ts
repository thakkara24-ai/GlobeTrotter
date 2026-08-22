import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../src/config/database';
import app from '../src/app';
import { Server } from 'http';
import User from '../src/models/User';
import City from '../src/models/City';
import Activity from '../src/models/Activity';
import Trip from '../src/models/Trip';

const PORT = 5002;
let server: Server;
let baseUrl = `http://localhost:${PORT}`;

interface ApiResponse<T = any> {
  status: number;
  data: T;
}

async function request(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
  } = {}
): Promise<ApiResponse> {
  const url = `${baseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return {
    status: res.status,
    data,
  };
}

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetails?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (errorDetails) {
      console.error('     Details:', JSON.stringify(errorDetails, null, 2));
    }
    failedTests++;
  }
}

async function runTests() {
  try {
    await connectDB();
    server = app.listen(PORT);
    console.log(`\n================ STARTING PHASE 1 & 2 TESTS ================\n`);

    // Clean up previous test users and trips
    await User.deleteMany({ email: { $in: ['p2user1@example.com', 'p2user2@example.com'] } });
    await Trip.deleteMany({ title: { $regex: /Test Trip/i } });

    // -------------------------------------------------------------
    // SECTION 1: Phase 1 Regression (Health + Auth)
    // -------------------------------------------------------------
    console.log('--- Section 1: Health & Authentication Regression ---');

    // 1. Health API
    const healthRes = await request('/api/health');
    assert(
      healthRes.status === 200 && healthRes.data.success === true && healthRes.data.data.database === 'connected',
      'GET /api/health returns 200 with database connected'
    );

    // 2. Register User 1
    const regUser1 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Phase2 User1',
        email: 'p2user1@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    assert(
      regUser1.status === 201 &&
        regUser1.data.success === true &&
        regUser1.data.data.token &&
        !regUser1.data.data.user.passwordHash,
      'POST /api/auth/register creates User 1 without passwordHash'
    );
    const token1 = regUser1.data.data.token;
    const user1Id = regUser1.data.data.user._id;

    // 3. Register User 2 (for authorization tests)
    const regUser2 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Phase2 User2',
        email: 'p2user2@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });
    assert(regUser2.status === 201 && regUser2.data.data.token, 'POST /api/auth/register creates User 2');
    const token2 = regUser2.data.data.token;

    // 4. Login User 1
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'p2user1@example.com',
        password: 'Password123!',
      },
    });
    assert(loginRes.status === 200 && loginRes.data.data.token, 'POST /api/auth/login authenticates User 1');

    // 5. Auth /me
    const meRes = await request('/api/auth/me', { token: token1 });
    assert(
      meRes.status === 200 && meRes.data.data.user.email === 'p2user1@example.com' && !meRes.data.data.user.passwordHash,
      'GET /api/auth/me returns current user info safely'
    );

    // -------------------------------------------------------------
    // SECTION 2: Cities API
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Cities API ---');

    // 6. List cities with pagination
    const citiesRes = await request('/api/cities?page=1&limit=5');
    assert(
      citiesRes.status === 200 &&
        citiesRes.data.data.cities.length === 5 &&
        citiesRes.data.data.pagination.total >= 10,
      'GET /api/cities returns paginated cities'
    );

    // 7. City search
    const searchCityRes = await request('/api/cities?search=Delhi');
    assert(
      searchCityRes.status === 200 &&
        searchCityRes.data.data.cities.some((c: any) => c.name === 'Delhi'),
      'GET /api/cities?search=Delhi finds Delhi'
    );

    // 8. City country filter
    const countryCityRes = await request('/api/cities?country=India');
    assert(
      countryCityRes.status === 200 &&
        countryCityRes.data.data.cities.every((c: any) => c.country === 'India'),
      'GET /api/cities?country=India filters by country'
    );

    // 9. Get city by ID
    const delhiCity = searchCityRes.data.data.cities.find((c: any) => c.name === 'Delhi') || citiesRes.data.data.cities[0];
    const cityId = delhiCity._id;
    const singleCityRes = await request(`/api/cities/${cityId}`);
    assert(
      singleCityRes.status === 200 && singleCityRes.data.data.city.name === delhiCity.name,
      'GET /api/cities/:id returns single city'
    );

    // -------------------------------------------------------------
    // SECTION 3: Activities API
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Activities API ---');

    // 10. List activities
    const activitiesRes = await request('/api/activities?page=1&limit=10');
    assert(
      activitiesRes.status === 200 && activitiesRes.data.data.activities.length > 0,
      'GET /api/activities returns paginated activities'
    );

    // 11. Activity city filter
    const cityActRes = await request(`/api/activities?city=${cityId}`);
    assert(
      cityActRes.status === 200 &&
        cityActRes.data.data.activities.length > 0 &&
        cityActRes.data.data.activities.every((a: any) => a.city._id === cityId || a.city === cityId),
      'GET /api/activities?city=<cityId> filters by city'
    );

    // 12. Activity category filter
    const catActRes = await request('/api/activities?category=food');
    assert(
      catActRes.status === 200 &&
        catActRes.data.data.activities.length > 0 &&
        catActRes.data.data.activities.every((a: any) => a.category === 'food'),
      'GET /api/activities?category=food filters by category'
    );

    // 13. Activity search
    const searchActRes = await request('/api/activities?search=Tour');
    assert(
      searchActRes.status === 200 && searchActRes.data.data.activities.length > 0,
      'GET /api/activities?search=Tour performs text search'
    );

    // 14. Single activity populated with city
    const sampleActivity = activitiesRes.data.data.activities[0];
    const singleActRes = await request(`/api/activities/${sampleActivity._id}`);
    assert(
      singleActRes.status === 200 &&
        singleActRes.data.data.activity.name === sampleActivity.name &&
        singleActRes.data.data.activity.city &&
        typeof singleActRes.data.data.activity.city === 'object',
      'GET /api/activities/:id returns activity with populated city'
    );

    // -------------------------------------------------------------
    // SECTION 4: Trips API (CRUD, Dates, Ownership & Authorization)
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Trips API (CRUD, Dates, Ownership) ---');

    // 15. Create trip without token -> 401
    const unauthTrip = await request('/api/trips', {
      method: 'POST',
      body: {
        title: 'Test Trip Unauth',
        startDate: '2026-10-01',
        endDate: '2026-10-07',
      },
    });
    assert(unauthTrip.status === 401, 'POST /api/trips without token returns 401');

    // 16. Create trip with invalid dates (startDate > endDate) -> 400
    const invalidDateTrip = await request('/api/trips', {
      method: 'POST',
      token: token1,
      body: {
        title: 'Test Trip Invalid Dates',
        startDate: '2026-10-10',
        endDate: '2026-10-05',
      },
    });
    assert(invalidDateTrip.status === 400, 'POST /api/trips with startDate > endDate returns 400');

    // 17. Create valid trip for User 1
    const createTripRes = await request('/api/trips', {
      method: 'POST',
      token: token1,
      body: {
        title: 'Test Trip Rajasthan',
        description: 'Seven day exploration',
        startDate: '2026-10-01',
        endDate: '2026-10-07',
        cities: [cityId],
        activities: [sampleActivity._id],
        status: 'PLANNING',
      },
    });
    assert(
      createTripRes.status === 201 &&
        createTripRes.data.success === true &&
        createTripRes.data.data.trip.title === 'Test Trip Rajasthan' &&
        createTripRes.data.data.trip.user === user1Id,
      'POST /api/trips creates trip with user ownership and populated relations',
      createTripRes.data
    );
    const trip1Id = createTripRes.data.data.trip._id;

    // 18. Get my trips for User 1
    const user1Trips = await request('/api/trips?page=1&limit=10', { token: token1 });
    assert(
      user1Trips.status === 200 &&
        user1Trips.data.data.trips.length >= 1 &&
        user1Trips.data.data.trips.every((t: any) => t.user === user1Id || t.user?._id === user1Id),
      'GET /api/trips returns only User 1 trips'
    );

    // 19. Get my trips for User 2 -> empty or 0 trips of User 1
    const user2Trips = await request('/api/trips', { token: token2 });
    assert(
      user2Trips.status === 200 &&
        user2Trips.data.data.trips.length === 0,
      'GET /api/trips for User 2 does not return User 1 trips'
    );

    // 20. Get single trip by owner (User 1)
    const getTrip1Res = await request(`/api/trips/${trip1Id}`, { token: token1 });
    assert(
      getTrip1Res.status === 200 &&
        getTrip1Res.data.data.trip.title === 'Test Trip Rajasthan' &&
        getTrip1Res.data.data.trip.cities.length > 0 &&
        getTrip1Res.data.data.trip.activities.length > 0,
      'GET /api/trips/:id returns trip with populated cities and activities'
    );

    // 21. Get single trip by non-owner (User 2) -> 403
    const forbiddenGetTrip = await request(`/api/trips/${trip1Id}`, { token: token2 });
    assert(
      forbiddenGetTrip.status === 403,
      'GET /api/trips/:id by non-owner returns 403'
    );

    // 22. Update trip by owner (User 1)
    const updateTripRes = await request(`/api/trips/${trip1Id}`, {
      method: 'PUT',
      token: token1,
      body: {
        title: 'Updated Rajasthan Adventure',
        status: 'UPCOMING',
      },
    });
    assert(
      updateTripRes.status === 200 &&
        updateTripRes.data.data.trip.title === 'Updated Rajasthan Adventure' &&
        updateTripRes.data.data.trip.status === 'UPCOMING',
      'PUT /api/trips/:id by owner successfully updates trip'
    );

    // 23. Update trip by non-owner (User 2) -> 403
    const forbiddenUpdate = await request(`/api/trips/${trip1Id}`, {
      method: 'PUT',
      token: token2,
      body: {
        title: 'Hacked Title',
      },
    });
    assert(
      forbiddenUpdate.status === 403,
      'PUT /api/trips/:id by non-owner returns 403'
    );

    // 24. Delete trip by non-owner (User 2) -> 403
    const forbiddenDelete = await request(`/api/trips/${trip1Id}`, {
      method: 'DELETE',
      token: token2,
    });
    assert(
      forbiddenDelete.status === 403,
      'DELETE /api/trips/:id by non-owner returns 403'
    );

    // 25. Delete trip by owner (User 1) -> 200
    const deleteRes = await request(`/api/trips/${trip1Id}`, {
      method: 'DELETE',
      token: token1,
    });
    assert(
      deleteRes.status === 200 && deleteRes.data.success === true,
      'DELETE /api/trips/:id by owner deletes trip'
    );

    // 26. Get deleted trip -> 404
    const getDeletedTrip = await request(`/api/trips/${trip1Id}`, { token: token1 });
    assert(
      getDeletedTrip.status === 404,
      'GET /api/trips/:id after deletion returns 404'
    );

    console.log(`\n============================================================`);
    console.log(`TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
    console.log(`============================================================\n`);

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error during test run:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runTests();
