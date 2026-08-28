# Deployment Guide for ByteFrost

## Overview
This guide explains how to deploy ByteFrost backend and frontend to production using Render (backend) and Vercel (frontend).

## Prerequisites
- Docker installed locally (for testing)
- Accounts on [Render](https://render.com) and [Vercel](https://vercel.com)
- GitHub repo connected to both services
- Environment variables configured

---

## 1. Backend Deployment (Render)

### Step 1: Prepare Render
1. Sign in to Render and create a new **Web Service**
2. Connect your GitHub repo (`stfusubhra/ByteFrost`)
3. Set the **root directory** to `./backend` (where Dockerfile lives)
4. Choose the **Docker** environment
5. Select the free plan (or upgrade as needed)

### Step 2: Environment Variables
Add these under **Environment** in the service settings:

| Key | Value | Source |
|-----|-------|--------|
| `DATABASE_URL` | From Render PostgreSQL (see below) | Auto-filled if you add a PostgreSQL instance |
| `REDIS_URL` | From Render Redis (see below) | Auto-filled if you add a Redis instance |
| `SECRET_KEY` | Generate a strong random string (e.g., 32-byte hex) | Manual |
| `ALGORITHM` | `HS256` | Manual |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Manual |
| `POSTGRES_SERVER` | From Render PostgreSQL | Auto-filled |
| `POSTGRES_PORT` | From Render PostgreSQL | Auto-filled |
| `POSTGRES_USER` | From Render PostgreSQL | Auto-filled |
| `POSTGRES_PASSWORD` | From Render PostgreSQL | Auto-filled |
| `POSTGRES_DB` | `bytefrost` (or your DB name) | Manual or from DB |

> 💡 **Tip**: Add a **PostgreSQL** and **Redis** instance to your Render account first, then link them to the Web Service. Render will auto-fill the connection strings.

### Step 3: Deploy
- Render will auto-detect the Dockerfile and build the image.
- Once built, it will run the command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Your API will be available at `https://<your-service>.onrender.com`

### Step 4: Health Check
Set the health check path to `/health` (already configured in `render.yaml`).

---

## 2. Frontend Deployment (Vercel)

### Step 1: Prepare Vercel
1. Sign in to Vercell and create a new project
2. Import the GitHub repo (`stfusubhra/ByteFrost`)
3. Vercel should auto-detect it's a Next.js app (from `frontend/`)

### Step 2: Configure Build Settings
- **Framework**: Next.js
- **Root Directory**: `frontend` (if not auto-detected)
- **Build Command**: `npm run build` (or `next build`)
- **Output Directory**: `frontend/out` (if using static export) or `.next` (for serverless)

> We are using a static export via `@vercel/static-build` (see `vercel.json`).  
> Ensure `next export` is run during build (handled by the build step).

### Step 3: Environment Variables
Add under **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://bytefrost-backend.onrender.com` (your Render backend URL) |

> This variable is exposed to the browser because it starts with `NEXT_PUBLIC_`.

### Step 4: Deploy
- Vercel will clone the repo, run the build, and deploy.
- Your frontend will be available at `https://<your-project>.vercel.app`

---

## 3. Local Deployment (Docker Compose)

For development or testing locally:

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Build and run backend (optional, if not using Render)
cd backend
docker build -t bytefrost-backend .
docker run -p 8000:8000 --network sih_project_default bytefrost-backend

# Start frontend
cd frontend
npm run dev
```

> The `docker-compose.yml` already defines PostgreSQL and Redis services.  
> The backend Dockerfile is for production; for dev, you may prefer `uvicorn app.main:app --reload`.

---

## 4. CI/CD (GitHub Actions)

The repo includes a CI workflow at `.github/workflows/ci.yml` that:
- Runs on push to `main` and `develop`
- Sets up Python, installs deps
- Runs linting (if added) and tests
- Builds the Docker image (optional)

You can extend it to deploy to Render/Vercel on merge to `main`.

---

## 5. Database Migrations

We use Alembic for migrations. To apply migrations on a new database:

```bash
cd backend
alembic upgrade head
```

To create a new migration after model changes:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## 6. Troubleshooting

### Backend
- **502 Bad Gateway**: Check Render logs for app crashes (often missing env vars)
- **Database connection**: Verify `DATABASE_URL` format: `postgresql://user:password@host:port/dbname`
- **Redis connection**: Ensure `REDIS_URL` is like `redis://:password@host:port`

### Frontend
- **API calls failing**: Verify `NEXT_PUBLIC_API_URL` is set and reachable
- **CORS errors**: Backend must allow the frontend origin (update `app/core/security.py` if needed)

### Docker
- **Port already in use**: Stop existing containers on port 8000 (`docker ps` and `docker stop`)
- **Image build fails**: Check Dockerfile syntax and ensure `requirements.txt` is valid

---

## 7. Next Steps for Automation

- Set up Render auto-deploy on push to `main`
- Set up Vercel auto-deploy on push to `main`
- Add secrets to GitHub Actions for automated testing against staging
- Consider adding a staging environment on Render/Vercel for PR previews

---

## Support

Ask @stfusubhra (Subhra) for help with deployment issues.

Happy deploying! 🚀