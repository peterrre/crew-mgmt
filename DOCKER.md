# Docker Setup Guide

This guide explains how to run the Crew Management application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+

## Configuration Options

### Option 1: Full Stack with Docker Compose (Recommended)

Run both the database and application in containers.

**1. Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and set:
```env
DATABASE_URL="postgresql://crewuser:crewpass@db:5432/crewmgmt"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**2. Build and start all services:**

```bash
docker compose up -d --build
```

**3. Seed the database (optional):**

```bash
docker compose exec app npx prisma db seed
```

**4. Access the application:**

Open [http://localhost:3000](http://localhost:3000)

### Option 2: Database Only (Development Mode)

Run only the database in Docker, run the app locally.

**1. Start the database:**

```bash
docker compose up db -d
```

**2. Configure `.env` for local development:**

```env
DATABASE_URL="postgresql://crewuser:crewpass@localhost:5432/crewmgmt"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**3. Install dependencies and run migrations:**

```bash
npm install
# or
yarn install

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

**4. Start the development server:**

```bash
npm run dev
# or
yarn dev
```

## Database Credentials

| Setting | Value |
|---------|-------|
| Host | `db` (in Docker) or `localhost` (from host) |
| Port | `5432` |
| Database | `crewmgmt` |
| User | `crewuser` |
| Password | `crewpass` |

## Default Test Accounts

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | john@doe.com | johndoe123 |
| Crew | alice@crew.com | crew123 |
| Volunteer | david@volunteer.com | volunteer123 |

## Common Commands

### View logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f db
```

### Stop services

```bash
docker compose down
```

### Stop and remove data

```bash
docker compose down -v
```

### Rebuild after code changes

```bash
docker compose up -d --build app
```

### Access database directly

```bash
docker compose exec db psql -U crewuser -d crewmgmt
```

### Run Prisma commands

```bash
# Migrations
docker compose exec app npx prisma migrate deploy

# Seed
docker compose exec app npx prisma db seed

# Prisma Studio
docker compose exec app npx prisma studio
```

### Reset database

```bash
docker compose exec app npx prisma migrate reset
```

## Troubleshooting

### Database connection issues

If the app can't connect to the database:

1. Check database is running: `docker compose ps`
2. Check database logs: `docker compose logs db`
3. Verify DATABASE_URL uses correct host (`db` for Docker, `localhost` for local)

### Application won't start

1. Check logs: `docker compose logs app`
2. Rebuild: `docker compose up -d --build app`
3. Verify environment variables in `.env`

### Port conflicts

If port 3000 or 5432 is already in use, edit `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "3001:3000"  # Change host port
  db:
    ports:
      - "5433:5432"  # Change host port
```

Then update DATABASE_URL accordingly.

## Production Deployment

For production deployment:

1. Generate a strong NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

2. Update NEXTAUTH_URL to your production domain

3. Consider using environment-specific docker-compose files:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

4. Use secrets management for sensitive data

5. Set up proper backup for the postgres_data volume

## Development with Docker

For active development, you may want to use volumes for hot reloading:

```yaml
services:
  app:
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
```

However, this is already configured in the devcontainer for VS Code users.
