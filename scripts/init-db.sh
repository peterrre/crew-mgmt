#!/bin/bash
set -e

echo "🚀 Initializing Crew Management Database..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker compose exec -T db pg_isready -U crewuser -d crewmgmt > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Database is ready!"

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed the database (optional)
read -p "🌱 Do you want to seed the database with sample data? (y/N): " seed_choice
if [[ "$seed_choice" =~ ^[Yy]$ ]]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
  echo "✅ Database seeded successfully!"
else
  echo "⏭️  Skipping database seeding"
fi

echo ""
echo "✨ Database initialization complete!"
echo ""
echo "📝 Test accounts (if seeded):"
echo "   Admin:     john@doe.com / johndoe123"
echo "   Crew:      alice@crew.com / crew123"
echo "   Volunteer: david@volunteer.com / volunteer123"
