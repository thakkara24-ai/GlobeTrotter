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
npm run seed    # Seed development cities & activities
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

## Project Structure

```
backend/
├── src/
│   ├── config/        # Database connection & status
│   ├── controllers/   # Request handlers (auth, city, activity, trip)
│   ├── middleware/    # Auth, error, 404
│   ├── models/        # Mongoose schemas (User, City, Activity, Trip)
│   ├── routes/        # Express routes (auth, health, city, activity, trip)
│   ├── scripts/       # Database seed script
│   ├── services/      # Business logic (auth, city, activity, trip)
│   ├── types/         # TypeScript declarations
│   ├── utils/         # JWT, password helpers
│   ├── validators/    # Zod schemas (auth, city, activity, trip)
│   ├── app.ts         # Express app setup
│   └── server.ts      # Entry point
├── tests/
│   └── run-tests.ts   # Automated regression & integration test suite
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```
