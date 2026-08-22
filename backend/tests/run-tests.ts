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
import Expense from '../src/models/Expense';

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

    // Clean up previous test users, trips, stops, sections, and expenses
    await User.deleteMany({ email: { $in: ['p2user1@example.com', 'p2user2@example.com'] } });
    await Trip.deleteMany({ title: { $regex: /Test Trip/i } });
    await Expense.deleteMany({});

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

    // Find a second city (e.g. Jaipur) for stop testing
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

    // -------------------------------------------------------------
    // SECTION 6: Phase 4 Budget, Expenses & Analytics Tests
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Phase 4 Budget, Expenses & Analytics ---');

    // 54. PUT /api/trips/:tripId/budget without token -> 401
    const unauthBudget = await request(`/api/trips/${trip1Id}/budget`, {
      method: 'PUT',
      body: { totalBudget: 50000, currency: 'INR' },
    });
    assert(unauthBudget.status === 401, 'PUT /api/trips/:tripId/budget without token returns 401');

    // 55. PUT /api/trips/:tripId/budget by non-owner -> 403
    const nonOwnerBudget = await request(`/api/trips/${trip1Id}/budget`, {
      method: 'PUT',
      token: token2,
      body: { totalBudget: 50000, currency: 'INR' },
    });
    assert(nonOwnerBudget.status === 403, 'PUT /api/trips/:tripId/budget by non-owner returns 403');

    // 56. Reject negative budget -> 400
    const negativeBudget = await request(`/api/trips/${trip1Id}/budget`, {
      method: 'PUT',
      token: token1,
      body: { totalBudget: -500, currency: 'INR' },
    });
    assert(negativeBudget.status === 400, 'PUT /api/trips/:tripId/budget with negative budget returns 400');

    // 57. Reject invalid currency code -> 400
    const invalidCurrency = await request(`/api/trips/${trip1Id}/budget`, {
      method: 'PUT',
      token: token1,
      body: { totalBudget: 50000, currency: 'INVALID_CURRENCY' },
    });
    assert(invalidCurrency.status === 400, 'PUT /api/trips/:tripId/budget with invalid currency returns 400');

    // 58. Update trip budget successfully by owner -> 200
    const updateBudgetRes = await request(`/api/trips/${trip1Id}/budget`, {
      method: 'PUT',
      token: token1,
      body: { totalBudget: 50000, currency: 'INR' },
    });
    assert(
      updateBudgetRes.status === 200 &&
        updateBudgetRes.data.success === true &&
        updateBudgetRes.data.data.totalBudget === 50000 &&
        updateBudgetRes.data.data.currency === 'INR' &&
        updateBudgetRes.data.data.remainingBudget === 50000 &&
        updateBudgetRes.data.data.totalSpent === 0 &&
        updateBudgetRes.data.data.overBudget === false,
      'PUT /api/trips/:tripId/budget updates budget and returns summary'
    );

    // 59. GET budget summary initially -> 200
    const getBudgetRes = await request(`/api/trips/${trip1Id}/budget`, { token: token1 });
    assert(
      getBudgetRes.status === 200 &&
        getBudgetRes.data.data.totalBudget === 50000 &&
        getBudgetRes.data.data.totalSpent === 0 &&
        getBudgetRes.data.data.percentageUsed === 0 &&
        getBudgetRes.data.data.expenseCount === 0,
      'GET /api/trips/:tripId/budget returns zero spending initially'
    );

    // 60. Create expense without token -> 401
    const unauthExpense = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      body: { title: 'Taxi', amount: 500, category: 'TRANSPORT', date: '2026-10-02' },
    });
    assert(unauthExpense.status === 401, 'POST /api/trips/:tripId/expenses without token returns 401');

    // 61. Create expense by non-owner -> 403
    const nonOwnerExpense = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      token: token2,
      body: { title: 'Hacked Expense', amount: 500, category: 'FOOD', date: '2026-10-02' },
    });
    assert(nonOwnerExpense.status === 403, 'POST /api/trips/:tripId/expenses by non-owner returns 403');

    // 62. Create expense with invalid trip -> 404
    const invalidTripExpense = await request(`/api/trips/6a895d6d57d038761b987eee/expenses`, {
      method: 'POST',
      token: token1,
      body: { title: 'Taxi', amount: 500, category: 'TRANSPORT', date: '2026-10-02' },
    });
    assert(invalidTripExpense.status === 404, 'POST /api/trips/:tripId/expenses with non-existent trip returns 404');

    // 63. Create expense with invalid category -> 400
    const invalidCategoryExpense = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      token: token1,
      body: { title: 'Taxi', amount: 500, category: 'INVALID_CATEGORY', date: '2026-10-02' },
    });
    assert(invalidCategoryExpense.status === 400, 'POST /api/trips/:tripId/expenses with invalid category returns 400');

    // 64. Create expense with zero or negative amount -> 400
    const zeroAmountExpense = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      token: token1,
      body: { title: 'Free meal', amount: 0, category: 'FOOD', date: '2026-10-02' },
    });
    assert(zeroAmountExpense.status === 400, 'POST /api/trips/:tripId/expenses with amount = 0 returns 400');

    // 65. Create Expense 1 (TRANSPORT: 12000 INR on 2026-10-02) -> 201
    const createExp1 = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      token: token1,
      body: {
        title: 'Train to Jaipur AC Chair Car',
        amount: 12000,
        currency: 'INR',
        category: 'TRANSPORT',
        date: '2026-10-02',
        notes: 'Roundtrip booked via IRCTC',
      },
    });
    assert(
      createExp1.status === 201 &&
        createExp1.data.success === true &&
        createExp1.data.data.expense.title === 'Train to Jaipur AC Chair Car' &&
        createExp1.data.data.expense.amount === 12000 &&
        createExp1.data.data.expense.category === 'TRANSPORT',
      'POST /api/trips/:tripId/expenses creates Expense 1 (TRANSPORT)'
    );
    const exp1Id = createExp1.data.data.expense._id;

    // 66. Create Expense 2 (FOOD: 8000 INR on 2026-10-02) -> 201
    const createExp2 = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      token: token1,
      body: {
        title: 'Fine Dining Rajasthani Dinner',
        amount: 8000,
        currency: 'INR',
        category: 'FOOD',
        date: '2026-10-02',
      },
    });
    assert(createExp2.status === 201, 'POST /api/trips/:tripId/expenses creates Expense 2 (FOOD)');
    const exp2Id = createExp2.data.data.expense._id;

    // 67. Create Expense 3 (ACCOMMODATION: 20000 INR on 2026-10-03) -> 201
    const createExp3 = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      token: token1,
      body: {
        title: 'Boutique Haveli Resort',
        amount: 20000,
        currency: 'INR',
        category: 'ACCOMMODATION',
        date: '2026-10-03',
      },
    });
    assert(createExp3.status === 201, 'POST /api/trips/:tripId/expenses creates Expense 3 (ACCOMMODATION)');
    const exp3Id = createExp3.data.data.expense._id;

    // 68. Create Expense 4 (SHOPPING: 5000 INR on 2026-10-04) -> 201
    const createExp4 = await request(`/api/trips/${trip1Id}/expenses`, {
      method: 'POST',
      token: token1,
      body: {
        title: 'Blue Pottery & Handicrafts',
        amount: 5000,
        currency: 'INR',
        category: 'SHOPPING',
        date: '2026-10-04',
      },
    });
    assert(createExp4.status === 201, 'POST /api/trips/:tripId/expenses creates Expense 4 (SHOPPING)');
    const exp4Id = createExp4.data.data.expense._id;

    // 69. GET /api/trips/:tripId/expenses lists all expenses with pagination -> 200
    const listExpensesRes = await request(`/api/trips/${trip1Id}/expenses`, { token: token1 });
    assert(
      listExpensesRes.status === 200 &&
        listExpensesRes.data.data.expenses.length === 4 &&
        listExpensesRes.data.data.pagination.total === 4,
      'GET /api/trips/:tripId/expenses returns 4 expenses with pagination metadata'
    );

    // 70. Filter expenses by category (?category=FOOD) -> 200
    const filterCatRes = await request(`/api/trips/${trip1Id}/expenses?category=FOOD`, { token: token1 });
    assert(
      filterCatRes.status === 200 &&
        filterCatRes.data.data.expenses.length === 1 &&
        filterCatRes.data.data.expenses[0].category === 'FOOD',
      'GET /api/trips/:tripId/expenses?category=FOOD filters correctly'
    );

    // 71. Filter expenses by date range (?fromDate=2026-10-03&toDate=2026-10-04) -> 200
    const filterDateRes = await request(
      `/api/trips/${trip1Id}/expenses?fromDate=2026-10-03&toDate=2026-10-04`,
      { token: token1 }
    );
    assert(
      filterDateRes.status === 200 &&
        filterDateRes.data.data.expenses.length === 2 &&
        filterDateRes.data.data.expenses.every((e: any) => e.date.startsWith('2026-10-03') || e.date.startsWith('2026-10-04')),
      'GET /api/trips/:tripId/expenses with fromDate & toDate filters correctly'
    );

    // 72. Pagination on expenses (?page=1&limit=2) -> 200
    const pageExpensesRes = await request(`/api/trips/${trip1Id}/expenses?page=1&limit=2`, { token: token1 });
    assert(
      pageExpensesRes.status === 200 &&
        pageExpensesRes.data.data.expenses.length === 2 &&
        pageExpensesRes.data.data.pagination.page === 1 &&
        pageExpensesRes.data.data.pagination.limit === 2 &&
        pageExpensesRes.data.data.pagination.pages === 2,
      'GET /api/trips/:tripId/expenses pagination returns 2 items per page with 2 pages total'
    );

    // 73. Get single expense by ID by owner -> 200
    const getExp1Res = await request(`/api/trips/${trip1Id}/expenses/${exp1Id}`, { token: token1 });
    assert(
      getExp1Res.status === 200 && getExp1Res.data.data.expense.title === 'Train to Jaipur AC Chair Car',
      'GET /api/trips/:tripId/expenses/:expenseId returns single expense'
    );

    // 74. Get single expense by non-owner -> 403
    const nonOwnerGetExp = await request(`/api/trips/${trip1Id}/expenses/${exp1Id}`, { token: token2 });
    assert(nonOwnerGetExp.status === 403, 'GET /api/trips/:tripId/expenses/:expenseId by non-owner returns 403');

    // 75. Update expense by owner -> 200
    const updateExpRes = await request(`/api/trips/${trip1Id}/expenses/${exp1Id}`, {
      method: 'PUT',
      token: token1,
      body: {
        amount: 14000,
        notes: 'Executive Class upgrade',
      },
    });
    assert(
      updateExpRes.status === 200 &&
        updateExpRes.data.data.expense.amount === 14000 &&
        updateExpRes.data.data.expense.notes === 'Executive Class upgrade',
      'PUT /api/trips/:tripId/expenses/:expenseId by owner updates expense'
    );

    // 76. Update expense by non-owner -> 403
    const nonOwnerUpdateExp = await request(`/api/trips/${trip1Id}/expenses/${exp1Id}`, {
      method: 'PUT',
      token: token2,
      body: { amount: 1000 },
    });
    assert(nonOwnerUpdateExp.status === 403, 'PUT /api/trips/:tripId/expenses/:expenseId by non-owner returns 403');

    // 77. Delete expense by non-owner -> 403
    const nonOwnerDeleteExp = await request(`/api/trips/${trip1Id}/expenses/${exp4Id}`, {
      method: 'DELETE',
      token: token2,
    });
    assert(nonOwnerDeleteExp.status === 403, 'DELETE /api/trips/:tripId/expenses/:expenseId by non-owner returns 403');

    // 78. Delete expense by owner -> 200
    const deleteExpRes = await request(`/api/trips/${trip1Id}/expenses/${exp4Id}`, {
      method: 'DELETE',
      token: token1,
    });
    assert(deleteExpRes.status === 200, 'DELETE /api/trips/:tripId/expenses/:expenseId by owner deletes expense');

    // 79. Get deleted expense -> 404
    const getDeletedExp = await request(`/api/trips/${trip1Id}/expenses/${exp4Id}`, { token: token1 });
    assert(getDeletedExp.status === 404, 'GET /api/trips/:tripId/expenses/:expenseId after delete returns 404');

    // At this point, active expenses:
    // Exp 1: TRANSPORT = 14000
    // Exp 2: FOOD = 8000
    // Exp 3: ACCOMMODATION = 20000
    // Total spent = 42000. Total budget = 50000.

    // 80. Category Analytics (GET /api/trips/:tripId/budget/categories) -> 200
    const catAnalyticsRes = await request(`/api/trips/${trip1Id}/budget/categories`, { token: token1 });
    assert(
      catAnalyticsRes.status === 200 &&
        catAnalyticsRes.data.data.categories.length === 3 &&
        catAnalyticsRes.data.data.categories[0].category === 'ACCOMMODATION' &&
        catAnalyticsRes.data.data.categories[0].amount === 20000 &&
        catAnalyticsRes.data.data.categories[0].percentage > 0,
      'GET /api/trips/:tripId/budget/categories aggregates expenses and calculates percentages'
    );

    // 81. Daily Analytics (GET /api/trips/:tripId/budget/daily) -> 200
    const dailyAnalyticsRes = await request(`/api/trips/${trip1Id}/budget/daily`, { token: token1 });
    assert(
      dailyAnalyticsRes.status === 200 &&
        dailyAnalyticsRes.data.data.daily.length === 2 &&
        dailyAnalyticsRes.data.data.daily[0].date === '2026-10-02' &&
        dailyAnalyticsRes.data.data.daily[0].amount === 22000 && // 14000 + 8000
        dailyAnalyticsRes.data.data.daily[1].date === '2026-10-03' &&
        dailyAnalyticsRes.data.data.daily[1].amount === 20000,
      'GET /api/trips/:tripId/budget/daily groups daily spending and sorts chronologically'
    );

    // 82. Budget Summary with accurate calculations -> 200
    // Total budget = 50000, Total spent = 42000 (84%), Remaining = 8000, overBudget = false
    const budgetSummaryRes = await request(`/api/trips/${trip1Id}/budget`, { token: token1 });
    assert(
      budgetSummaryRes.status === 200 &&
        budgetSummaryRes.data.data.totalBudget === 50000 &&
        budgetSummaryRes.data.data.totalSpent === 42000 &&
        budgetSummaryRes.data.data.remainingBudget === 8000 &&
        budgetSummaryRes.data.data.percentageUsed === 84 &&
        budgetSummaryRes.data.data.overBudget === false &&
        budgetSummaryRes.data.data.expenseCount === 3,
      'GET /api/trips/:tripId/budget returns accurate totalSpent, remainingBudget, and percentageUsed'
    );

    // 83. Over-Budget Detection: Update budget to 40000 (less than 42000 spent) -> 200
    const overBudgetUpdate = await request(`/api/trips/${trip1Id}/budget`, {
      method: 'PUT',
      token: token1,
      body: { totalBudget: 40000, currency: 'INR' },
    });
    assert(
      overBudgetUpdate.status === 200 &&
        overBudgetUpdate.data.data.overBudget === true &&
        overBudgetUpdate.data.data.remainingBudget === -2000 &&
        overBudgetUpdate.data.data.percentageUsed === 105,
      'Over-budget detected when totalSpent exceeds totalBudget (overBudget: true, remaining: negative, %: > 100)'
    );

    // 84. Zero-Budget Handling: Update budget to 0 -> 200, handles percentage without NaN/Infinity
    const zeroBudgetUpdate = await request(`/api/trips/${trip1Id}/budget`, {
      method: 'PUT',
      token: token1,
      body: { totalBudget: 0, currency: 'INR' },
    });
    assert(
      zeroBudgetUpdate.status === 200 &&
        zeroBudgetUpdate.data.data.totalBudget === 0 &&
        !isNaN(zeroBudgetUpdate.data.data.percentageUsed) &&
        isFinite(zeroBudgetUpdate.data.data.percentageUsed) &&
        zeroBudgetUpdate.data.data.overBudget === true,
      'Zero-budget configuration handled safely without NaN or Infinity'
    );

    // -------------------------------------------------------------
    // SECTION 7: Phase 5 Calendar, Timeline & Itinerary APIs
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Phase 5 Calendar, Timeline & Itinerary APIs ---');

    // Set up stops and sections on Trip 1 for Calendar & Timeline testing
    const setupStop1 = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      token: token1,
      body: {
        cityId: cityId,
        startDate: '2026-10-01',
        endDate: '2026-10-04',
        order: 1,
      },
    });
    const calStop1Id = setupStop1.data.data.stop._id;

    // Section 1 on calStop1 (2026-10-02, 09:00 - 11:30)
    await request(`/api/trips/${trip1Id}/stops/${calStop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'ACTIVITY',
        title: 'Morning Historical Walk',
        description: 'Guided tour around monuments',
        date: '2026-10-02',
        startTime: '09:00',
        endTime: '11:30',
        estimatedCost: 20,
        activityId: sampleActivity._id,
        order: 1,
      },
    });

    // Section 2 on calStop1 (2026-10-02, 19:00 - 21:00)
    await request(`/api/trips/${trip1Id}/stops/${calStop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'MEAL',
        title: 'Old Town Heritage Dinner',
        description: 'Authentic regional dishes',
        date: '2026-10-02',
        startTime: '19:00',
        endTime: '21:00',
        estimatedCost: 35,
        order: 2,
      },
    });

    // Section 3 on calStop1 (2026-10-03, 14:00 - 16:30)
    await request(`/api/trips/${trip1Id}/stops/${calStop1Id}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        type: 'TRANSPORT',
        title: 'Metro & City Transit',
        description: 'Transiting to arts district',
        date: '2026-10-03',
        startTime: '14:00',
        endTime: '16:30',
        estimatedCost: 10,
        order: 1,
      },
    });

    // 85. GET /api/trips/:id/calendar without token -> 401
    const unauthCal = await request(`/api/trips/${trip1Id}/calendar`);
    assert(unauthCal.status === 401, 'GET /api/trips/:id/calendar without token returns 401');

    // 86. GET /api/trips/:id/calendar for non-owner -> 403
    const nonOwnerCal = await request(`/api/trips/${trip1Id}/calendar`, { token: token2 });
    assert(nonOwnerCal.status === 403, 'GET /api/trips/:id/calendar for non-owner returns 403');

    // 87. GET /api/trips/:id/calendar for invalid trip -> 404
    const invalidTripCal = await request(`/api/trips/6a895d6d57d038761b987eee/calendar`, { token: token1 });
    assert(invalidTripCal.status === 404, 'GET /api/trips/:id/calendar for non-existent trip returns 404');

    // 88. GET /api/trips/:id/calendar returns structured days & events -> 200
    const getCalRes = await request(`/api/trips/${trip1Id}/calendar`, { token: token1 });
    assert(
      getCalRes.status === 200 &&
        getCalRes.data.success === true &&
        getCalRes.data.data.trip._id === trip1Id &&
        getCalRes.data.data.days.length >= 2 &&
        getCalRes.data.data.events.length >= 3 &&
        getCalRes.data.data.events[0].city &&
        getCalRes.data.data.events[0].city.name &&
        getCalRes.data.data.events[0].startTime &&
        getCalRes.data.data.events[0].endTime,
      'GET /api/trips/:id/calendar returns structured days, events, city, activity, and time bounds'
    );

    // 89. GET /api/trips/:id/calendar with date range filtering -> 200
    const filterCalRes = await request(
      `/api/trips/${trip1Id}/calendar?startDate=2026-10-02&endDate=2026-10-02`,
      { token: token1 }
    );
    assert(
      filterCalRes.status === 200 &&
        filterCalRes.data.data.days.length === 1 &&
        filterCalRes.data.data.days[0].date === '2026-10-02' &&
        filterCalRes.data.data.events.every((e: any) => e.date === '2026-10-02'),
      'GET /api/trips/:id/calendar filters events within startDate and endDate'
    );

    // 90. GET /api/trips/:id/calendar with invalid date range (startDate > endDate) -> 400
    const invalidRangeCal = await request(
      `/api/trips/${trip1Id}/calendar?startDate=2026-10-10&endDate=2026-10-02`,
      { token: token1 }
    );
    assert(invalidRangeCal.status === 400, 'GET /api/trips/:id/calendar with startDate > endDate returns 400');

    // 91. GET /api/trips/:id/calendar with invalid date string -> 400
    const invalidDateCal = await request(
      `/api/trips/${trip1Id}/calendar?startDate=not-a-date`,
      { token: token1 }
    );
    assert(invalidDateCal.status === 400, 'GET /api/trips/:id/calendar with invalid date string returns 400');

    // 92. GET /api/trips/:id/timeline without token -> 401
    const unauthTimeline = await request(`/api/trips/${trip1Id}/timeline`);
    assert(unauthTimeline.status === 401, 'GET /api/trips/:id/timeline without token returns 401');

    // 93. GET /api/trips/:id/timeline for non-owner -> 403
    const nonOwnerTimeline = await request(`/api/trips/${trip1Id}/timeline`, { token: token2 });
    assert(nonOwnerTimeline.status === 403, 'GET /api/trips/:id/timeline for non-owner returns 403');

    // 94. GET /api/trips/:id/timeline for invalid trip -> 404
    const invalidTripTimeline = await request(`/api/trips/6a895d6d57d038761b987eee/timeline`, { token: token1 });
    assert(invalidTripTimeline.status === 404, 'GET /api/trips/:id/timeline for non-existent trip returns 404');

    // 95. GET /api/trips/:id/timeline returns chronological combined items -> 200
    const getTimelineRes = await request(`/api/trips/${trip1Id}/timeline`, { token: token1 });
    assert(
      getTimelineRes.status === 200 &&
        getTimelineRes.data.success === true &&
        getTimelineRes.data.data.timeline.length >= 4 &&
        getTimelineRes.data.data.timeline[0].itemType === 'STOP',
      'GET /api/trips/:id/timeline returns combined chronological events (Stops + Sections)'
    );

    // 96. Timeline item schema and sorting validation
    const timelineItems = getTimelineRes.data.data.timeline;
    const isSorted = timelineItems.every((item: any, i: number) => {
      if (i === 0) return true;
      return item.date >= timelineItems[i - 1].date;
    });
    assert(
      isSorted &&
        timelineItems.some((item: any) => item.itemType === 'STOP' && item.city) &&
        timelineItems.some((item: any) => item.itemType === 'SECTION' && item.type === 'ACTIVITY'),
      'Timeline items are strictly chronological and contain full metadata (type, city, activity, cost)'
    );

    // 97. GET /api/trips/:id/timeline with date filtering -> 200
    const filterTimelineRes = await request(
      `/api/trips/${trip1Id}/timeline?startDate=2026-10-02&endDate=2026-10-03`,
      { token: token1 }
    );
    assert(
      filterTimelineRes.status === 200 &&
        filterTimelineRes.data.data.timeline.length >= 3 &&
        filterTimelineRes.data.data.timeline.every((item: any) => item.date >= '2026-10-02' && item.date <= '2026-10-03'),
      'GET /api/trips/:id/timeline filters timeline items within specified date bounds'
    );

    // 98. GET /api/trips/:id/timeline with invalid date range -> 400
    const invalidRangeTimeline = await request(
      `/api/trips/${trip1Id}/timeline?startDate=2026-10-08&endDate=2026-10-02`,
      { token: token1 }
    );
    assert(invalidRangeTimeline.status === 400, 'GET /api/trips/:id/timeline with startDate > endDate returns 400');

    // 99. Complete Itinerary hierarchy validation (GET /api/trips/:id/itinerary)
    const completeItineraryRes = await request(`/api/trips/${trip1Id}/itinerary`, { token: token1 });
    assert(
      completeItineraryRes.status === 200 &&
        completeItineraryRes.data.data.stops.length >= 1 &&
        completeItineraryRes.data.data.stops.some(
          (s: any) => s.city && s.sections.length >= 3 && s.sections[0].title
        ),
      'GET /api/trips/:id/itinerary delivers complete hierarchical Trip -> Stop -> Section structure'
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

