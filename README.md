Internship Platform (Frontend + Backend)
This repo contains:
A React (Vite) frontend (`frontend - Copy/`) that provides role-based dashboards (student / provider(org) / admin)
A Node.js (Express) backend (`backend - Copy/`) that exposes REST APIs under `/api/*`, connects to MongoDB, and supports JWT auth + Google OAuth
<img width="1600" height="814" alt="7c312e2b-6595-4587-ba8d-0cefa98443f6" src="https://github.com/user-attachments/assets/ab77bcc5-a2f1-452e-b5d8-4ae8bfd7e978" />
<img width="1600" height="816" alt="02554843-010e-4997-8e25-64e54e4d89a0" src="https://github.com/user-attachments/assets/b584860d-2ed8-4e5a-9c3d-2701eb2e36bd" />


---
Table of contents
Tech stack
Project structure
How the project works (detailed workflow)
Local development (step-by-step)
Environment variables (backend)
Backend API map (routes)
Common scripts
Troubleshooting
Tech stack
Frontend (`frontend - Copy/`)
React 18 + Vite 5
Tailwind CSS (PostCSS + Autoprefixer)
React Router
TanStack React Query for server state
Axios for HTTP
Socket.IO Client for realtime
UI/UX libs: Headless UI, Framer Motion, Lucide, Recharts, react-hot-toast
Backend (`backend - Copy/`)
Node.js (ESM) + Express
MongoDB + Mongoose
Auth: JWT + Passport (Google OAuth 2.0) + express-session (session used for OAuth handshake)
Security/ops: Helmet, CORS, Morgan, express-rate-limit, express-validator
Realtime: Socket.IO
File upload: Multer
Jobs/queues: Bull + ioredis (requires Redis if the queue features are used)
NLP/ML utilities: natural, compromise, stopword, ml-knn, ml-random-forest, ml-matrix, mathjs
Project structure
`frontend - Copy/`: SPA client
`src/App.jsx`: route definitions + role-based protected routes
`src/context/AuthContext.jsx`: auth state management (token + user in `localStorage`)
`backend - Copy/`: REST API + realtime server
`src/index.js`: Express app bootstrap (security, CORS, rate limiting, routes, error handling)
`src/routes/*.js`: API route modules
`src/models/*.js`: MongoDB models (Mongoose)
`scripts/*.js`: one-off scripts (seeding, training)
How the project works (detailed workflow)
1) User opens the web app
The frontend runs on `http://localhost:3000` in dev.
The app is a SPA. Routes are defined in `frontend - Copy/src/App.jsx`:
Public: `/`, `/login`, `/register`
Google OAuth redirect landing: `/auth/callback`
Protected app shell: `/app/*` (role-based subroutes for student/provider/admin)
2) Frontend ↔ Backend communication (dev proxy)
In development, Vite is configured to proxy API calls:
Any frontend request to `http://localhost:3000/api/...` is forwarded to `http://localhost:5000/api/...`
This avoids CORS pain during local dev and keeps frontend API calls consistent.
3) Authentication & session model (important)
A) Email/password login (JWT)
The frontend sends credentials to:
`POST /api/auth/login`
The backend:
Verifies password (bcrypt compare via the `User` model)
Issues a JWT (signed with `JWT_SECRET`)
Responds with `{ token, user }` (wrapped as `{ success: true, token, user }` in the newer format)
The frontend:
Saves `token` and `user` into `localStorage`
Uses the token for subsequent authenticated API calls
Can refresh user data via `GET /api/auth/me`
B) Google OAuth login (Passport)
The flow starts at:
`GET /api/auth/google`
Google redirects back to:
`GET /api/auth/google/callback`
The backend:
Uses Passport’s Google Strategy to find/create a user in MongoDB
Signs a JWT
Redirects to the frontend:
`/auth/callback?token=...&role=...`
The frontend `AuthCallback` page should read the token, store it, and redirect into `/app/*`.
C) Why both `express-session` and JWT exist
JWT is used for API authorization.
`express-session` exists to support the OAuth handshake reliably (even though routes are configured with `session: false` in Passport calls, the server still installs session middleware).
4) Role-based UI workflow
After login, the app routes users based on `user.role`:
student → `/app/dashboard`
provider / organization → `/app/provider`
admin → `/app/admin`
Access control is enforced client-side by `ProtectedRoute` (frontend) and should also be enforced server-side for sensitive routes.
5) Backend request lifecycle (typical API call)
Request hits Express (`backend - Copy/src/index.js`)
Security middleware runs (Helmet)
CORS policy checks allowed origins (`CORS_ORIGINS`)
Rate limiting applies under `/api/*` (can be disabled via `RATE_LIMIT_DISABLED`)
Route handler runs (`src/routes/*.js`)
Auth middleware (when required) validates JWT and populates `req.user`
MongoDB operations via Mongoose models (`src/models/*.js`)
Response JSON returned
Errors go through centralized error handling middleware
6) Realtime (Socket.IO)
The frontend includes `socket.io-client`, and the backend includes `socket.io`.
When enabled in the feature set, this is typically used for:
live pipeline updates (provider)
notifications / status changes
admin monitoring
7) Background jobs / queues (Bull + Redis) (optional)
If your code paths enqueue jobs using Bull, then Redis must be running.
If you are not using queued features, Redis is not required for local dev.
8) Training / scoring (ML/NLP) (optional)
The backend includes scripts and libraries for ranking/analysis.
Run training via:
`npm run train` (executes `scripts/trainModel.js`)
Local development (step-by-step)
Prerequisites
Node.js (recommended: current LTS)
MongoDB running locally (default DB: `internship_platform`)
Redis (only needed if you use features backed by Bull queues)
0) Start required services
Start MongoDB locally (or point `MONGODB_URI` to an Atlas cluster).
Start Redis only if you use queue-backed features.
1) Backend setup & run
```bash
cd "backend - Copy"
npm install
```
Create a `.env` file based on `backend - Copy/.env.example`.
Start the API in dev mode (auto-reload):
```bash
npm run dev
```
Backend URL: `http://localhost:5000`
Health check: `GET /api/health`
API base paths: `/api/auth`, `/api/internships`, `/api/student`, `/api/organization`, `/api/admin`, `/api/feedback`
Production-style start:
```bash
npm start
```
Seed scripts (optional):
```bash
node scripts/seedAdmin.js
node scripts/seedData.js
```
Model training (optional):
```bash
npm run train
```
2) Frontend setup & run
```bash
cd "frontend - Copy"
npm install
npm run dev
```
Frontend URL: `http://localhost:3000`
During development, Vite proxies `'/api'` to `http://localhost:5000`, so the frontend can call the backend without manual base-URL changes.
Build and preview:
```bash
npm run build
npm run preview
```
Environment variables (backend)
Backend configuration is driven by `backend - Copy/.env.example`. Key values:
Database: `MONGODB_URI`
Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`
Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
Frontend/CORS: `FRONTEND_URL`, `CORS_ORIGINS`
Rate limiting: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_DISABLED`
Recommended local `.env` example:
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/internship_platform
JWT_SECRET=replace-with-long-random-string
JWT_EXPIRES_IN=7d
SESSION_SECRET=replace-with-long-random-string
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```
Backend API map (routes)
The backend mounts these route modules in `backend - Copy/src/index.js`:
Auth: `/api/auth/*`
`POST /api/auth/register`
`POST /api/auth/login`
`GET /api/auth/me` (JWT protected)
`PATCH /api/auth/profile` (JWT protected)
`POST /api/auth/change-password` (JWT protected)
Google OAuth: `/api/auth/google` and `/api/auth/google/callback`
Internships: `/api/internships/*`
Student: `/api/student/*` (legacy alias also mounted under `/api/students/*`)
Organization: `/api/organization/*` (legacy alias also mounted under `/api/providers/*`)
Admin: `/api/admin/*`
Feedback: `/api/feedback/*`
Health: `GET /api/health`
Common scripts
Frontend (`frontend - Copy/`)
`npm run dev`: start dev server on `http://localhost:3000`
`npm run build`: production build
`npm run preview`: preview built app
Backend (`backend - Copy/`)
`npm run dev`: start backend with file watching
`npm start`: start backend (no watch)
`npm run train`: run ML/NLP training (`scripts/trainModel.js`)
`node scripts/seedAdmin.js`: create a test admin user (requires MongoDB + `MONGODB_URI`)
`node scripts/seedData.js`: seed sample data (requires MongoDB + `MONGODB_URI`)
Typical developer workflow
Run MongoDB (and Redis if needed)
Start backend (`npm run dev`)
Start frontend (`npm run dev`)
Develop UI in the frontend; API/realtime logic lives in the backend under `src/`
Troubleshooting
Frontend can’t call the backend
Make sure backend is running on port 5000.
Confirm frontend runs on port 3000 (Vite config sets this).
In dev, calls should be made to `/api/...` so the proxy forwards to the backend.
CORS error in browser
Ensure `CORS_ORIGINS` includes `http://localhost:3000`
Restart the backend after changing `.env`
MongoDB connection errors
Verify MongoDB is running and reachable at `MONGODB_URI`
Check backend console logs for the connection error detail
Google OAuth fails
Confirm these env vars are set: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
Ensure `GOOGLE_CALLBACK_URL` matches the value configured in Google Cloud Console
Confirm `FRONTEND_URL` is correct (used for redirects)
