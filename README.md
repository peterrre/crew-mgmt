# Crew Management

A comprehensive web application for managing event crews, volunteers, and shift scheduling with advanced reporting and calendar features.

## Features

### Core Features
- **User Authentication**: Secure login and registration with role-based access control
- **Role Management**: Support for Admin, Crew, and Volunteer roles with different permissions
- **Shift Scheduling**: Create and manage shifts for events with drag-and-drop calendar interface
- **Volunteer Signup**: Volunteers can register and set their availability preferences
- **Profile Management**: Users can manage their profiles and update personal information

### Advanced Management Tools
- **Admin Dashboard**: Overview with statistics on crew members, volunteers, and total helpers
- **Helpers Management**: Add, edit, and delete crew members and volunteers with role assignments
- **Schedule Editor**: Interactive calendar for creating and editing shifts, assigning helpers to shifts
- **Hours Report**: Detailed reporting on hours worked by each helper with filtering by week, month, or custom date ranges
- **Personal Calendar**: Individual calendar views for helpers to see their assigned shifts
- **Availability Management**: Volunteers can edit their availability for better shift assignments

### API Endpoints
- **Authentication API**: Secure login/logout with NextAuth.js
- **Helpers API**: CRUD operations for managing users/helpers
- **Shifts API**: Create, read, update, delete shifts with helper assignments
- **Reports API**: Generate hours worked reports with flexible filtering
- **Profile API**: User profile management

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: NextAuth.js with secure session management
- **Styling**: Tailwind CSS with custom gradients and responsive design
- **UI Components**: Radix UI, Headless UI, and custom components
- **Calendar**: React Big Calendar for interactive scheduling
- **Forms**: React Hook Form with validation

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Yarn or npm package manager

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd crew-mgmt
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   # or
   yarn install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the root directory:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/crewmgmt"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-here"
   ```

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed the database with sample data (optional)
   npx prisma db seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Users (after seeding)

| Email              | Password     | Role      |
|--------------------|--------------|-----------|
| john@doe.com      | johndoe123  | Admin    |
| alice@crew.com    | crew123     | Crew     |
| bob@crew.com      | crew123     | Crew     |
| david@volunteer.com| volunteer123| Volunteer |

## Project Structure

```
crew-mgmt/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── admin-dashboard.tsx
│   ├── helpers-management.tsx
│   ├── hours-report.tsx
│   ├── schedule-editor.tsx
│   └── ...
├── lib/                   # Utility libraries
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npx prisma studio` - Open Prisma Studio for database management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
