# Auth Service (Node.js + MongoDB)

Unified authentication backend for CeylonRoam - handles both signup and login.

## Setup

1. Install deps:

```bash
cd backend/authSignup
npm install
```

2. Create a `.env` file and set:
   - `MONGODB_URI` - MongoDB connection string
   - `SESSION_SECRET` (optional) - Secret for session encryption
   - `EMAIL_USER` - Email address for sending OTPs (Gmail recommended)
   - `EMAIL_PASSWORD` - App password for the email account

3. Run:

```bash
npm start
```

Server runs on port `5001` by default.

## Endpoints

- `GET /health` - Health check
- `POST /api/signup` - Create new user account
- `POST /api/login` - Authenticate user
- `POST /api/forgot-password` - Request OTP for password reset
- `POST /api/verify-otp` - Verify OTP code
- `POST /api/logout` - End user session
- `GET /api/check` - Check if user is authenticated

### POST /api/signup

Create a new user account.

**Body:**

```json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "securepass123"
}
```

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "createdAt": "2026-02-25T10:30:00.000Z"
}
```

### POST /api/login

Authenticate a user with username/email and password.

**Body:**

```json
{
  "username": "janedoe",
  "password": "securepass123"
}
```

Note: The `username` field accepts either username or email.

**Response:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "message": "login successful"
}
```

### POST /api/forgot-password

Request an OTP code to reset password. Sends a 6-digit OTP to the user's email.

**Body:**

```json
{
  "email": "jane@example.com"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "OTP sent to your email successfully"
}
```

**Notes:**
- OTP is valid for 10 minutes
- Email must be registered in the system
- Previous OTP for the same email will be overwritten

### POST /api/verify-otp

Verify the OTP code received via email.

**Body:**

```json
{
  "email": "jane@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "OTP verified successfully"
}
```

**Error Responses:**
- Invalid OTP: `{ "status": "error", "message": "Invalid OTP" }`
- Expired OTP: `{ "status": "error", "message": "OTP has expired" }`
- OTP not found: `{ "status": "error", "message": "OTP not found or expired" }`

### POST /api/logout

End the current user session.

**Response:**

```json
{
  "message": "logout successful"
}
```

### GET /api/check

Check if the user is currently authenticated.

**Response (authenticated):**

```json
{
  "authenticated": true,
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response (not authenticated):**

```json
{
  "authenticated": false
}
```

## Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Session-based authentication
- ✅ Email format validation
- ✅ Password minimum length (6 characters)
- ✅ Duplicate email/username detection
- ✅ Secure cookies in production
- ✅ OTP-based password reset (10-minute expiration)
- ✅ Email verification via nodemailer

## Notes

- Passwords are automatically hashed before saving to database
- Sessions are stored in-memory (consider Redis for production)
- JWT authentication not yet implemented

