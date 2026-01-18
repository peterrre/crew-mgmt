.PHONY: help build up down logs restart clean seed db-only dev

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker compose build

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Show logs (use: make logs SERVICE=app)
	@if [ -z "$(SERVICE)" ]; then \
		docker compose logs -f; \
	else \
		docker compose logs -f $(SERVICE); \
	fi

restart: ## Restart all services
	docker compose restart

clean: ## Stop and remove all containers, networks, and volumes
	docker compose down -v

seed: ## Seed the database with sample data
	docker compose exec app npx prisma db seed

migrate: ## Run database migrations
	docker compose exec app npx prisma migrate deploy

db-only: ## Start only the database service
	docker compose up db -d

dev: db-only ## Start database and run app locally
	@echo "Database started. Run 'npm run dev' in another terminal."

init: ## Initialize the project (build, start, migrate, seed)
	@echo "Building and starting services..."
	docker compose up -d --build
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "Database is ready!"
	@echo "Do you want to seed the database? (y/N)"
	@read -r answer; \
	if [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
		echo "Seeding database..."; \
		docker compose exec app npx prisma db seed; \
		echo ""; \
		echo "Setup complete!"; \
		echo "Access the app at http://localhost:3000"; \
		echo ""; \
		echo "Test accounts:"; \
		echo "  Admin:     john@doe.com / johndoe123"; \
		echo "  Crew:      alice@crew.com / crew123"; \
		echo "  Volunteer: david@volunteer.com / volunteer123"; \
	else \
		echo "Skipping seed. Run 'make seed' later to seed the database."; \
	fi
