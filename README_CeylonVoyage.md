# Splash Experience

A minimal full-stack experience that showcases a cinematic splash screen for **TRAVEL-AI**, built with a React + Vite frontend and a FastAPI backend.

## Features

- Immersive splash screen with video backdrop, logo animation, and responsive layout.
- Backend `/api/meta` endpoint that the splash screen pings for live status copy.
- Connection-aware messaging that updates when the API is unreachable.
- Simple project structure so you can expand into a full travel assistant experience.

## Prerequisites

- Node.js 18+ (tested with Node 18.x). The frontend uses Vite and modern ESM tooling.
- Python 3.10+ (Python 3.12 recommended). The backend is written for FastAPI and uses modern type annotations.

### Key dependency versions (from this project)

- Frontend (from `frontend/package.json`):
	- react: ^18.3.1
	- react-dom: ^18.3.1
	- typescript: ^5.4.5
	- vite: ^5.2.0
- Backend (from `backend/requirements.txt`):
	- fastapi==0.111.0
	- uvicorn[standard]==0.30.1
	- httpx==0.27.0
	- python-dotenv==1.0.1

Note: If you encounter type or build errors in the frontend, align `@types/react` with the installed React minor/patch version or pin `react` to `18.2.x` which has broader @types compatibility. The project was developed against a modern Node toolchain and current TypeScript.

### Backend

```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend will be available at <http://localhost:8000>.

#### Environment variables

The backend calls `load_dotenv()` so you can provide runtime configuration via a `.env` file placed in the `backend/` folder. The app currently doesn't require any specific variables to run, but you may want to store values like API keys, database URLs or a custom port there. Example `.env`:

```
# Example backend/.env
PORT=8000
DATABASE_URL=sqlite:///./dev.db
API_KEY=
# Add any provider keys here (e.g. OPENAI_API_KEY) and reference them from code using os.getenv("API_KEY")
```

If you change the port or host settings, update the frontend CORS targets accordingly (see the CORS origins in `backend/app/main.py`).

### Frontend

```cmd
cd frontend
npm install
npm run dev
```

The Vite dev server starts on <http://localhost:5173>. The `/api` requests are proxied to the FastAPI server automatically.

## Testing the setup

After both servers are running, browse to <http://localhost:5173> and you should see the splash animation. Try stopping the backend server to see the offline messaging update.


## Next Steps

- Replace the stock video URL with branded footage hosted in your CDN.
- Extend the FastAPI service to return live onboarding data.
- Transition the splash to the main application shell once the rest of the app is ready.
