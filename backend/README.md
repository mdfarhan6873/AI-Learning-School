# AI School Backend

This is the backend service for the AI Learning School platform, built with [NestJS](https://nestjs.com/). It provides a robust, production-ready REST API featuring OTP-based authentication, Google OAuth integration, role-based access, and a highly secure architecture.

## Table of Contents
- [Tech Stack](#tech-stack)
- [Security Features](#security-features)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [How to Set Up a Real OTP Provider](#how-to-set-up-a-real-otp-provider)

---

## Tech Stack
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Caching & Rate Limiting**: Redis
- **Authentication**: JWT (Access & Refresh tokens), bcrypt hashing
- **External Auth**: Google Auth Library

---

## Security Features
This backend is hardened for production:
- **Helmet**: Protects against common web vulnerabilities (XSS, clickjacking).
- **Strict CORS**: Prevents unauthorized frontend domains from calling the API.
- **Global Rate Limiting**: Throttler limits requests to 100 per minute per IP to prevent DDoS and OTP spam.
- **Global Exception Filter**: Intercepts unhandled errors, ensuring database structures and stack traces never leak to the client.

---

## Authentication Flow
The application uses a secure OTP (One-Time Password) model alongside Google OAuth. 

1. **OTP Sending**: A user provides a mobile number or email. The system normalizes the input, checks Redis for cooldowns and max-attempts, generates a 6-digit OTP, hashes it, and stores the hash in Redis.
2. **OTP Verification**: The user submits the OTP. The system hashes the input, verifies it against Redis, and automatically creates a `User` and `UserProfile` if they don't exist.
3. **Session Management**: Upon successful login, the user receives an `access_token` (short-lived) and a `refresh_token` (long-lived). The refresh token is hashed and persisted in the `auth_sessions` table.
4. **Single Device Enforcement**: Generating a new session automatically revokes older active sessions for that user.

---

## API Endpoints

### Auth API (`/api/auth`)

| Method | Endpoint | Description | Payload / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Sends a 6-digit OTP to mobile/email. | `{ "mobile": "+919000000000" }` or `{ "email": "user@example.com" }` |
| `POST` | `/api/auth/verify-otp` | Verifies OTP and logs the user in. | `{ "mobile": "+919000000000", "otp": "123456" }` |
| `POST` | `/api/auth/google` | Logs a user in via Google OAuth Token. | `{ "token": "google_id_token_here" }` |
| `POST` | `/api/auth/refresh` | Generates a new access token using a refresh token. | `{ "refresh_token": "..." }` |
| `POST` | `/api/auth/logout` | Revokes the current session. | `{ "refresh_token": "..." }` |
| `GET`  | `/api/auth/me` | Retrieves the currently logged-in user profile. | **Header**: `Authorization: Bearer <access_token>` |

---

## How to Set Up a Real OTP Provider

Right now, the system generates OTPs but simply logs them to the console (`[MOCK OTP PROVIDER]`). When you are ready to send real SMS messages or Emails, follow these steps:

**Step 1: Locate the code**
Open `src/auth/auth.service.ts` and navigate to the `sendOtp` method (around line 75).

**Step 2: Replace the Mock Logic**
Find the block that looks like this:
```typescript
// ====================================================================
// 🚀 INTEGRATE REAL OTP PROVIDER HERE
// ====================================================================
// Replace the console.log below with your actual SMS/Email API call.
```

**Step 3: Implement your Provider**
If you are using **Twilio or MSG91** for SMS, drop your API call inside the `if (mobile)` block:
```typescript
if (mobile) {
    await twilioClient.messages.create({
        body: `Your AI School login OTP is ${otp}. It expires in 5 minutes.`,
        to: identifier // The normalized phone number
    });
}
```

If you are using **SendGrid or Nodemailer** for Email, drop your API call inside the `if (email)` block:
```typescript
if (email) {
    await emailService.send({
        to: identifier,
        subject: 'Your AI School Login OTP',
        text: `Your login OTP is ${otp}. It expires in 5 minutes.`
    });
}
```

The system is already handling all rate-limiting, normalization, and secure hashing for you—you only need to plug in the delivery mechanism!

---

## Environment Setup & Connecting the Frontend

To connect your frontend application (e.g., React, Next.js, Vue) to this backend, you need to properly configure your environment variables.

### 1. `.env` File Configuration
Create a `.env` file in the root of your `backend` directory (if you haven't already). This file stores all your secrets and configuration variables. 

```env
# Server Port
PORT=4000

# CORS Configuration (Very Important for Frontend Connection!)
# In development: Allow localhost (e.g., React on 3000, Vite on 5173)
# In production: Allow your actual live domain
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=sium_learning_school

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets & Expiry
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_REFRESH_EXPIRES=7d

# Google OAuth (If using Google Login)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 2. How CORS Connects to your Frontend
The backend uses the `ALLOWED_ORIGINS` environment variable to configure **CORS (Cross-Origin Resource Sharing)**. 

- **Development**: If your frontend runs on `http://localhost:3000`, ensure that URL is in `ALLOWED_ORIGINS`. This tells the browser, *"Yes, it is safe for the frontend on port 3000 to talk to the backend on port 4000."*
- **Production**: When you deploy your backend to a server (like Render, AWS, or DigitalOcean), change `ALLOWED_ORIGINS` to your real frontend domain:
  ```env
  ALLOWED_ORIGINS=https://www.your-school-app.com
  ```

### 3. Making API Calls from the Frontend
Once configured, your frontend can make requests to the backend. Example using `fetch` or `axios`:

```javascript
// Example: Sending OTP from frontend
const response = await fetch('http://localhost:4000/api/auth/send-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ mobile: '+919234666761' }),
});
const data = await response.json();
```

---

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
