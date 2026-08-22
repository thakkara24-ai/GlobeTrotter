# GlobeTrotter Backend

Backend API for the GlobeTrotter travel planning application.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable      | Description                      |
| ------------- | -------------------------------- |
| `PORT`        | Server port (default: 5000)      |
| `MONGODB_URI` | MongoDB connection string        |
| `JWT_SECRET`  | Secret key for signing JWTs      |
| `CLIENT_URL`  | Frontend URL for CORS whitelist  |

### Scripts

```bash
npm run build   # Compile TypeScript
npm run start   # Run compiled JS
npm run dev     # Development with hot-reload
npm run seed    # Seed development cities, activities, sample itinerary & expenses
npm test        # Run comprehensive test suite
```

## API Endpoints

### Authentication & Health
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/health`        | Public   | Health check & DB state|
| POST   | `/api/auth/register` | Public   | Register a new user    |
| POST   | `/api/auth/login`    | Public   | Login                  |
| GET    | `/api/auth/me`       | Required | Get current user info  |

### Cities
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/cities`        | Public   | List cities (search, country, tags, pagination) |
| GET    | `/api/cities/:id`    | Public   | Get single city details|

### Activities
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/activities`    | Public   | List activities (city, category, search, pagination) |
| GET    | `/api/activities/:id`| Public   | Get single activity with city populated |

### Trips (User-Owned)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| POST   | `/api/trips`         | Required | Create a new trip      |
| GET    | `/api/trips`         | Required | List authenticated user trips (paginated) |
| GET    | `/api/trips/:id`     | Required | Get single trip (ownership verified, populated) |
| PUT    | `/api/trips/:id`     | Required | Update trip (ownership verified) |
| DELETE | `/api/trips/:id`     | Required | Delete trip (ownership verified) |

### Itinerary, Calendar & Timeline (Phase 3 & Phase 5)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/trips/:id/itinerary` | Required | Complete hierarchical itinerary (Trip → Stops → Sections) |
| GET    | `/api/trips/:id/calendar` | Required | Day-by-day calendar schedule (`?startDate=&endDate=`) |
| GET    | `/api/trips/:id/timeline` | Required | Chronological combined events timeline (`?startDate=&endDate=`) |
| POST   | `/api/trips/:id/stops` | Required | Add a city stop to a trip |
| PUT    | `/api/trips/:id/stops/reorder` | Required | Reorder stops sequentially (`{ stopIds: [...] }`) |
| PUT    | `/api/trips/:id/stops/:stopId` | Required | Update stop dates, city, or order |
| DELETE | `/api/trips/:id/stops/:stopId` | Required | Delete stop and its associated sections |
| POST   | `/api/trips/:id/stops/:stopId/sections` | Required | Create an itinerary section (ACTIVITY, MEAL, TRANSPORT, OTHER) |
| PUT    | `/api/trips/:id/stops/:stopId/sections/reorder` | Required | Reorder sections sequentially (`{ sectionIds: [...] }`) |
| PUT    | `/api/trips/:id/stops/:stopId/sections/:sectionId` | Required | Update an itinerary section |
| DELETE | `/api/trips/:id/stops/:stopId/sections/:sectionId` | Required | Delete an itinerary section |

### Budget, Expenses & Smart Recommendation (Phase 4 & Phase 7)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/trips/:tripId/budget/recommendation` | Required | Smart rule-based & data-driven budget recommendation (`?style=budget\|standard\|comfortable\|premium&travelers=2`) |
| GET    | `/api/trips/:tripId/budget` | Required | Get budget summary (spent, remaining, % used, overBudget) |
| PUT    | `/api/trips/:tripId/budget` | Required | Update trip totalBudget and currency |
| GET    | `/api/trips/:tripId/budget/categories` | Required | Category-wise expense breakdown with percentages |
| GET    | `/api/trips/:tripId/budget/daily` | Required | Chronological daily spending totals |
| POST   | `/api/trips/:tripId/expenses` | Required | Create an expense on a trip |
| GET    | `/api/trips/:tripId/expenses` | Required | List expenses with pagination & category/date filters |

### Trip Collaboration & Permissions (Phase 6)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| POST   | `/api/trips/:tripId/collaborators` | Required (Owner) | Add collaborator by email or userId (`VIEWER` or `EDITOR`) |
| GET    | `/api/trips/:tripId/collaborators` | Required (Collaborators) | List all collaborators for a trip |
| PUT    | `/api/trips/:tripId/collaborators/:collaboratorId` | Required (Owner) | Update collaborator role (`VIEWER` <-> `EDITOR`) |
| DELETE | `/api/trips/:tripId/collaborators/:collaboratorId` | Required (Owner) | Remove collaborator from trip |

### Public Itinerary Sharing (Phase 6)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| POST   | `/api/trips/:tripId/share/public` | Required (Owner) | Enable public sharing and generate secure shareToken |
| DELETE | `/api/trips/:tripId/share/public` | Required (Owner) | Disable public sharing and revoke shareToken |
| GET    | `/api/public/trips/:shareToken` | Public (No Auth) | Public read-only itinerary (sanitized, no private data) |

### Location, Geolocation & Maps (Phase 6)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/location/distance` | Public   | Calculate straight-line distance (`?fromLatitude=&fromLongitude=&toLatitude=&toLongitude=`) |
| GET    | `/api/cities/nearby` | Public   | Find nearby cities within radius (`?latitude=&longitude=&radius=`) |
| GET    | `/api/activities/nearby` | Public   | Find nearby activities within radius (`?latitude=&longitude=&radius=`) |
| PUT    | `/api/cities/:id/location` | Required | Update city coordinates (`latitude`, `longitude`) |
| PUT    | `/api/activities/:id/location` | Required | Update activity coordinates (`latitude`, `longitude`) |
| GET    | `/api/trips/:id/map` | Required | Get trip map markers and route intelligence |

### Profile & Public User (Phase 8)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/profile`       | Required | Get authenticated user full profile |
| PUT    | `/api/profile`       | Required | Update user profile (`name`, `username`, `bio`, `location`, `country`, `travelInterests`, `preferredTravelStyle`, `avatar`) |
| GET    | `/api/users/:username` | Public | Get public user profile (sanitized, zero credentials/private data) |

### Community Posts, Likes, Comments & Feed (Phase 8)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/community/feed` | Public  | Get recent community post feed (`?page=&limit=&city=&tag=&search=`) |
| GET    | `/api/community/users` | Public | Discover active public community users |
| GET    | `/api/community/tags` | Public  | Discover popular community tags with post counts |
| POST   | `/api/community/posts` | Required | Create a new community post (`content`, `images`, `tags`, `cityId`, `tripId`) |
| GET    | `/api/community/posts` | Public | List posts with pagination and search/city/tag filters |
| GET    | `/api/community/posts/:postId` | Public | Get detailed post with populated author and city |
| PUT    | `/api/community/posts/:postId` | Required (Author) | Update post content, images, and tags |
| DELETE | `/api/community/posts/:postId` | Required (Author) | Delete post with cascading deletion of likes and comments |
| POST   | `/api/community/posts/:postId/like` | Required | Like a post (idempotent, prevents duplicate likes) |
| DELETE | `/api/community/posts/:postId/like` | Required | Unlike a post |
| POST   | `/api/community/posts/:postId/comments` | Required | Add a comment to a post |
| GET    | `/api/community/posts/:postId/comments` | Public | List comments on a post with pagination |
| PUT    | `/api/community/posts/:postId/comments/:commentId` | Required (Author) | Update comment content |
| DELETE | `/api/community/posts/:postId/comments/:commentId` | Required (Author) | Delete comment and decrement post comment count |

## Architecture & Data Models

```
Routes → Controllers → Services → Models → MongoDB
```

### Authorization & Permission Hierarchy
- **`OWNER`**: Full access to trip metadata, collaborator management, public sharing settings, budget, expenses, and itinerary CRUD.
- **`EDITOR`**: Read/write access to trip itinerary (create/update/delete stops and sections, reordering, calendar, timeline, map). Cannot manage collaborators, budget, or expenses.
- **`VIEWER`**: Read-only access to trip itinerary, calendar, timeline, map, and collaborator list. Cannot modify any trip or itinerary data.
- **`PUBLIC`**: Read-only access to sanitized trip itinerary via `GET /api/public/trips/:shareToken`. Sensitive data (passwords, emails, user profile, budget, expenses, collaborators) is never exposed.

### Geolocation & GeoJSON Conventions
- Standard **GeoJSON Point** format is used for spatial queries:
  ```json
  {
    "type": "Point",
    "coordinates": [longitude, latitude]
  }
  ```
  *(Important: `longitude` is coordinate 0, `latitude` is coordinate 1).*
- MongoDB **`2dsphere`** indexes are applied on `City.location` and `Activity.location`.
- Distance queries use native MongoDB `$geoNear` aggregation pipelines for maximum performance.

### Smart Budget Recommendation Engine (Phase 7)
- **Deterministic & Rule-Based:** Uses multi-variable estimation without external AI APIs or paid services.
- **Key Factors:**
  - **Trip Duration:** Exact day count between start and end dates (minimum 1 day).
  - **Travelers:** Scales accommodation (assumes 2 people/room), food, local transit, activities, and shopping per person.
  - **Destination Transit:** Automatically computes inter-city transfer costs when trips span multiple destination cities.
  - **Itinerary Activities:** Aggregates planned activity costs directly from `ItinerarySection` and `Activity` records to avoid double-counting.
  - **Travel Styles:**
    - `budget`: 0.75x multiplier
    - `standard`: 1.0x baseline multiplier (default)
    - `comfortable`: 1.4x multiplier
    - `premium`: 2.0x multiplier
  - **Historical Spending Patterns:** When a user has >= 3 past expenses across other trips, the engine incorporates weighted average daily spending for food and transport to customize recommendations.
  - **Existing Expenses & Over-Budget:** Accounts for `alreadySpent` and computes `remainingRecommendedBudget` (`max(0, recommended - alreadySpent)`). Flags `overBudget: true` if spent exceeds recommendation.
  - **Confidence Levels:**
    - `HIGH`: Historical spending data available + planned activities/stops in itinerary.
    - `MEDIUM`: Either historical data available OR detailed itinerary with planned stops/activities.
    - `LOW`: Baseline estimation without prior user spending history.

### Models
- **`User`**: User accounts, credentials (passwordHash select: false), username, bio, location, travel interests, and public profile export.
- **`CommunityPost`**: Public travel posts with author, content, images, tags, optional city/trip references, likeCount, and commentCount.
- **`PostLike`**: Compound indexed user likes on community posts (`{ post: 1, user: 1 }` unique).
- **`PostComment`**: User comments on community posts with author reference and post timestamp indexing.
- **`TripCollaborator`**: User-trip collaboration relationships with role enum (`VIEWER`, `EDITOR`) and compound unique index.
- **`Trip`**: High-level trip containers with budget configuration (`totalBudget`, `currency`), traveler count (`travelers`), and public share configuration (`publicShareEnabled`, `publicShareToken`).
- **`City`**: Geographical destination metadata, GeoJSON `location`, 2dsphere index, text search indexes on name & country.
- **`Activity`**: Categorized experiences referencing City with GeoJSON `location` and 2dsphere index.
- **`TripStop`**: Ordered city stays inside a trip with start/end date bounds.
- **`ItinerarySection`**: Specific scheduled items (activities, meals, transport) within a stop.
- **`Expense`**: Individual logged expenses referencing Trip and User with categories.

### Validation & Relationship Rules
- **Trip Ownership & Collaboration:** Every trip, itinerary, map, and expense action strictly validates effective role (`OWNER`, `EDITOR`, `VIEWER`). Non-collaborators receive `403 Forbidden`.
- **Post & Comment Ownership:** Only post/comment authors can update or delete their respective content.
- **Cascading Deletes:**
  - Deleting a `TripStop` removes all child `ItinerarySection` records.
  - Deleting a `CommunityPost` cascades and removes all child `PostLike` and `PostComment` records.
- **Date Hierarchy:** `Trip.startDate <= Trip.endDate`, `Stop.startDate <= Stop.endDate`, and `Section.date` must fall within `[Stop.startDate, Stop.endDate]`.
- **Date Shrinking Safety:** Updating a stop's date range is rejected if existing itinerary sections fall outside the proposed range.
- **City-Activity Integrity:** When attaching an activity to an itinerary section, the system validates that the activity belongs to the stop's city.
- **Expense Integrity:** An expense must belong to the user's trip, have an `amount > 0`, and a valid category.
- **Coordinates:** Latitudes must fall within `[-90, 90]` and Longitudes within `[-180, 180]`.

## Project Structure

```
backend/
├── src/
│   ├── config/        # Database connection & status
│   ├── controllers/   # Request handlers (auth, city, activity, trip, itinerary, expense)
│   ├── middleware/    # Auth, error, 404
│   ├── models/        # Mongoose schemas (User, City, Activity, Trip, TripStop, ItinerarySection, Expense)
│   ├── routes/        # Express routes (auth, health, city, activity, trip, itinerary, expense)
│   ├── scripts/       # Database seed script (cities, activities, sample itinerary, sample expenses)
│   ├── services/      # Business logic (auth, city, activity, trip, itinerary, expense)
│   ├── types/         # TypeScript declarations
│   ├── utils/         # JWT, password helpers
│   ├── validators/    # Zod schemas (auth, city, activity, trip, itinerary, expense)
│   ├── app.ts         # Express app setup
│   └── server.ts      # Entry point
├── tests/
│   └── run-tests.ts   # Automated regression & integration test suite (84 assertions)
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```
