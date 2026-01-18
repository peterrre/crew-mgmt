# Quick Start with Docker

Get the Crew Management application running in 3 steps.

## Prerequisites

- Docker and Docker Compose installed
- 5 minutes of your time

## Quick Start

### Using Make (Easiest)

```bash
# One command to rule them all
make init
```

This will:
- Build Docker images
- Start database and application
- Run migrations
- Prompt to seed sample data
- Show test account credentials

Access at [http://localhost:3000](http://localhost:3000)

### Manual Setup

**1. Configure environment**

```bash
cp .env.example .env
```

**2. Start services**

```bash
docker compose up -d --build
```

**3. Seed database (optional)**

```bash
docker compose exec app npx prisma db seed
```

**4. Open application**

[http://localhost:3000](http://localhost:3000)

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | john@doe.com | johndoe123 |
| Crew | alice@crew.com | crew123 |
| Volunteer | david@volunteer.com | volunteer123 |

## Common Commands

```bash
# View logs
make logs

# View specific service logs
make logs SERVICE=app
make logs SERVICE=db

# Stop everything
make down

# Restart services
make restart

# Clean everything (removes data!)
make clean
```

## Development Mode

Want to run the app locally with hot reload?

```bash
# Start only database
make dev

# In another terminal
npm install
npm run dev
```

Update `.env`:
```env
DATABASE_URL="postgresql://crewuser:crewpass@localhost:5432/crewmgmt"
```

## Need Help?

- Full Docker guide: [DOCKER.md](DOCKER.md)
- Project README: [README.md](README.md)
- Issues: Check `docker compose logs`

## Troubleshooting

**Port already in use?**

Edit `docker-compose.yml` and change the port mappings:
```yaml
ports:
  - "3001:3000"  # Change 3001 to any free port
```

**Database won't start?**

```bash
docker compose down -v
docker compose up -d
```

**App can't connect to database?**

Check `.env` has correct DATABASE_URL:
- In Docker: `postgresql://crewuser:crewpass@db:5432/crewmgmt`
- Local dev: `postgresql://crewuser:crewpass@localhost:5432/crewmgmt`
