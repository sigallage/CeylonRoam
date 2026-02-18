# Auth/Signup Backend (Node.js + MongoDB)

Minimal signup backend for CeylonRoam.

## Setup

1. Install deps:

```bash
cd backend/authSignup
npm install
```

2. Create a `.env` file (copy from `.env.example`) and set `MONGODB_URI`.

3. Run:

```bash
npm start
```

Server runs on port `5001` by default.

## Endpoints

- `GET /health`
- `POST /api/signup`

### POST /api/signup

Body:

```json
{
  "name": "Jane",
  "email": "jane@example.com",
  "password": "1234"
}
```

Response: user object (password not returned).

## Important

This is intentionally **not secure** (passwords are not hashed, no JWT, no rate limits) because you asked for "without the security part".
