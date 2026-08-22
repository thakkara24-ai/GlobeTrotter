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
```

## API Endpoints (Phase 1)

| Method | Endpoint             | Auth     | Description            |
| ------ | -------------------- | -------- | ---------------------- |
| GET    | `/api/health`        | Public   | Health check           |
| POST   | `/api/auth/register` | Public   | Register a new user    |
| POST   | `/api/auth/login`    | Public   | Login                  |
| GET    | `/api/auth/me`       | Required | Get current user info  |

## Project Structure

```
backend/
├── src/
│   ├── config/        # Database connection
│   ├── controllers/   # Request handlers
│   ├── middleware/     # Auth, error, 404
│   ├── models/        # Mongoose schemas
│   ├── routes/        # Express routes
│   ├── services/      # Business logic
│   ├── types/         # TypeScript declarations
│   ├── utils/         # JWT, password helpers
│   ├── validators/    # Zod schemas
│   ├── app.ts         # Express app setup
│   └── server.ts      # Entry point
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```
