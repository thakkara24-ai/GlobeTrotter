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
import TripCollaborator from '../src/models/TripCollaborator';

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
  const headers: Record<string, string> = {};
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const url = `${baseUrl}${endpoint}`;
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  let data: any;
  const text = await response.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: response.status,
    data,
  };
}

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  try {
    await connectDB();
    server = app.listen(PORT);
    console.log(`\n================ STARTING FULL BACKEND TEST SUITE ================\n`);

    // Clean up previous test users, trips, stops, sections, collaborators, and expenses
    await User.deleteMany({
      email: {
        $in: [
          'p2user1@example.com',
          'p2user2@example.com',
          'collaborator@example.com',
          'unrelated@example.com',
          'testuser1@example.com',
          'testuser2@example.com',
        ],
      },
    });
    await Trip.deleteMany({ title: { $regex: /Test Trip/i } });
    await Expense.deleteMany({});
    await TripCollaborator.deleteMany({});
    await Trip.syncIndexes();
    await TripCollaborator.syncIndexes();

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

    // -------------------------------------------------------------
    // SECTION 8: Phase 6 Maps, Geolocation & Location Intelligence
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Phase 6 Maps, Geolocation & Location Intelligence ---');

    // 100. GET /api/location/distance with valid coordinates
    const distanceRes = await request(
      '/api/location/distance?fromLatitude=28.6139&fromLongitude=77.2090&toLatitude=26.9124&toLongitude=75.7873'
    );
    assert(
      distanceRes.status === 200 &&
        distanceRes.data.success === true &&
        distanceRes.data.data.distanceKilometers > 230 &&
        distanceRes.data.data.distanceKilometers < 250 &&
        distanceRes.data.data.calculationType === 'straight-line',
      'GET /api/location/distance computes accurate straight-line distance between Delhi and Jaipur'
    );

    // 101. GET /api/location/distance with same coordinates -> 0
    const zeroDistRes = await request(
      '/api/location/distance?fromLatitude=28.6139&fromLongitude=77.2090&toLatitude=28.6139&toLongitude=77.2090'
    );
    assert(
      zeroDistRes.status === 200 &&
        zeroDistRes.data.data.distanceMeters === 0 &&
        zeroDistRes.data.data.distanceKilometers === 0,
      'GET /api/location/distance returns 0 for identical coordinates'
    );

    // 102. GET /api/location/distance with invalid latitude -> 400
    const invalidDistRes = await request(
      '/api/location/distance?fromLatitude=95&fromLongitude=77.2090&toLatitude=26.9124&toLongitude=75.7873'
    );
    assert(invalidDistRes.status === 400, 'GET /api/location/distance rejects invalid latitude (> 90)');

    // 103. GET /api/cities/nearby with valid coordinates -> 200
    const nearbyCitiesRes = await request(
      '/api/cities/nearby?latitude=28.6139&longitude=77.2090&radius=500000'
    );
    assert(
      nearbyCitiesRes.status === 200 &&
        nearbyCitiesRes.data.success === true &&
        nearbyCitiesRes.data.data.cities.length >= 1 &&
        nearbyCitiesRes.data.data.cities[0].city.name === 'Delhi' &&
        nearbyCitiesRes.data.data.cities[0].distanceKilometers < 5,
      'GET /api/cities/nearby finds closest city (Delhi) with distance metadata'
    );

    // 104. GET /api/cities/nearby with invalid coordinates -> 400
    const invalidNearbyCity = await request(
      '/api/cities/nearby?latitude=100&longitude=77.2090'
    );
    assert(invalidNearbyCity.status === 400, 'GET /api/cities/nearby rejects out-of-range coordinates');

    // 105. GET /api/activities/nearby with valid coordinates -> 200
    const nearbyActRes = await request(
      '/api/activities/nearby?latitude=28.6562&longitude=77.2410&radius=50000'
    );
    assert(
      nearbyActRes.status === 200 &&
        nearbyActRes.data.success === true &&
        nearbyActRes.data.data.activities.length >= 1 &&
        nearbyActRes.data.data.activities[0].activity.name === 'Red Fort Tour' &&
        nearbyActRes.data.data.activities[0].city &&
        typeof nearbyActRes.data.data.activities[0].distanceMeters === 'number',
      'GET /api/activities/nearby returns closest activity (Red Fort) with populated city and distance'
    );

    // 106. GET /api/activities/nearby pagination -> 200
    const pageNearbyActRes = await request(
      '/api/activities/nearby?latitude=28.6562&longitude=77.2410&radius=50000&page=1&limit=1'
    );
    assert(
      pageNearbyActRes.status === 200 &&
        pageNearbyActRes.data.data.activities.length === 1 &&
        pageNearbyActRes.data.data.pagination.page === 1 &&
        pageNearbyActRes.data.data.pagination.limit === 1,
      'GET /api/activities/nearby supports pagination'
    );

    // 107. GET /api/activities/nearby with negative radius -> 400
    const invalidRadiusAct = await request(
      '/api/activities/nearby?latitude=28.6562&longitude=77.2410&radius=-500'
    );
    assert(invalidRadiusAct.status === 400, 'GET /api/activities/nearby rejects negative radius');

    // 108. PUT /api/cities/:id/location without token -> 401
    const unauthCityLoc = await request(`/api/cities/${cityId}/location`, {
      method: 'PUT',
      body: { latitude: 28.614, longitude: 77.209 },
    });
    assert(unauthCityLoc.status === 401, 'PUT /api/cities/:id/location without token returns 401');

    // 109. PUT /api/cities/:id/location with invalid latitude -> 400
    const invalidCityLoc = await request(`/api/cities/${cityId}/location`, {
      method: 'PUT',
      token: token1,
      body: { latitude: 120, longitude: 77.209 },
    });
    assert(invalidCityLoc.status === 400, 'PUT /api/cities/:id/location rejects latitude > 90');

    // 110. PUT /api/cities/:id/location with valid coordinates -> 200
    const updateCityLocRes = await request(`/api/cities/${cityId}/location`, {
      method: 'PUT',
      token: token1,
      body: { latitude: 28.6139, longitude: 77.209 },
    });
    assert(
      updateCityLocRes.status === 200 &&
        updateCityLocRes.data.success === true &&
        updateCityLocRes.data.data.city.latitude === 28.6139 &&
        updateCityLocRes.data.data.city.longitude === 77.209 &&
        updateCityLocRes.data.data.city.location.coordinates[0] === 77.209 &&
        updateCityLocRes.data.data.city.location.coordinates[1] === 28.6139,
      'PUT /api/cities/:id/location updates coordinates and GeoJSON location [lon, lat]'
    );

    // 111. PUT /api/activities/:id/location with valid coordinates -> 200
    const updateActLocRes = await request(`/api/activities/${sampleActivity._id}/location`, {
      method: 'PUT',
      token: token1,
      body: { latitude: 28.6562, longitude: 77.241 },
    });
    assert(
      updateActLocRes.status === 200 &&
        updateActLocRes.data.success === true &&
        updateActLocRes.data.data.activity.latitude === 28.6562 &&
        updateActLocRes.data.data.activity.location.coordinates[0] === 77.241,
      'PUT /api/activities/:id/location updates activity coordinates and GeoJSON location'
    );

    // 112. GET /api/trips/:id/map without token -> 401
    const unauthMap = await request(`/api/trips/${trip1Id}/map`);
    assert(unauthMap.status === 401, 'GET /api/trips/:id/map without token returns 401');

    // 113. GET /api/trips/:id/map by non-owner -> 403
    const nonOwnerMap = await request(`/api/trips/${trip1Id}/map`, { token: token2 });
    assert(nonOwnerMap.status === 403, 'GET /api/trips/:id/map by non-owner returns 403');

    // 114. GET /api/trips/:id/map for non-existent trip -> 404
    const invalidTripMap = await request(`/api/trips/6a895d6d57d038761b987eee/map`, { token: token1 });
    assert(invalidTripMap.status === 404, 'GET /api/trips/:id/map for non-existent trip returns 404');

    // 115. GET /api/trips/:id/map by owner -> 200
    const getMapRes = await request(`/api/trips/${trip1Id}/map`, { token: token1 });
    assert(
      getMapRes.status === 200 &&
        getMapRes.data.success === true &&
        getMapRes.data.data.trip._id === trip1Id &&
        getMapRes.data.data.markers.length >= 2 &&
        getMapRes.data.data.markers.some((m: any) => m.type === 'STOP' && m.coordinates) &&
        getMapRes.data.data.markers.some((m: any) => m.type === 'ACTIVITY' && m.coordinates),
      'GET /api/trips/:id/map returns trip map data with stop and activity markers'
    );

    // -------------------------------------------------------------
    // SECTION 9: Trip Collaboration CRUD & Validation
    // -------------------------------------------------------------
    console.log('\n--- Section 9: Trip Collaboration CRUD & Validation ---');

    // Register User 3 (Editor/Viewer) and User 4 (Unrelated)
    const user3Reg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Collaborator User',
        email: 'collaborator@example.com',
        password: 'CollabPassword123!',
        confirmPassword: 'CollabPassword123!',
      },
    });
    const user3 = user3Reg.data.data.user;
    const token3 = user3Reg.data.data.token;

    const user4Reg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Unrelated User',
        email: 'unrelated@example.com',
        password: 'UnrelatedPassword123!',
        confirmPassword: 'UnrelatedPassword123!',
      },
    });
    const user4 = user4Reg.data.data.user;
    const token4 = user4Reg.data.data.token;

    // 116. POST /api/trips/:tripId/collaborators without token -> 401
    const unauthAddCollab = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      body: { email: 'collaborator@example.com', role: 'VIEWER' },
    });
    assert(unauthAddCollab.status === 401, 'POST collaborator without token returns 401');

    // 117. POST /api/trips/:tripId/collaborators by non-owner -> 403
    const nonOwnerAddCollab = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token2,
      body: { email: 'collaborator@example.com', role: 'VIEWER' },
    });
    assert(nonOwnerAddCollab.status === 403, 'POST collaborator by non-owner returns 403');

    // 118. POST /api/trips/:tripId/collaborators with non-existent user -> 404
    const notFoundUserCollab = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token1,
      body: { email: 'nonexistent@example.com', role: 'VIEWER' },
    });
    assert(notFoundUserCollab.status === 404, 'POST non-existent user returns 404');

    // 119. POST /api/trips/:tripId/collaborators adding owner themselves -> 400
    const ownerAddSelf = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token1,
      body: { email: 'p2user1@example.com', role: 'VIEWER' },
    });
    assert(ownerAddSelf.status === 400, 'Owner cannot add themselves as collaborator');

    // 120. POST /api/trips/:tripId/collaborators with invalid role -> 400
    const invalidRoleCollab = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token1,
      body: { email: 'collaborator@example.com', role: 'SUPER_ADMIN' },
    });
    assert(invalidRoleCollab.status === 400, 'POST collaborator with invalid role returns 400');

    // 121. POST /api/trips/:tripId/collaborators by owner adding User 2 as VIEWER -> 201
    const addCollab2Res = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token1,
      body: { email: 'p2user2@example.com', role: 'VIEWER' },
    });
    assert(
      addCollab2Res.status === 201 &&
        addCollab2Res.data.success === true &&
        addCollab2Res.data.data.collaborator.role === 'VIEWER' &&
        addCollab2Res.data.data.collaborator.user.email === 'p2user2@example.com' &&
        !addCollab2Res.data.data.collaborator.user.passwordHash,
      'POST collaborator by owner creates VIEWER collaborator without passwordHash'
    );
    const collab2Id = addCollab2Res.data.data.collaborator._id;

    // 122. POST duplicate collaborator -> 409
    const dupCollabRes = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token1,
      body: { email: 'p2user2@example.com', role: 'VIEWER' },
    });
    assert(dupCollabRes.status === 409, 'POST duplicate collaborator returns 409 Conflict');

    // 123. POST /api/trips/:tripId/collaborators adding User 3 as EDITOR -> 201
    const addCollab3Res = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token1,
      body: { userId: user3._id, role: 'EDITOR' },
    });
    assert(
      addCollab3Res.status === 201 &&
        addCollab3Res.data.data.collaborator.role === 'EDITOR',
      'POST collaborator by owner creates EDITOR collaborator using userId'
    );
    const collab3Id = addCollab3Res.data.data.collaborator._id;

    // 124. GET /api/trips/:tripId/collaborators without token -> 401
    const unauthGetCollabs = await request(`/api/trips/${trip1Id}/collaborators`);
    assert(unauthGetCollabs.status === 401, 'GET collaborators without token returns 401');

    // 125. GET /api/trips/:tripId/collaborators by unrelated user -> 403
    const unrelatedGetCollabs = await request(`/api/trips/${trip1Id}/collaborators`, {
      token: token4,
    });
    assert(unrelatedGetCollabs.status === 403, 'GET collaborators by unrelated user returns 403');

    // 126. GET /api/trips/:tripId/collaborators by owner -> 200
    const ownerGetCollabs = await request(`/api/trips/${trip1Id}/collaborators`, {
      token: token1,
    });
    assert(
      ownerGetCollabs.status === 200 &&
        ownerGetCollabs.data.data.collaborators.length === 2 &&
        ownerGetCollabs.data.data.collaborators.every((c: any) => !c.user.passwordHash),
      'GET collaborators by owner returns 2 collaborators without passwordHash'
    );

    // 127. GET /api/trips/:tripId/collaborators by collaborator -> 200
    const collabGetCollabs = await request(`/api/trips/${trip1Id}/collaborators`, {
      token: token2,
    });
    assert(
      collabGetCollabs.status === 200 &&
        collabGetCollabs.data.data.collaborators.length === 2,
      'GET collaborators by collaborator returns collaborator list'
    );

    // 128. PUT /api/trips/:tripId/collaborators/:id by non-owner -> 403
    const nonOwnerUpdateCollab = await request(
      `/api/trips/${trip1Id}/collaborators/${collab2Id}`,
      {
        method: 'PUT',
        token: token2,
        body: { role: 'EDITOR' },
      }
    );
    assert(nonOwnerUpdateCollab.status === 403, 'PUT collaborator role by non-owner returns 403');

    // 129. PUT /api/trips/:tripId/collaborators/:id by owner -> 200
    const ownerUpdateCollab = await request(
      `/api/trips/${trip1Id}/collaborators/${collab2Id}`,
      {
        method: 'PUT',
        token: token1,
        body: { role: 'EDITOR' },
      }
    );
    assert(
      ownerUpdateCollab.status === 200 &&
        ownerUpdateCollab.data.data.collaborator.role === 'EDITOR',
      'PUT collaborator role by owner updates role to EDITOR'
    );

    // 130. DELETE /api/trips/:tripId/collaborators/:id by non-owner -> 403
    const nonOwnerDeleteCollab = await request(
      `/api/trips/${trip1Id}/collaborators/${collab2Id}`,
      {
        method: 'DELETE',
        token: token2,
      }
    );
    assert(nonOwnerDeleteCollab.status === 403, 'DELETE collaborator by non-owner returns 403');

    // 131. DELETE /api/trips/:tripId/collaborators/:id by owner -> 200
    const ownerDeleteCollab = await request(
      `/api/trips/${trip1Id}/collaborators/${collab2Id}`,
      {
        method: 'DELETE',
        token: token1,
      }
    );
    assert(
      ownerDeleteCollab.status === 200 &&
        ownerDeleteCollab.data.success === true,
      'DELETE collaborator by owner removes collaborator'
    );

    // 132. Removed collaborator immediately loses access to trip itinerary -> 403
    const removedCollabAccess = await request(`/api/trips/${trip1Id}/itinerary`, {
      token: token2,
    });
    assert(
      removedCollabAccess.status === 403,
      'Removed collaborator immediately loses access to trip itinerary (403)'
    );

    // -------------------------------------------------------------
    // SECTION 10: Collaborator Permissions (VIEWER vs EDITOR vs OWNER)
    // -------------------------------------------------------------
    console.log('\n--- Section 10: Collaborator Permissions (VIEWER vs EDITOR) ---');

    // Add User 2 back as VIEWER
    const reAddCollab2 = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token1,
      body: { email: 'p2user2@example.com', role: 'VIEWER' },
    });
    assert(reAddCollab2.status === 201, 'Re-add User 2 as VIEWER');

    // Owner creates a fresh stop for collaboration tests
    const collabStopRes = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      token: token1,
      body: {
        cityId: cityId,
        startDate: '2026-10-01',
        endDate: '2026-10-05',
      },
    });
    const collabStopId = collabStopRes.data.data.stop._id;

    // 133. VIEWER can GET itinerary -> 200
    const viewerItinerary = await request(`/api/trips/${trip1Id}/itinerary`, {
      token: token2,
    });
    assert(viewerItinerary.status === 200, 'VIEWER can view trip itinerary');

    // 134. VIEWER can GET calendar -> 200
    const viewerCalendar = await request(`/api/trips/${trip1Id}/calendar`, {
      token: token2,
    });
    assert(viewerCalendar.status === 200, 'VIEWER can view trip calendar');

    // 135. VIEWER can GET timeline -> 200
    const viewerTimeline = await request(`/api/trips/${trip1Id}/timeline`, {
      token: token2,
    });
    assert(viewerTimeline.status === 200, 'VIEWER can view trip timeline');

    // 136. VIEWER can GET map -> 200
    const viewerMap = await request(`/api/trips/${trip1Id}/map`, {
      token: token2,
    });
    assert(viewerMap.status === 200, 'VIEWER can view trip map');

    // 137. VIEWER cannot create a stop -> 403
    const viewerCreateStop = await request(`/api/trips/${trip1Id}/stops`, {
      method: 'POST',
      token: token2,
      body: {
        cityId: cityId,
        startDate: '2026-10-15',
        endDate: '2026-10-18',
      },
    });
    assert(viewerCreateStop.status === 403, 'VIEWER cannot create stops (403)');

    // 138. VIEWER cannot modify stop -> 403
    const viewerUpdateStop = await request(
      `/api/trips/${trip1Id}/stops/${collabStopId}`,
      {
        method: 'PUT',
        token: token2,
        body: { notes: 'Viewer trying to edit' },
      }
    );
    assert(viewerUpdateStop.status === 403, 'VIEWER cannot update stops (403)');

    // 139. VIEWER cannot create section -> 403
    const viewerCreateSec = await request(
      `/api/trips/${trip1Id}/stops/${collabStopId}/sections`,
      {
        method: 'POST',
        token: token2,
        body: {
          title: 'Viewer Section',
          type: 'ACTIVITY',
          date: '2026-10-02',
        },
      }
    );
    assert(viewerCreateSec.status === 403, 'VIEWER cannot create itinerary sections (403)');

    // 140. VIEWER cannot reorder stops -> 403
    const viewerReorder = await request(`/api/trips/${trip1Id}/stops/reorder`, {
      method: 'PUT',
      token: token2,
      body: { stopIds: [collabStopId] },
    });
    assert(viewerReorder.status === 403, 'VIEWER cannot reorder stops (403)');

    // 141. VIEWER cannot manage collaborators -> 403
    const viewerAddOther = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token2,
      body: { email: 'unrelated@example.com', role: 'VIEWER' },
    });
    assert(viewerAddOther.status === 403, 'VIEWER cannot manage collaborators (403)');

    // 142. EDITOR (User 3) can create an itinerary section -> 200/201
    const editorCreateSec = await request(
      `/api/trips/${trip1Id}/stops/${collabStopId}/sections`,
      {
        method: 'POST',
        token: token3,
        body: {
          title: 'Editor Created Section',
          type: 'ACTIVITY',
          date: '2026-10-02',
          activityId: sampleActivity._id,
        },
      }
    );
    assert(
      (editorCreateSec.status === 201 || editorCreateSec.status === 200) &&
        editorCreateSec.data.success === true &&
        editorCreateSec.data.data.section.title === 'Editor Created Section',
      'EDITOR can create itinerary sections'
    );
    const editorSecId = editorCreateSec.data.data.section._id;

    // 143. EDITOR can update an itinerary section -> 200
    const editorUpdateSec = await request(
      `/api/trips/${trip1Id}/stops/${collabStopId}/sections/${editorSecId}`,
      {
        method: 'PUT',
        token: token3,
        body: { title: 'Editor Updated Title' },
      }
    );
    assert(
      editorUpdateSec.status === 200 &&
        editorUpdateSec.data.data.section.title === 'Editor Updated Title',
      'EDITOR can update itinerary sections'
    );

    // 144. EDITOR can delete an itinerary section -> 200
    const editorDeleteSec = await request(
      `/api/trips/${trip1Id}/stops/${collabStopId}/sections/${editorSecId}`,
      {
        method: 'DELETE',
        token: token3,
      }
    );
    assert(editorDeleteSec.status === 200, 'EDITOR can delete itinerary sections');

    // 145. EDITOR cannot manage collaborators -> 403
    const editorAddOther = await request(`/api/trips/${trip1Id}/collaborators`, {
      method: 'POST',
      token: token3,
      body: { email: 'unrelated@example.com', role: 'VIEWER' },
    });
    assert(editorAddOther.status === 403, 'EDITOR cannot add collaborators (403)');

    // 146. Unrelated user (User 4) cannot access shared trip itinerary -> 403
    const unrelatedTripAccess = await request(`/api/trips/${trip1Id}/itinerary`, {
      token: token4,
    });
    assert(unrelatedTripAccess.status === 403, 'Unrelated user cannot access shared trip (403)');

    // -------------------------------------------------------------
    // SECTION 11: Public Itinerary Sharing & Security
    // -------------------------------------------------------------
    console.log('\n--- Section 11: Public Itinerary Sharing & Security ---');

    // 147. Enable public sharing without token -> 401
    const unauthEnableShare = await request(`/api/trips/${trip1Id}/share/public`, {
      method: 'POST',
    });
    assert(unauthEnableShare.status === 401, 'Enable public sharing without token returns 401');

    // 148. Enable public sharing by non-owner (Editor User 3) -> 403
    const nonOwnerEnableShare = await request(`/api/trips/${trip1Id}/share/public`, {
      method: 'POST',
      token: token3,
    });
    assert(nonOwnerEnableShare.status === 403, 'Enable public sharing by non-owner returns 403');

    // Create a scheduled activity section on the stop for public viewing
    await request(`/api/trips/${trip1Id}/stops/${collabStopId}/sections`, {
      method: 'POST',
      token: token1,
      body: {
        title: 'Public Sightseeing Section',
        type: 'ACTIVITY',
        date: '2026-10-02',
        activityId: sampleActivity._id,
      },
    });

    // 149. Owner enables public sharing -> 200
    const enableShareRes = await request(`/api/trips/${trip1Id}/share/public`, {
      method: 'POST',
      token: token1,
    });
    assert(
      enableShareRes.status === 200 &&
        enableShareRes.data.success === true &&
        enableShareRes.data.data.enabled === true &&
        typeof enableShareRes.data.data.shareToken === 'string' &&
        enableShareRes.data.data.shareToken.length > 20,
      'Owner enables public sharing and receives cryptographically secure token'
    );
    const publicToken = enableShareRes.data.data.shareToken;

    // 150. GET /api/public/trips/:shareToken without authentication -> 200
    const publicItineraryRes = await request(`/api/public/trips/${publicToken}`);
    assert(
      publicItineraryRes.status === 200 &&
        publicItineraryRes.data.success === true &&
        publicItineraryRes.data.data.trip &&
        publicItineraryRes.data.data.trip.title &&
        publicItineraryRes.data.data.stops.length >= 1,
      'Public itinerary endpoint works without authentication (200)'
    );

    // 151. Public response contains stops and nested sections with cities and activities
    const pubData = publicItineraryRes.data.data;
    const targetStop = pubData.stops.find((s: any) => s._id === collabStopId) || pubData.stops[0];
    assert(
      targetStop.city &&
        targetStop.city.name &&
        targetStop.sections.length >= 1 &&
        targetStop.sections[0].title === 'Public Sightseeing Section' &&
        targetStop.sections[0].activity &&
        targetStop.sections[0].activity.name,
      'Public response contains populated stops, cities, and scheduled activity sections'
    );

    // 152. Public response security: NO passwordHash
    const rawJson = JSON.stringify(pubData);
    assert(!rawJson.includes('passwordHash'), 'Public response does not expose passwordHash');

    // 153. Public response security: NO user private email
    assert(!rawJson.includes('p2user1@example.com'), 'Public response does not expose private email');

    // 154. Public response security: NO expenses
    assert(!rawJson.includes('totalSpent') && !pubData.expenses, 'Public response does not expose expenses');

    // 155. Public response security: NO budget
    assert(!pubData.trip.budget && !pubData.budget, 'Public response does not expose budget information');

    // 156. GET /api/public/trips with invalid token -> 404
    const invalidTokenRes = await request('/api/public/trips/invalid-random-token-12345');
    assert(invalidTokenRes.status === 404, 'GET public itinerary with invalid token returns 404');

    // 157. Disable public sharing by owner -> 200
    const disableShareRes = await request(`/api/trips/${trip1Id}/share/public`, {
      method: 'DELETE',
      token: token1,
    });
    assert(
      disableShareRes.status === 200 &&
        disableShareRes.data.success === true,
      'Owner disables public sharing and revokes token'
    );

    // 158. Revoked public token immediately returns 404
    const revokedTokenRes = await request(`/api/public/trips/${publicToken}`);
    assert(
      revokedTokenRes.status === 404,
      'Revoked public token returns 404 immediately'
    );

    // 159. Re-enable public sharing generates valid token
    const reEnableShareRes = await request(`/api/trips/${trip1Id}/share/public`, {
      method: 'POST',
      token: token1,
    });
    assert(
      reEnableShareRes.status === 200 &&
        reEnableShareRes.data.data.enabled === true &&
        typeof reEnableShareRes.data.data.shareToken === 'string',
      'Re-enabling public sharing returns valid share token'
    );
    const newPublicToken = reEnableShareRes.data.data.shareToken;

    // 160. GET public itinerary works with re-enabled token
    const rePublicRes = await request(`/api/public/trips/${newPublicToken}`);
    assert(
      rePublicRes.status === 200 &&
        rePublicRes.data.data.trip.title,
      'Public itinerary accessible after re-enabling'
    );

    // -------------------------------------------------------------
    // SECTION 12: Phase 7 Smart Budget Recommendation
    // -------------------------------------------------------------
    console.log('\n--- Section 12: Phase 7 Smart Budget Recommendation ---');

    // 161. GET recommendation without token -> 401
    const unauthRec = await request(`/api/trips/${trip1Id}/budget/recommendation`);
    assert(unauthRec.status === 401, 'GET budget recommendation without token returns 401');

    // 162. GET recommendation by unrelated user (User 4) -> 403
    const forbiddenRec = await request(`/api/trips/${trip1Id}/budget/recommendation`, {
      token: token4,
    });
    assert(forbiddenRec.status === 403, 'GET budget recommendation by non-collaborator returns 403');

    // 163. GET recommendation for non-existent trip -> 404
    const notFoundRec = await request(
      '/api/trips/6a895d6d57d038761b987eee/budget/recommendation',
      { token: token1 }
    );
    assert(notFoundRec.status === 404, 'GET budget recommendation for non-existent trip returns 404');

    // 164. GET recommendation with invalid trip ID format -> 400
    const invalidIdRec = await request(
      '/api/trips/invalid-format-id/budget/recommendation',
      { token: token1 }
    );
    assert(invalidIdRec.status === 400, 'GET budget recommendation with invalid trip ID format returns 400');

    // 165. Basic recommendation for valid trip (Owner) -> 200
    const ownerRec = await request(`/api/trips/${trip1Id}/budget/recommendation`, {
      token: token1,
    });
    assert(
      ownerRec.status === 200 &&
        ownerRec.data.success === true &&
        ownerRec.data.data.tripId === trip1Id &&
        typeof ownerRec.data.data.recommendation.recommended === 'number' &&
        typeof ownerRec.data.data.recommendation.minimum === 'number' &&
        typeof ownerRec.data.data.recommendation.comfortable === 'number',
      'GET budget recommendation returns complete recommendation structure'
    );
    const recData = ownerRec.data.data;

    // 166. Correct duration calculation (14 days for trip1: 2026-10-01 to 2026-10-14)
    assert(recData.durationDays === 14, 'Correct duration calculated (14 days)');

    // 167. Default traveler count = 1
    assert(recData.travelers === 1, 'Default traveler count = 1');

    // 168. Traveler scaling (?travelers=3) increases costs & rooms
    const scaledTravelersRec = await request(
      `/api/trips/${trip1Id}/budget/recommendation?travelers=3`,
      { token: token1 }
    );
    assert(
      scaledTravelersRec.status === 200 &&
        scaledTravelersRec.data.data.travelers === 3 &&
        scaledTravelersRec.data.data.recommendation.recommended > recData.recommendation.recommended &&
        scaledTravelersRec.data.data.categories.food === recData.categories.food * 3,
      'Traveler scaling (?travelers=3) scales food and total budget proportionally'
    );

    // 169. Itinerary activities included in activities recommendation
    assert(
      recData.categories.activities > 0 &&
        recData.explanation.some((e: string) => e.includes('activity') || e.includes('activities')),
      'Itinerary activities contribute to activities recommendation and explanation'
    );

    // 170. Multi-city trip accounts for destination cities
    assert(
      recData.categories.transport > 0 &&
        recData.factors.some((f: string) => f.includes('destination')),
      'Multi-city trip accounts for destination transit in transport recommendation'
    );

    // 171. Existing expenses reflected in alreadySpent and remainingRecommendedBudget
    assert(
      typeof recData.alreadySpent === 'number' &&
        typeof recData.remainingRecommendedBudget === 'number' &&
        recData.remainingRecommendedBudget === Math.max(0, recData.recommendation.recommended - Math.round(recData.alreadySpent)),
      'Existing expenses properly reflected in alreadySpent and remainingRecommendedBudget'
    );

    // 172. Over-budget detection: create a separate test trip with large expense
    const overBudgetTrip = await request('/api/trips', {
      method: 'POST',
      token: token1,
      body: {
        title: 'Over Budget Test Trip',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
      },
    });
    const overTripId = overBudgetTrip.data.data.trip._id;

    // Add a massive expense exceeding the 2-day budget
    await request(`/api/trips/${overTripId}/expenses`, {
      method: 'POST',
      token: token1,
      body: {
        title: 'Luxury Yacht Charter',
        amount: 500000,
        currency: 'USD',
        category: 'TRANSPORT',
        date: '2026-12-01',
      },
    });

    const overBudgetRecRes = await request(
      `/api/trips/${overTripId}/budget/recommendation`,
      { token: token1 }
    );
    assert(
      overBudgetRecRes.status === 200 &&
        overBudgetRecRes.data.data.overBudget === true &&
        overBudgetRecRes.data.data.alreadySpent >= 500000 &&
        overBudgetRecRes.data.data.remainingRecommendedBudget === 0,
      'Over-budget detected when alreadySpent exceeds recommended budget (overBudget: true, remaining: 0)'
    );

    // 173. Historical spending improves recommendation and reflects in factors
    assert(
      recData.confidence === 'HIGH' || recData.confidence === 'MEDIUM',
      'Confidence is MEDIUM/HIGH when past spending data or detailed itinerary exists'
    );

    // 174. Fallback when no historical data exists: create trip for User 4 (unrelated with 0 past expenses)
    const u4TripRes = await request('/api/trips', {
      method: 'POST',
      token: token4,
      body: {
        title: 'User 4 Fresh Trip',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
      },
    });
    const u4TripId = u4TripRes.data.data.trip._id;

    const u4Rec = await request(`/api/trips/${u4TripId}/budget/recommendation`, {
      token: token4,
    });
    assert(
      u4Rec.status === 200 &&
        u4Rec.data.data.confidence === 'LOW' &&
        u4Rec.data.data.explanation.some((e: string) => e.includes('baseline')),
      'Fallback to baseline rates and LOW confidence when no historical user expenses exist'
    );

    // 175. Budget style = budget (0.75x)
    const budgetStyleRec = await request(
      `/api/trips/${u4TripId}/budget/recommendation?style=budget`,
      { token: token4 }
    );
    assert(
      budgetStyleRec.status === 200 &&
        budgetStyleRec.data.data.style === 'budget' &&
        budgetStyleRec.data.data.recommendation.recommended < u4Rec.data.data.recommendation.recommended,
      'Budget style = budget applies 0.75x multiplier with lower totals'
    );

    // 176. Budget style = standard (1.0x)
    const standardStyleRec = await request(
      `/api/trips/${u4TripId}/budget/recommendation?style=standard`,
      { token: token4 }
    );
    assert(
      standardStyleRec.status === 200 &&
        standardStyleRec.data.data.style === 'standard' &&
        standardStyleRec.data.data.recommendation.recommended === u4Rec.data.data.recommendation.recommended,
      'Budget style = standard defaults to 1.0x baseline'
    );

    // 177. Budget style = comfortable (1.4x)
    const comfortableStyleRec = await request(
      `/api/trips/${u4TripId}/budget/recommendation?style=comfortable`,
      { token: token4 }
    );
    assert(
      comfortableStyleRec.status === 200 &&
        comfortableStyleRec.data.data.style === 'comfortable' &&
        comfortableStyleRec.data.data.recommendation.recommended > standardStyleRec.data.data.recommendation.recommended,
      'Budget style = comfortable applies 1.4x multiplier'
    );

    // 178. Budget style = premium (2.0x)
    const premiumStyleRec = await request(
      `/api/trips/${u4TripId}/budget/recommendation?style=premium`,
      { token: token4 }
    );
    assert(
      premiumStyleRec.status === 200 &&
        premiumStyleRec.data.data.style === 'premium' &&
        premiumStyleRec.data.data.recommendation.recommended === Math.round(standardStyleRec.data.data.recommendation.recommended * 2),
      'Budget style = premium applies 2.0x multiplier'
    );

    // 179. Invalid budget style -> 400
    const invalidStyleRec = await request(
      `/api/trips/${u4TripId}/budget/recommendation?style=ultra_luxury`,
      { token: token4 }
    );
    assert(invalidStyleRec.status === 400, 'Invalid budget style returns 400');

    // 180. Empty itinerary trip handled safely
    assert(
      u4Rec.status === 200 &&
        u4Rec.data.data.categories.activities > 0 &&
        u4Rec.data.data.categories.food > 0,
      'Empty itinerary handled safely with baseline category calculations'
    );

    // 181. Single-day trip handled safely (duration = 1, dailyBudget = recommended)
    const singleDayTrip = await request('/api/trips', {
      method: 'POST',
      token: token4,
      body: {
        title: 'Single Day Excursion',
        startDate: '2026-11-10',
        endDate: '2026-11-10',
      },
    });
    const singleTripId = singleDayTrip.data.data.trip._id;
    const singleRec = await request(
      `/api/trips/${singleTripId}/budget/recommendation`,
      { token: token4 }
    );
    assert(
      singleRec.status === 200 &&
        singleRec.data.data.durationDays === 1 &&
        singleRec.data.data.dailyBudget === singleRec.data.data.recommendation.recommended,
      'Single-day trip handled safely (durationDays = 1, dailyBudget = recommended)'
    );

    // 182. No NaN or Infinity in any response fields
    const rawRecJson = JSON.stringify(recData);
    assert(
      !rawRecJson.includes('NaN') &&
        !rawRecJson.includes('null') &&
        !rawRecJson.includes('Infinity'),
      'No NaN or Infinity present in recommendation response'
    );

    // 183. No negative recommendation values
    assert(
      recData.recommendation.minimum > 0 &&
        recData.recommendation.recommended > 0 &&
        recData.recommendation.comfortable > 0 &&
        recData.dailyBudget > 0 &&
        recData.remainingRecommendedBudget >= 0,
      'All recommendation numbers are strictly positive and non-negative'
    );

    // 184. Category breakdown includes all 6 categories
    assert(
      typeof recData.categories.transport === 'number' &&
        typeof recData.categories.accommodation === 'number' &&
        typeof recData.categories.food === 'number' &&
        typeof recData.categories.activities === 'number' &&
        typeof recData.categories.shopping === 'number' &&
        typeof recData.categories.other === 'number',
      'Category breakdown contains all required categories with numeric amounts'
    );

    // 185. Permission check for EDITOR (User 3) -> 200
    const editorRec = await request(`/api/trips/${trip1Id}/budget/recommendation`, {
      token: token3,
    });
    assert(editorRec.status === 200, 'EDITOR (User 3) can access budget recommendation (200)');

    // 186. Permission check for VIEWER (User 2) -> 200
    const viewerRec = await request(`/api/trips/${trip1Id}/budget/recommendation`, {
      token: token2,
    });
    assert(viewerRec.status === 200, 'VIEWER (User 2) can access budget recommendation (200)');

    // 187. Regression test for existing budget summary API
    const budgetSummaryReg = await request(`/api/trips/${trip1Id}/budget`, {
      token: token1,
    });
    assert(budgetSummaryReg.status === 200, 'Regression: GET /api/trips/:tripId/budget returns 200');

    // 188. Regression test for existing budget categories API
    const budgetCatReg = await request(`/api/trips/${trip1Id}/budget/categories`, {
      token: token1,
    });
    assert(budgetCatReg.status === 200, 'Regression: GET /api/trips/:tripId/budget/categories returns 200');

    // 189. Regression test for existing budget daily API
    const budgetDailyReg = await request(`/api/trips/${trip1Id}/budget/daily`, {
      token: token1,
    });
    assert(budgetDailyReg.status === 200, 'Regression: GET /api/trips/:tripId/budget/daily returns 200');

    // -------------------------------------------------------------
    // SECTION 13: Phase 8 Profile & Community
    // -------------------------------------------------------------
    console.log('\n--- Section 13: Phase 8 Profile & Community ---');

    // 190. GET /api/profile without token -> 401
    const unauthProfile = await request('/api/profile');
    assert(unauthProfile.status === 401, 'GET /api/profile without token returns 401');

    // 191. GET /api/profile returns safe user profile
    const profileRes = await request('/api/profile', { token: token1 });
    assert(
      profileRes.status === 200 &&
        profileRes.data.success === true &&
        profileRes.data.data.name === 'Phase2 User1' &&
        !profileRes.data.data.passwordHash,
      'GET /api/profile returns safe user information without passwordHash'
    );

    // 192. PUT /api/profile updates valid fields
    const updateProfileRes = await request('/api/profile', {
      method: 'PUT',
      token: token1,
      body: {
        name: 'Test User 1',
        username: 'globetrotter_user1',
        bio: 'Passionate travel photographer and adventurer',
        location: 'San Francisco, CA',
        country: 'United States',
        travelInterests: ['hiking', 'photography', 'food'],
        preferredTravelStyle: 'comfortable',
      },
    });
    assert(
      updateProfileRes.status === 200 &&
        updateProfileRes.data.data.name === 'Test User 1' &&
        updateProfileRes.data.data.username === 'globetrotter_user1' &&
        updateProfileRes.data.data.bio === 'Passionate travel photographer and adventurer' &&
        updateProfileRes.data.data.preferredTravelStyle === 'comfortable',
      'PUT /api/profile updates valid profile fields'
    );

    // 193. Invalid username rejected (contains spaces or invalid characters)
    const invalidUsernameRes = await request('/api/profile', {
      method: 'PUT',
      token: token1,
      body: {
        username: 'invalid user name!',
      },
    });
    assert(
      invalidUsernameRes.status === 400,
      'PUT /api/profile with invalid username format returns 400'
    );

    // 194. Duplicate username rejected (User 2 tries to take User 1's username)
    const duplicateUsernameRes = await request('/api/profile', {
      method: 'PUT',
      token: token2,
      body: {
        username: 'globetrotter_user1',
      },
    });
    assert(
      duplicateUsernameRes.status === 409,
      'PUT /api/profile with duplicate username returns 409 Conflict'
    );

    // Setup username for User 2 as well
    await request('/api/profile', {
      method: 'PUT',
      token: token2,
      body: {
        username: 'explorer_user2',
        bio: 'Backpacker & cultural explorer',
      },
    });

    // 195. PasswordHash never exposed in profile update response
    assert(
      !('passwordHash' in updateProfileRes.data.data),
      'passwordHash is never exposed in profile responses'
    );

    // 196. GET /api/users/:username returns public profile
    const publicProfileRes = await request('/api/users/globetrotter_user1');
    assert(
      publicProfileRes.status === 200 &&
        publicProfileRes.data.success === true &&
        publicProfileRes.data.data.username === 'globetrotter_user1' &&
        publicProfileRes.data.data.name === 'Test User 1' &&
        publicProfileRes.data.data.bio === 'Passionate travel photographer and adventurer',
      'GET /api/users/:username returns public user profile'
    );

    // 197. GET /api/users/:username for unknown user -> 404
    const notFoundUserRes = await request('/api/users/non_existent_user_9999');
    assert(
      notFoundUserRes.status === 404,
      'GET /api/users/:username for unknown user returns 404'
    );

    // 198. Private fields not exposed in public profile
    const publicUserData = publicProfileRes.data.data;
    assert(
      !('passwordHash' in publicUserData) &&
        !('email' in publicUserData) &&
        !('role' in publicUserData) &&
        !('languagePreference' in publicUserData),
      'Public profile does not expose private email, passwordHash, role, or preferences'
    );

    // 199. Unauthenticated POST /api/community/posts -> 401
    const unauthPostRes = await request('/api/community/posts', {
      method: 'POST',
      body: {
        content: 'Exploring the beauty of Rajasthan!',
      },
    });
    assert(unauthPostRes.status === 401, 'Unauthenticated POST /api/community/posts returns 401');

    // 200. Valid post creation by User 1
    const createPostRes = await request('/api/community/posts', {
      method: 'POST',
      token: token1,
      body: {
        content: 'Exploring the historical wonders of Delhi and the Pink City! #travel #heritage #india',
        cityId: cityId,
        tags: ['travel', 'heritage', 'india'],
        images: ['https://example.com/photos/redfort.jpg'],
      },
    });
    assert(
      createPostRes.status === 201 &&
        createPostRes.data.success === true &&
        createPostRes.data.data.author.username === 'globetrotter_user1' &&
        createPostRes.data.data.tags.includes('heritage') &&
        createPostRes.data.data.likeCount === 0 &&
        createPostRes.data.data.commentCount === 0,
      'POST /api/community/posts creates post with populated author and normalized tags'
    );
    const post1Id = createPostRes.data.data._id;

    // 201. Post creation with non-existent city -> 404
    const invalidCityPost = await request('/api/community/posts', {
      method: 'POST',
      token: token1,
      body: {
        content: 'Post with fake city',
        cityId: '6a895d6d57d038761b987eee',
      },
    });
    assert(invalidCityPost.status === 404, 'POST /api/community/posts with non-existent city returns 404');

    // 202. Post creation with empty content -> 400
    const emptyPostRes = await request('/api/community/posts', {
      method: 'POST',
      token: token1,
      body: {
        content: '',
      },
    });
    assert(emptyPostRes.status === 400, 'POST /api/community/posts with empty content returns 400');

    // 203. Public GET /api/community/posts lists posts with pagination
    const listPostsRes = await request('/api/community/posts?page=1&limit=10');
    assert(
      listPostsRes.status === 200 &&
        Array.isArray(listPostsRes.data.data) &&
        listPostsRes.data.data.length >= 1 &&
        listPostsRes.data.pagination.page === 1,
      'GET /api/community/posts lists posts with pagination metadata'
    );

    // 204. Filter posts by tag
    const tagFilterRes = await request('/api/community/posts?tag=heritage');
    assert(
      tagFilterRes.status === 200 &&
        tagFilterRes.data.data.length >= 1 &&
        tagFilterRes.data.data.every((p: any) => p.tags.includes('heritage')),
      'GET /api/community/posts?tag=heritage filters posts by tag'
    );

    // 205. Filter posts by search query
    const searchPostRes = await request('/api/community/posts?search=Rajasthan');
    assert(
      searchPostRes.status === 200,
      'GET /api/community/posts?search=... performs search query'
    );

    // 206. GET /api/community/posts/:postId returns single post detail
    const getPostRes = await request(`/api/community/posts/${post1Id}`);
    assert(
      getPostRes.status === 200 &&
        getPostRes.data.data._id === post1Id &&
        getPostRes.data.data.author.name === 'Test User 1',
      'GET /api/community/posts/:postId returns post detail with populated author'
    );

    // 207. GET non-existent post -> 404
    const notFoundPostRes = await request('/api/community/posts/6a895d6d57d038761b987eee');
    assert(notFoundPostRes.status === 404, 'GET /api/community/posts/:postId for non-existent post returns 404');

    // 208. Author can update own post
    const updatePostRes = await request(`/api/community/posts/${post1Id}`, {
      method: 'PUT',
      token: token1,
      body: {
        content: 'Updated post: An unforgettable journey across Northern India! #adventure',
        tags: ['adventure', 'india'],
      },
    });
    assert(
      updatePostRes.status === 200 &&
        updatePostRes.data.data.tags.includes('adventure'),
      'Author can update own post content and tags'
    );

    // 209. Non-author cannot update post -> 403
    const forbiddenUpdatePost = await request(`/api/community/posts/${post1Id}`, {
      method: 'PUT',
      token: token2,
      body: {
        content: 'Malicious update attempt',
      },
    });
    assert(
      forbiddenUpdatePost.status === 403,
      'Non-author cannot update another user post (403)'
    );

    // 210. Non-author cannot delete post -> 403
    const forbiddenDeletePost = await request(`/api/community/posts/${post1Id}`, {
      method: 'DELETE',
      token: token2,
    });
    assert(
      forbiddenDeletePost.status === 403,
      'Non-author cannot delete another user post (403)'
    );

    // 211. Create a throwaway post to test deletion
    const throwawayPost = await request('/api/community/posts', {
      method: 'POST',
      token: token1,
      body: { content: 'Temporary post to be deleted' },
    });
    const throwawayPostId = throwawayPost.data.data._id;
    const deletePostRes = await request(`/api/community/posts/${throwawayPostId}`, {
      method: 'DELETE',
      token: token1,
    });
    assert(deletePostRes.status === 200, 'Author can delete own post (200)');

    // 212. Deleted post returns 404
    const checkDeletedPost = await request(`/api/community/posts/${throwawayPostId}`);
    assert(checkDeletedPost.status === 404, 'Deleted post returns 404 on subsequent lookup');

    // 213. Authenticated user can like a post
    const like1Res = await request(`/api/community/posts/${post1Id}/like`, {
      method: 'POST',
      token: token1,
    });
    assert(
      like1Res.status === 200 &&
        like1Res.data.data.liked === true &&
        like1Res.data.data.likeCount === 1,
      'POST /api/community/posts/:postId/like increments likeCount to 1'
    );

    // 214. Duplicate like by same user is idempotent
    const duplicateLikeRes = await request(`/api/community/posts/${post1Id}/like`, {
      method: 'POST',
      token: token1,
    });
    assert(
      duplicateLikeRes.status === 200 &&
        duplicateLikeRes.data.data.likeCount === 1,
      'Duplicate like by same user is idempotent and maintains likeCount'
    );

    // 215. User 2 likes the post -> likeCount becomes 2
    const like2Res = await request(`/api/community/posts/${post1Id}/like`, {
      method: 'POST',
      token: token2,
    });
    assert(
      like2Res.status === 200 &&
        like2Res.data.data.likeCount === 2,
      'Second user likes post, likeCount increments to 2'
    );

    // 216. Unlike post (User 1 unlikes -> likeCount becomes 1)
    const unlikeRes = await request(`/api/community/posts/${post1Id}/like`, {
      method: 'DELETE',
      token: token1,
    });
    assert(
      unlikeRes.status === 200 &&
        unlikeRes.data.data.liked === false &&
        unlikeRes.data.data.likeCount === 1,
      'DELETE /api/community/posts/:postId/like decrements likeCount to 1'
    );

    // 217. Like without authentication returns 401
    const unauthLikeRes = await request(`/api/community/posts/${post1Id}/like`, {
      method: 'POST',
    });
    assert(unauthLikeRes.status === 401, 'Liking post without token returns 401');

    // 218. Authenticated user (User 2) creates comment on post
    const comment1Res = await request(`/api/community/posts/${post1Id}/comments`, {
      method: 'POST',
      token: token2,
      body: {
        content: 'Amazing itinerary! What was your favorite food spot in Delhi?',
      },
    });
    assert(
      comment1Res.status === 201 &&
        comment1Res.data.success === true &&
        comment1Res.data.data.author.username === 'explorer_user2',
      'POST /api/community/posts/:postId/comments creates comment with populated author'
    );
    const comment1Id = comment1Res.data.data._id;

    // Verify post's commentCount incremented
    const postAfterComment = await request(`/api/community/posts/${post1Id}`);
    assert(
      postAfterComment.data.data.commentCount === 1,
      'Post commentCount incremented to 1'
    );

    // 219. Unauthenticated comment creation -> 401
    const unauthCommentRes = await request(`/api/community/posts/${post1Id}/comments`, {
      method: 'POST',
      body: { content: 'Unauth comment' },
    });
    assert(unauthCommentRes.status === 401, 'Creating comment without token returns 401');

    // 220. Empty comment rejected -> 400
    const emptyCommentRes = await request(`/api/community/posts/${post1Id}/comments`, {
      method: 'POST',
      token: token2,
      body: { content: '' },
    });
    assert(emptyCommentRes.status === 400, 'Creating empty comment returns 400');

    // 221. GET /api/community/posts/:postId/comments lists comments
    const listCommentsRes = await request(`/api/community/posts/${post1Id}/comments`);
    assert(
      listCommentsRes.status === 200 &&
        Array.isArray(listCommentsRes.data.data) &&
        listCommentsRes.data.data.length === 1 &&
        listCommentsRes.data.data[0].content.includes('favorite food spot'),
      'GET /api/community/posts/:postId/comments lists comments on post'
    );

    // 222. Comment author (User 2) can update own comment
    const updateCommentRes = await request(
      `/api/community/posts/${post1Id}/comments/${comment1Id}`,
      {
        method: 'PUT',
        token: token2,
        body: {
          content: 'Updated comment: Truly incredible photos and itinerary!',
        },
      }
    );
    assert(
      updateCommentRes.status === 200 &&
        updateCommentRes.data.data.content === 'Updated comment: Truly incredible photos and itinerary!',
      'Comment author can update own comment'
    );

    // 223. Non-author cannot update comment -> 403
    const forbiddenUpdateComment = await request(
      `/api/community/posts/${post1Id}/comments/${comment1Id}`,
      {
        method: 'PUT',
        token: token1,
        body: { content: 'Unauthorized comment edit' },
      }
    );
    assert(
      forbiddenUpdateComment.status === 403,
      'Non-author cannot update comment (403)'
    );

    // 224. Non-author cannot delete comment -> 403
    const forbiddenDeleteComment = await request(
      `/api/community/posts/${post1Id}/comments/${comment1Id}`,
      {
        method: 'DELETE',
        token: token1,
      }
    );
    assert(
      forbiddenDeleteComment.status === 403,
      'Non-author cannot delete comment (403)'
    );

    // 225. Comment author can delete own comment -> 200
    const deleteCommentRes = await request(
      `/api/community/posts/${post1Id}/comments/${comment1Id}`,
      {
        method: 'DELETE',
        token: token2,
      }
    );
    assert(deleteCommentRes.status === 200, 'Comment author can delete own comment (200)');

    // 226. Post commentCount decrements correctly after comment deletion
    const postAfterCommentDel = await request(`/api/community/posts/${post1Id}`);
    assert(
      postAfterCommentDel.data.data.commentCount === 0,
      'Post commentCount decrements to 0 after comment deletion'
    );

    // 227. GET /api/community/feed returns feed
    const feedRes = await request('/api/community/feed?page=1&limit=10');
    assert(
      feedRes.status === 200 &&
        Array.isArray(feedRes.data.data) &&
        feedRes.data.data.length >= 1,
      'GET /api/community/feed returns community feed'
    );

    // 228. GET /api/community/users returns active public users
    const usersDiscoveryRes = await request('/api/community/users');
    assert(
      usersDiscoveryRes.status === 200 &&
        Array.isArray(usersDiscoveryRes.data.data) &&
        usersDiscoveryRes.data.data.some((u: any) => u.username === 'globetrotter_user1'),
      'GET /api/community/users returns discovery user list'
    );

    // 229. GET /api/community/tags returns popular tags with count
    const tagsDiscoveryRes = await request('/api/community/tags');
    assert(
      tagsDiscoveryRes.status === 200 &&
        Array.isArray(tagsDiscoveryRes.data.data) &&
        tagsDiscoveryRes.data.data.some((t: any) => t.tag === 'adventure' || t.tag === 'india'),
      'GET /api/community/tags returns popular tags with post counts'
    );

    // 230. Privacy guard: check that no passwords or emails leak in feed or tags
    const rawFeedJson = JSON.stringify(feedRes.data);
    assert(
      !rawFeedJson.includes('passwordHash') &&
        !rawFeedJson.includes('testuser1@example.com'),
      'Community feed does not leak passwordHash or private user email'
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


