# Crew Management

A comprehensive web application for managing event crews, volunteers, and shift scheduling with advanced reporting and calendar features.

## Features

### Event Management
- **Create Events**: Create events with name, description, dates, location, and contact person
- **Edit Events**: Modify event details with consistent UI experience
- **Archive Events**: Soft-delete events to hide them from the main list while preserving data
- **Restore Events**: Restore archived events back to active status
- **Delete Events**: Permanently delete events with confirmation dialog
- **Contact Person**: Only Admin and Crew members can be assigned as event contact persons
- **Volunteer Applications**: Toggle events to accept volunteer applications, allowing volunteers to apply directly
- **Event Context**: All shifts display their associated event, making it easy to see which event each task belongs to

### Core Features
- **User Authentication**: Secure login and registration with role-based access control
- **Role Management**: Support for Admin, Crew, and Volunteer roles with different permissions
- **Shift Scheduling**: Create and manage shifts for events with drag-and-drop calendar interface
- **Structured Availability Management**: Volunteers can set detailed availability slots with recurring patterns
- **Volunteer Signup**: Volunteers can register and set their availability preferences
- **Profile Management**: Users can manage their profiles and update personal information
- **Shift Change Requests**: Volunteers can request changes to their assigned shifts (swap, cancel, modify)

### Advanced Management Tools
- **Admin Dashboard**: Overview with statistics on crew members, volunteers, and total helpers
- **Helpers Management**: Add, edit, and delete crew members and volunteers with role assignments
- **Enhanced Schedule Editor**: Interactive calendar with advanced filtering (all, assigned, unassigned, availability, matching, event-period), drag-and-drop interface, and visual availability matching
- **Auto-Assignment System**: Automatically assign unassigned shifts to available volunteers based on their availability slots
- **Hours Report**: Detailed reporting on hours worked by each helper with filtering by week, month, or custom date ranges
- **Personal Calendar**: Individual calendar views for helpers to see their assigned shifts
- **Availability Management**: Volunteers can edit their structured availability slots with recurring patterns
- **Shift Request Management**: Handle volunteer requests for shift changes, swaps, and cancellations

### API Endpoints
- **Authentication API**: Secure login/logout with NextAuth.js
- **Events API**: CRUD operations for events with archive/restore functionality
- **Helpers API**: CRUD operations for managing users/helpers
- **Shifts API**: Create, read, update, delete shifts with helper assignments and auto-assignment functionality
- **Shift Requests API**: Manage volunteer requests for shift changes (swap, cancel, modify)
- **Availability API**: Manage structured availability slots with recurring patterns
- **Reports API**: Generate hours worked reports with flexible filtering
- **Profile API**: User profile management

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: NextAuth.js with secure session management
- **Styling**: Tailwind CSS with custom gradients and responsive design
- **UI Components**: Radix UI (shadcn/ui) and custom components
- **Calendar**: React Big Calendar with custom agenda view and advanced filtering
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for robust date manipulation and formatting

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm package manager

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd crew-mgmt
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/crewmgmt"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-here"
   ```

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database (development)
   npx prisma db push

   # Seed the database with sample data (optional)
   npx prisma db seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Users (after seeding)

| Email                | Password      | Role      |
|----------------------|---------------|-----------|
| john@doe.com         | johndoe123    | Admin     |
| alice@crew.com       | crew123       | Crew      |
| bob@crew.com         | crew123       | Crew      |
| charlie@crew.com     | crew123       | Crew      |
| david@volunteer.com  | volunteer123  | Volunteer |
| emma@volunteer.com   | volunteer123  | Volunteer |
| frank@volunteer.com  | volunteer123  | Volunteer |
| grace@volunteer.com  | volunteer123  | Volunteer |

## Project Structure

```
crew-mgmt/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages (events, helpers, etc.)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── event-form.tsx    # Event create/edit form
│   ├── event-actions.tsx # Archive/delete event actions
│   ├── events-list.tsx   # Events list with archive toggle
│   └── ...
├── contexts/             # React contexts
├── lib/                  # Utility libraries
│   ├── actions/         # Server actions
│   └── db.ts            # Prisma client
├── prisma/              # Database schema and migrations
└── public/              # Static assets
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma db push` - Push schema changes to database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
