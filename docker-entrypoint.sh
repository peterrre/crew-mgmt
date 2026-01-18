#!/bin/sh
set -e

echo "🚀 Starting Crew Management Application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until nc -z db 5432 2>/dev/null; do
  echo "Database not ready yet, waiting..."
  sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

echo "✨ Starting Next.js application..."
exec "$@"
