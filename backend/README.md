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

### Itinerary Builder (Stops & Sections)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/trips/:id/itinerary` | Required | Get complete structured trip itinerary |
| POST   | `/api/trips/:id/stops` | Required | Add a city stop to a trip |
| PUT    | `/api/trips/:id/stops/reorder` | Required | Reorder stops sequentially (`{ stopIds: [...] }`) |
| PUT    | `/api/trips/:id/stops/:stopId` | Required | Update stop dates, city, or order |
| DELETE | `/api/trips/:id/stops/:stopId` | Required | Delete stop and its associated sections |
| POST   | `/api/trips/:id/stops/:stopId/sections` | Required | Create an itinerary section (ACTIVITY, MEAL, TRANSPORT, OTHER) |
| PUT    | `/api/trips/:id/stops/:stopId/sections/reorder` | Required | Reorder sections sequentially (`{ sectionIds: [...] }`) |
| PUT    | `/api/trips/:id/stops/:stopId/sections/:sectionId` | Required | Update an itinerary section |
| DELETE | `/api/trips/:id/stops/:stopId/sections/:sectionId` | Required | Delete an itinerary section |

### Budget, Expenses & Analytics (Phase 4)
| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/trips/:tripId/budget` | Required | Get budget summary (spent, remaining, % used, overBudget) |
| PUT    | `/api/trips/:tripId/budget` | Required | Update trip totalBudget and currency |
| GET    | `/api/trips/:tripId/budget/categories` | Required | Category-wise expense breakdown with percentages |
| GET    | `/api/trips/:tripId/budget/daily` | Required | Chronological daily spending totals |
| POST   | `/api/trips/:tripId/expenses` | Required | Create an expense on a trip |
| GET    | `/api/trips/:tripId/expenses` | Required | List expenses with pagination & category/date filters |
| GET    | `/api/trips/:tripId/expenses/:expenseId` | Required | Get single expense details |
| PUT    | `/api/trips/:tripId/expenses/:expenseId` | Required | Update expense fields |
| DELETE | `/api/trips/:tripId/expenses/:expenseId` | Required | Delete an expense |

## Architecture & Data Models

```
Routes → Controllers → Services → Models → MongoDB
```

### Models
- **`User`**: User accounts, credentials (passwordHash select: false), preferences.
- **`City`**: Geographical destination metadata, text search indexes on name & country.
- **`Activity`**: Categorized experiences (sightseeing, food, adventure, culture, shopping, nature, entertainment, other) referencing City.
- **`Trip`**: High-level trip containers with budget configuration (`totalBudget`, `currency`).
- **`TripStop`**: Ordered city stays inside a trip with start/end date bounds.
- **`ItinerarySection`**: Specific scheduled items (activities, meals, transport) within a stop.
- **`Expense`**: Individual logged expenses referencing Trip and User with categories (TRANSPORT, ACCOMMODATION, FOOD, ACTIVITY, SHOPPING, ENTERTAINMENT, OTHER).

### Validation & Relationship Rules
- **Trip Ownership:** Every trip, itinerary, and expense action strictly validates `trip.user === req.user._id`. Non-owners receive `403 Forbidden`.
- **Date Hierarchy:** `Trip.startDate <= Trip.endDate`, `Stop.startDate <= Stop.endDate`, and `Section.date` must fall within `[Stop.startDate, Stop.endDate]`.
- **Date Shrinking Safety:** Updating a stop's date range is rejected if existing itinerary sections fall outside the proposed range.
- **City-Activity Integrity:** When attaching an activity to an itinerary section, the system validates that the activity belongs to the stop's city.
- **Cascading Deletes:** Deleting a `TripStop` automatically removes all child `ItinerarySection` records.
- **Expense Integrity:** An expense must belong to the user's trip, have an `amount > 0`, and a valid category.

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
