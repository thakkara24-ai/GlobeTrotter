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
import TripStop from '../src/models/TripStop';
import ItinerarySection from '../src/models/ItinerarySection';

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
    console.log(`\n================ STARTING FULL BACKEND TEST SUITE ================\n`);

    // Clean up previous test users, trips, stops, and sections
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

    // Find a second city (e.g. Paris or Jaipur) for stop testing
    const jaipurCityRes = await request('/api/cities?search=Jaipur');
    const jaipurCity = jaipurCityRes.data.data.cities.find((c: any) => c.name === 'Jaipur');
    const city2Id = jaipurCity ? jaipurCity._id : citiesRes.data.data.cities[1]._id;

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
    const sampleActivity = cityActRes.data.data.activities[0] || activitiesRes.data.data.activities[0];
    const singleActRes = await request(`/api/activities/${sampleActivity._id}`);
    assert(
      singleActRes.status === 200 &&
        singleActRes.data.data.activity.name === sampleActivity.name &&
        singleActRes.data.data.activity.city &&
        typeof singleActRes.data.data.activity.city === 'object',
      'GET /api/activities/:id returns activity with populated city'
    );

    // Find activity belonging to city 2 (Jaipur)
    const jaipurActsRes = await request(`/api/activities?city=${city2Id}`);
    const jaipurActivity = jaipurActsRes.data.data.activities[0];

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
        endDate: '2026-10-14',
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
      'POST /api/trips creates trip with user ownership and populated relations'
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

    // 25. Create separate trip to test delete
    const tripToDelete = await request('/api/trips', {
      method: 'POST',
      token: token1,
      body: {
        title: 'Test Trip To Delete',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
      },
    });
    const tripToDeleteId = tripToDelete.data.data.trip._id;

    const deleteRes = await request(`/api/trips/${tripToDeleteId}`, {
      method: 'DELETE',
      token: token1,
    });
    assert(
      deleteRes.status === 200 && deleteRes.data.success === true,
      'DELETE /api/trips/:id by owner deletes trip'
    );

    // 26. Get deleted trip -> 404
    const getDeletedTrip = await request(`/api/trips/${tripToDeleteId}`, { token: token1 });
    assert(
      getDeletedTrip.status === 404,
      'GET /api/trips/:id after deletion returns 404'
    );

    // -------------------------------------------------------------
    // SECTION 5: Phase 3 Itinerary Builder Tests (Stops & Sections)
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Phase 3 Itinerary Builder APIs ---');

    // 27. GET itinerary without token -> 401
    const unauthItinerary = await request(`/api/trips/${trip1Id}/itinerary`);
    assert(unauthItinerary.status === 401, 'GET /api/trips/:id/itinerary without token returns 401');

    // 28. GET itinerary for non-owner (User 2) -> 403
    const forbiddenItinerary = await request(`/api/trips/${trip1Id}/itinerary`, { token: token2 });
    assert(forbiddenItinerary.status === 403, 'GET /api/trips/:id/itinerary for non-owner returns 403');

    // 29. Create stop without token -> 401
    const unauthStop = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      body: {
        cityId: cityId,
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      },
    });
    assert(unauthStop.status === 401, 'POST /api/trips/:id/stops without token returns 401');

    // 30. Create stop with invalid city -> 404
    const invalidCityStop = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      token: token1,
      body: {
        cityId: '6a895d6d57d038761b987fff', // Non-existent ObjectId
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      },
    });
    assert(invalidCityStop.status === 404, 'POST /api/trips/:id/stops with non-existent city returns 404');

    // 31. Create stop with startDate > endDate -> 400
    const invalidDatesStop = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      token: token1,
      body: {
        cityId: cityId,
        startDate: '2026-10-06',
        endDate: '2026-10-02',
      },
    });
    assert(invalidDatesStop.status === 400, 'POST /api/trips/:id/stops with startDate > endDate returns 400');

    // 32. Create valid Stop 1 (Delhi)
    const createStop1Res = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      token: token1,
      body: {
        cityId: cityId,
        startDate: '2026-10-01',
        endDate: '2026-10-05',
        order: 1,
      },
    });
    assert(
      createStop1Res.status === 201 &&
        createStop1Res.data.success === true &&
        createStop1Res.data.data.stop.city.name === 'Delhi' &&
        createStop1Res.data.data.stop.order === 1,
      'POST /api/trips/:id/stops creates Stop 1 (Delhi) with populated city'
    );
    const stop1Id = createStop1Res.data.data.stop._id;

    // 33. Create valid Stop 2 (Jaipur) without explicit order (auto-order)
    const createStop2Res = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      token: token1,
      body: {
        cityId: city2Id,
        startDate: '2026-10-05',
        endDate: '2026-10-10',
      },
    });
    assert(
      createStop2Res.status === 201 &&
        createStop2Res.data.data.stop.order === 2,
      'POST /api/trips/:id/stops creates Stop 2 with auto-calculated order = 2'
    );
    const stop2Id = createStop2Res.data.data.stop._id;

    // 34. Non-owner cannot update stop -> 403
    const nonOwnerUpdateStop = await request(`/api/trips/${trip1Id}/stops/${stop1Id}`, {
      method: 'PUT',
      token: token2,
      body: {
        order: 5,
      },
    });
    assert(nonOwnerUpdateStop.status === 403, 'PUT /api/trips/:id/stops/:stopId by non-owner returns 403');

    // 35. Non-owner cannot delete stop -> 403
    const nonOwnerDeleteStop = await request(`/api/trips/${trip1Id}/stops/${stop1Id}`, {
      method: 'DELETE',
      token: token2,
    });
    assert(nonOwnerDeleteStop.status === 403, 'DELETE /api/trips/:id/stops/:stopId by non-owner returns 403');

    // 36. Update Stop 1 (modify dates) by owner -> 200
    const updateStop1Res = await request(`/api/trips/${trip1Id}/stops/${stop1Id}`, {
      method: 'PUT',
      token: token1,
      body: {
        startDate: '2026-10-01',
        endDate: '2026-10-06',
      },
    });
    assert(updateStop1Res.status === 200, 'PUT /api/trips/:id/stops/:stopId successfully updates stop dates');

    // 37. Create Itinerary Section 1 (Red Fort Activity on Stop 1)
    const createSec1Res = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'ACTIVITY',
        title: 'Morning Red Fort Tour',
        description: 'Guided tour of historical monuments',
        date: '2026-10-02',
        startTime: '09:00',
        endTime: '11:30',
        estimatedCost: 15,
        activityId: sampleActivity._id,
        order: 1,
      },
    });
    assert(
      createSec1Res.status === 201 &&
        createSec1Res.data.success === true &&
        createSec1Res.data.data.section.title === 'Morning Red Fort Tour' &&
        createSec1Res.data.data.section.activity &&
        createSec1Res.data.data.section.activity.name === sampleActivity.name,
      'POST /api/trips/:id/stops/:stopId/sections creates section with populated activity'
    );
    const sec1Id = createSec1Res.data.data.section._id;

    // 38. Create Section with invalid stop/trip relationship -> 400
    const invalidStopSec = await request(`/api/trips/${trip1Id}/stops/6a895d6d57d038761b987eee/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'ACTIVITY',
        title: 'Mismatched stop section',
        date: '2026-10-02',
      },
    });
    assert(invalidStopSec.status === 404 || invalidStopSec.status === 400, 'POST section with non-existent stop returns error');

    // 39. Create Section with invalid activity ID -> 404
    const invalidActSec = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'ACTIVITY',
        title: 'Non-existent activity section',
        date: '2026-10-02',
        activityId: '6a895d6d57d038761b987fff',
      },
    });
    assert(invalidActSec.status === 404, 'POST section with invalid activityId returns 404');

    // 40. Create Section with activity from different city -> 400
    if (jaipurActivity) {
      const mismatchedCityActSec = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections`, {
        method: 'POST',
        token: token1,
        body: {
          type: 'ACTIVITY',
          title: 'Jaipur activity in Delhi stop',
          date: '2026-10-02',
          activityId: jaipurActivity._id,
        },
      });
      assert(mismatchedCityActSec.status === 400, 'POST section with activity from different city returns 400');
    }

    // 41. Create Section with date outside stop range -> 400
    const outOfRangeDateSec = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'MEAL',
        title: 'Dinner far in future',
        date: '2026-12-25',
      },
    });
    assert(outOfRangeDateSec.status === 400, 'POST section with date outside stop date range returns 400');

    // 42. Create Section with negative cost -> 400
    const negativeCostSec = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'MEAL',
        title: 'Negative cost dinner',
        date: '2026-10-03',
        estimatedCost: -50,
      },
    });
    assert(negativeCostSec.status === 400, 'POST section with negative cost returns 400');

    // 43. Create Section with invalid time range (startTime > endTime) -> 400
    const invalidTimeSec = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'ACTIVITY',
        title: 'Time travel activity',
        date: '2026-10-03',
        startTime: '16:00',
        endTime: '12:00',
      },
    });
    assert(invalidTimeSec.status === 400, 'POST section with startTime > endTime returns 400');

    // 44. Create Itinerary Section 2 (Meal) on Stop 1
    const createSec2Res = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'MEAL',
        title: 'Karim\'s Mughlai Dinner',
        description: 'Authentic dinner near Jama Masjid',
        date: '2026-10-02',
        startTime: '19:30',
        endTime: '21:00',
        estimatedCost: 25,
        order: 2,
      },
    });
    assert(createSec2Res.status === 201, 'POST /api/trips/:id/stops/:stopId/sections creates Section 2 (Meal)');
    const sec2Id = createSec2Res.data.data.section._id;

    // 45. Non-owner cannot update section -> 403
    const nonOwnerUpdateSec = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections/${sec1Id}`, {
      method: 'PUT',
      token: token2,
      body: {
        title: 'Hacked section',
      },
    });
    assert(nonOwnerUpdateSec.status === 403, 'PUT section by non-owner returns 403');

    // 46. Update Section 1 by owner -> 200
    const updateSec1Res = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections/${sec1Id}`, {
      method: 'PUT',
      token: token1,
      body: {
        title: 'Updated Red Fort Morning Tour',
        estimatedCost: 20,
      },
    });
    assert(
      updateSec1Res.status === 200 && updateSec1Res.data.data.section.estimatedCost === 20,
      'PUT section by owner successfully updates section'
    );

    // 47. Non-owner cannot delete section -> 403
    const nonOwnerDeleteSec = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections/${sec1Id}`, {
      method: 'DELETE',
      token: token2,
    });
    assert(nonOwnerDeleteSec.status === 403, 'DELETE section by non-owner returns 403');

    // 48. Reorder Sections on Stop 1 -> 200
    const reorderSecsRes = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections/reorder`, {
      method: 'PUT',
      token: token1,
      body: {
        sectionIds: [sec2Id, sec1Id],
      },
    });
    assert(
      reorderSecsRes.status === 200 &&
        reorderSecsRes.data.data.sections[0]._id === sec2Id &&
        reorderSecsRes.data.data.sections[0].order === 1 &&
        reorderSecsRes.data.data.sections[1]._id === sec1Id &&
        reorderSecsRes.data.data.sections[1].order === 2,
      'PUT sections/reorder assigns sequential orders correctly'
    );

    // 49. Reorder Stops on Trip 1 -> 200
    const reorderStopsRes = await request(`/api/trips/${trip1Id}/stops/reorder`, {
      method: 'PUT',
      token: token1,
      body: {
        stopIds: [stop2Id, stop1Id],
      },
    });
    assert(
      reorderStopsRes.status === 200 &&
        reorderStopsRes.data.data.stops[0]._id === stop2Id &&
        reorderStopsRes.data.data.stops[0].order === 1 &&
        reorderStopsRes.data.data.stops[1]._id === stop1Id &&
        reorderStopsRes.data.data.stops[1].order === 2,
      'PUT stops/reorder assigns sequential orders correctly'
    );

    // 50. Date shrinking rejection: try to shrink Stop 1 dates so existing section falls outside -> 400
    const invalidShrinkStop = await request(`/api/trips/${trip1Id}/stops/${stop1Id}`, {
      method: 'PUT',
      token: token1,
      body: {
        startDate: '2026-10-04',
        endDate: '2026-10-06', // Section is on 2026-10-02
      },
    });
    assert(
      invalidShrinkStop.status === 400,
      'PUT stop dates rejected when existing sections fall outside new range'
    );

    // 51. GET Complete Itinerary
    const fullItineraryRes = await request(`/api/trips/${trip1Id}/itinerary`, { token: token1 });
    assert(
      fullItineraryRes.status === 200 &&
        fullItineraryRes.data.success === true &&
        fullItineraryRes.data.data.trip._id === trip1Id &&
        fullItineraryRes.data.data.stops.length === 2 &&
        fullItineraryRes.data.data.stops[0]._id === stop2Id && // because reordered
        fullItineraryRes.data.data.stops[1]._id === stop1Id &&
        fullItineraryRes.data.data.stops[1].sections.length === 2,
      'GET /api/trips/:id/itinerary returns complete structured itinerary with ordered stops & sections'
    );

    // 52. Delete an itinerary section -> 200
    const deleteSecRes = await request(`/api/trips/${trip1Id}/stops/${stop1Id}/sections/${sec2Id}`, {
      method: 'DELETE',
      token: token1,
    });
    assert(deleteSecRes.status === 200, 'DELETE /api/trips/:id/stops/:stopId/sections/:sectionId deletes section');

    // 53. Delete a stop and verify cascading deletion of sections
    const deleteStopRes = await request(`/api/trips/${trip1Id}/stops/${stop1Id}`, {
      method: 'DELETE',
      token: token1,
    });
    assert(deleteStopRes.status === 200, 'DELETE /api/trips/:id/stops/:stopId deletes stop');

    // Verify sections under deleted stop are also deleted from DB
    const remainingSections = await ItinerarySection.find({ stopId: stop1Id });
    assert(
      remainingSections.length === 0,
      'Deleting a stop cascades and removes all its associated itinerary sections'
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
