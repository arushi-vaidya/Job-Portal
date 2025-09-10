# Job Portal

This workspace contains a resume editor/viewer app (React), a backend API (Node/Express + MongoDB), and a standalone auth page.

## Apps and Ports
- Resume app (React): http://localhost:3000
- Backend API (Express): http://localhost:3001/api
- Auth page (static): http://localhost:5173

## Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)

## 1) Start the Backend (API)
```
cd "Job Portal/resume-parser/backend"
npm install
# Create .env (example)
# PORT=3001
# NODE_ENV=development
# MONGODB_URI=mongodb://localhost:27017/resume_parser
# FRONTEND_URL=http://localhost:3000
# JWT_SECRET=change_me
npm run dev
```
The server prints health URLs. CORS is configured for ports 3000 and 5173.

## 2) Start the Auth Page (static)
```
# In a separate terminal
npx serve "Job Portal/auth" -l 5173
```
This serves `auth/index.html` and `auth/auth.js`.

## 3) Start the Resume App (React)
```
# In another terminal
cd "Job Portal/resume-parser"
npm install
npm start
```
Visits http://localhost:3000.

## Login Flow
- If unauthenticated, the app redirects to the auth page on port 5173.
- After login/sign-up, the auth page redirects back to http://localhost:3000 with `#token=...`.
- The app stores the token (localStorage key `rp_auth_token`), clears the hash, verifies with `/auth/me`, and loads your resume.

## Data Model Guarantees
- One resume per user (unique index on `Resume.user`).
- Resume includes structured sections plus `personalInfo.bio`.

## Troubleshooting
- Port busy on 3000/3001/5173: stop the process or choose a different port for the auth static server.
- CORS errors: ensure backend is running and allows `http://localhost:3000` and `http://localhost:5173`.
- Not redirecting after login: ensure the auth page redirected to `http://localhost:3000#token=...` and the backend is reachable from 5173.

## Environment Variables (Backend)
- `PORT` (default 3001)
- `MONGODB_URI` (e.g., mongodb://localhost:27017/resume_parser)
- `FRONTEND_URL` (http://localhost:3000)
- `JWT_SECRET`

## Environment Variables (Resume App)
- `REACT_APP_API_URL` (default http://localhost:3001/api)

## Scripts
- Backend: `npm run dev` (nodemon)
- Resume app: `npm start`
- Auth page: `npx serve "Job Portal/auth" -l 5173`
