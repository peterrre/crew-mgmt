# Crew Management

A web application for managing event crews, volunteers, and shift scheduling.

## Features

- **User Authentication**: Secure login and registration with role-based access control
- **Role Management**: Support for Admin, Crew, and Volunteer roles
- **Shift Scheduling**: Create and manage shifts for events
- **Volunteer Signup**: Volunteers can register and set their availability
- **Profile Management**: Users can manage their profiles

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Headless UI

## Prerequisites

- Node.js 18+
- PostgreSQL database

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure environment variables**:
   Create a `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/crewmgmt"
   NEXTAUTH_SECRET="your-secret-key"
   ```

3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the database** (optional):
   ```bash
   npx prisma db seed
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Users (after seeding)

| Email | Password | Role |
|-------|----------|------|
| john@doe.com | johndoe123 | Admin |
| alice@crew.com | crew123 | Crew |
| bob@crew.com | crew123 | Crew |
| david@volunteer.com | volunteer123 | Volunteer |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
