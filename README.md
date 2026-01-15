# Call Management System

A full-stack call management application for tracking customer service calls, assignments, and completions.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand, React Router
- **Database**: PostgreSQL (via Neon or local Postgres)
- **Deployment**: Backend on Render, Frontend on Netlify

## Project Structure

```
Deploy_call/
├── backend/          # Express API server
│  ├── src/
│  │  └── index.ts   # Main app, all routes and middleware
│  ├── prisma/       # Database schema and migrations
│  ├── scripts/      # Seed and test utilities
│  └── package.json
├── frontend/         # React + Vite UI
│  ├── src/
│  │  ├── pages/     # Dashboard, Login, Profile, UserManagement
│  │  ├── components/# Forms and cards
│  │  └── store/     # Zustand auth and call stores
│  └── package.json
└── README.md
```

## Features

- **User Roles**: HOST (admin), ADMIN (manager), USER (worker)
- **Call Management**: Create, assign, track, and mark calls as completed
- **Customer Tracking**: Store and search customer info
- **Real-time Sync**: Zustand stores keep UI in sync with API
- **Secure Auth**: JWT tokens, bcrypt password hashing
- **Responsive UI**: Tailwind CSS, mobile-friendly design
- **Special Admin Route**: Isolated admin portal with OTP-based recovery (see [SPECIAL_ADMIN_ROUTE.md](SPECIAL_ADMIN_ROUTE.md))

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (or remote Postgres URL)
- Environment variables configured

### Backend Setup

1. Navigate to backend:
   ```bash
   cd Deploy_call/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with required variables:
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname"
   JWT_SECRET="your-secret-key-here"
   FRONTEND_ORIGIN="http://localhost:5173"
   PORT=4000
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Apply database migrations:
   ```bash
   npx prisma db push
   ```

6. (Optional) Seed a HOST user:
   ```bash
   SEED_HOST_USERNAME=admin SEED_HOST_PASSWORD=secure_password npm run seed
   ```

### Frontend Setup

1. Navigate to frontend:
   ```bash
   cd Deploy_call/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` (optional, for custom API URL):
   ```env
   VITE_API_URL=http://localhost:4000
   ```

## Running Locally

### Terminal 1 - Backend

```bash
cd Deploy_call/backend
npm run dev
```

Server runs at: `http://localhost:4000`

### Terminal 2 - Frontend

```bash
cd Deploy_call/frontend
npm run dev
```

UI runs at: `http://localhost:5173`

### Default Credentials

After seeding, use the credentials you set in `SEED_HOST_USERNAME` and `SEED_HOST_PASSWORD`.

## API Endpoints

### Authentication
- `POST /auth/login` - Login with username and password

### Users
- `GET /users` - List all users (requires auth)
- `POST /users` - Create a new user
- `PUT /users/:id` - Update user role (HOST/ADMIN only)

### Customers
- `GET /customers` - List all customers
- `POST /customers` - Create/update customer
- `GET /customers/search` - Search by phone or email

### Calls
- `GET /calls` - List all calls
- `POST /calls` - Create a new call
- `PUT /calls/:id` - Update call details
- `POST /calls/:id/assign` - Assign call to worker (HOST/ADMIN only)
- `POST /calls/:id/complete` - Mark call as completed

### Health
- `GET /health` - Check API health

## Environment Variables

### Backend `.env`
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens (min 32 chars recommended) |
| `FRONTEND_ORIGIN` | No | `https://call-manage.netlify.app` | Allowed CORS origin |
| `PORT` | No | `4000` | Backend server port |
| `RUN_PRISMA_PUSH` | No | `false` | Run migrations on startup (unsafe for production) |
| `EMAIL_USER` | Yes | - | Email address for sending OTPs |
| `EMAIL_PASS` | Yes | - | Email app password |
| `SPECIAL_ADMIN_USERNAME` | No | `specialadmin` | Special admin username |
| `SPECIAL_ADMIN_PASSWORD` | No | - | Special admin password |
| `SPECIAL_ADMIN_SECRET` | No | - | Secret key for admin recovery |
| `SPECIAL_ADMIN_EMAIL` | No | - | Admin email for OTP delivery |

### Backend Seed Script
When running `npm run seed`:
| Variable | Required | Description |
|----------|----------|-------------|
| `SEED_HOST_USERNAME` | Yes | Username for initial HOST user |
| `SEED_HOST_PASSWORD` | Yes | Password for initial HOST user |

### Backend Test Script
When running `node scripts/test-api.js`:
| Variable | Required | Description |
|----------|----------|-------------|
| `BASE_URL` | Yes | API endpoint URL (e.g., `http://localhost:4000`) |
| `TEST_API_USERNAME` | Yes | Test user username |
| `TEST_API_PASSWORD` | Yes | Test user password |
| `TEST_CALL_CUSTOMER_NAME` | Yes | Test call customer name |
| `TEST_CALL_PHONE` | Yes | Test call phone number |
| `TEST_CALL_PROBLEM` | Yes | Test call problem description |
| `TEST_CALL_CATEGORY` | Yes | Test call category |
| `TEST_CALL_EMAIL` | No | Test call email |
| `TEST_CALL_ADDRESS` | No | Test call address |
| `TEST_CALL_STATUS` | No | Test call status (default: `PENDING`) |

### Frontend `.env.local` (Optional)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:4000` (dev), `https://call-management-7hug.onrender.com` (prod) | Backend API URL |

## Building for Production

### Backend Build
```bash
cd Deploy_call/backend
npm run build  # TypeScript compilation (implicit in deploy)
```

### Frontend Build
```bash
cd Deploy_call/frontend
npm run build
```

Outputs to `frontend/dist/`

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repo
4. Set Environment Variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Random secure key (32+ chars)
   - `FRONTEND_ORIGIN` - Your frontend URL (e.g., `https://yourdomain.netlify.app`)
5. Build command: `npm install && npx prisma generate && npm run build`
6. Start command: `npm start` or `node dist/index.js`

### Frontend (Netlify)

1. Push code to GitHub
2. Create a new site on Netlify, connect GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Environment variables:
   - `VITE_API_URL` - Your backend API URL on Render
6. Deploy

### Database Migration on Render

After backend deployment, run migrations once:

```bash
DATABASE_URL="your-db-url" npx prisma db push --accept-data-loss
```

Or use Render's "Run shell command" feature to run migrations as a one-time job.

## Troubleshooting

### "Prisma client did not initialize"
- Run `npx prisma generate` in the backend folder
- Ensure `node_modules/@prisma/client` exists

### CORS errors
- Verify `FRONTEND_ORIGIN` in backend `.env` matches your frontend URL
- Backend accepts `http://localhost:*` and configured origins automatically

### Database connection failed
- Check `DATABASE_URL` is valid and database is running
- Ensure network/firewall allows the connection
- Test with `npm run check-db` script

### API returns 503 (database unavailable)
- Verify database is running and accessible
- Check credentials in `DATABASE_URL`

## Security Notes

- **Never commit `.env` files** to source control
- Use strong `JWT_SECRET` (32+ random characters) in production
- Hash passwords with bcrypt (handled by app)
- Validate all user input (frontend and backend)
- Use HTTPS in production (enforced by Render/Netlify)
- Limit API rate in production with middleware if needed

## License

ISC
