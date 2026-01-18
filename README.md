# Crew Management

A comprehensive web application for managing event crews, volunteers, and shift scheduling with advanced reporting and calendar features.

## Features

### ✨ Recent Feature Additions

#### Multi-Person Task Assignment (v2.0)
Shifts can now be assigned to multiple people with distinct roles:
- **Responsible Person**: Primary person managing the shift who can add/remove helpers
- **Helpers**: Additional people assisting with the task
- **Helper Limits**: Configure minimum and maximum number of helpers per shift
- **Permission System**: Role-based access for managing shift assignments
- **Legacy Support**: Backward compatible with single-person assignments

#### Overlap Prevention System
Intelligent conflict detection prevents scheduling conflicts:
- Automatically checks for overlapping shift assignments
- Validates when creating shifts, adding assignments, or updating times
- Clear error messages showing which shifts conflict
- Works across all shifts within an event

#### Volunteer Self-Service Applications
Volunteers can now apply to events themselves:
- **Browse Available Events**: View events that are accepting volunteer applications
- **Submit Applications**: Apply with optional messages explaining interest
- **Track Status**: Monitor application progress (Pending → Approved/Rejected)
- **Admin Review**: Admins can approve/reject with review notes
- **Automatic Crew Assignment**: Approved applications automatically add volunteers to event crew
- **Withdraw Option**: Volunteers can withdraw pending applications

#### Event Context for Volunteers
Enhanced visibility of event relationships:
- All shifts display their associated event information
- Volunteers can see which events they're assigned to
- "My Events" section in volunteer dashboard
- Event names displayed in calendar views

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
- **Multi-Person Shift Assignment**: Assign multiple people to each shift with designated roles:
  - **Responsible Person**: Manages the shift and can add/remove helpers
  - **Helpers**: Assist with the shift task
  - **Min/Max Limits**: Set minimum and maximum helper requirements per shift
- **Shift Scheduling**: Create and manage shifts for events with drag-and-drop calendar interface
- **Overlap Prevention**: System automatically prevents assigning people to overlapping shifts
- **Structured Availability Management**: Volunteers can set detailed availability slots with recurring patterns
- **Volunteer Signup**: Volunteers can register and set their availability preferences
- **Profile Management**: Users can manage their profiles and update personal information
- **Shift Change Requests**: Volunteers can request changes to their assigned shifts (swap, cancel, modify)

### Advanced Management Tools
- **Admin Dashboard**: Overview with statistics on crew members, volunteers, and total helpers
- **Helpers Management**: Add, edit, and delete crew members and volunteers with role assignments
- **Enhanced Schedule Editor**: Interactive calendar with advanced filtering (all, assigned, unassigned, availability, matching, event-period), drag-and-drop interface, and visual availability matching
- **Multi-Person Assignment UI**: Manage shift assignments with visual indicators showing current/min/max helper counts
- **Auto-Assignment System**: Automatically assign unassigned shifts to available volunteers based on their availability slots
- **Hours Report**: Detailed reporting on hours worked by each helper with filtering by week, month, or custom date ranges
- **Personal Calendar**: Individual calendar views for helpers to see their assigned shifts with event context
- **Availability Management**: Volunteers can edit their structured availability slots with recurring patterns
- **Shift Request Management**: Handle volunteer requests for shift changes, swaps, and cancellations
- **Volunteer Application Management**:
  - Volunteers can browse available events and submit applications with optional messages
  - Track application status (Pending, Approved, Rejected, Withdrawn)
  - Admins can review, approve, or reject applications with review notes
  - Approved applications automatically add volunteers to event crew
  - Withdraw pending applications at any time

### API Endpoints
- **Authentication API**: Secure login/logout with NextAuth.js
- **Events API**: CRUD operations for events with archive/restore functionality and volunteer application settings
- **Helpers API**: CRUD operations for managing users/helpers
- **Shifts API**: Create, read, update, delete shifts with multi-person assignments and overlap prevention
- **Shift Assignments API**: Manage multiple assignments per shift with role-based permissions (RESPONSIBLE/HELPER)
- **Shift Requests API**: Manage volunteer requests for shift changes (swap, cancel, modify)
- **Volunteer Applications API**: Submit, review, approve/reject volunteer applications to events
- **Available Events API**: List events accepting volunteer applications
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

## Database Schema

### Core Models

- **User**: User accounts with roles (ADMIN, CREW, VOLUNTEER)
- **Event**: Events with dates, location, and volunteer application settings
- **EventCrew**: Many-to-many relationship linking users to events
- **Shift**: Individual shifts/tasks with time slots and helper limits
- **ShiftAssignment**: Multi-person assignments with roles (RESPONSIBLE/HELPER)
- **AvailabilitySlot**: Structured availability patterns for volunteers
- **ShiftRequest**: Requests for shift changes (swap, cancel, modify)
- **VolunteerApplication**: Applications from volunteers to join events

### Key Relationships

```
Event
  ├── EventCrew (many-to-many with User)
  ├── Shifts
  │   └── ShiftAssignments (many, with role)
  │       └── User
  └── VolunteerApplications
      └── User (applicant)
```

## Project Structure

```
crew-mgmt/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── shifts/[id]/assignments/  # Multi-person assignment endpoints
│   │   ├── volunteer-applications/   # Application management
│   │   ├── available-events/         # Events accepting volunteers
│   │   └── my-events/               # User's event assignments
│   ├── admin/             # Admin pages (events, helpers, etc.)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── event-form.tsx    # Event create/edit form
│   ├── event-actions.tsx # Archive/delete event actions
│   ├── events-list.tsx   # Events list with archive toggle
│   ├── shift-assignment-manager.tsx  # Multi-person assignment UI
│   ├── available-events.tsx          # Browse available events
│   ├── my-applications.tsx           # Track application status
│   ├── event-applications-manager.tsx # Admin review interface
│   └── ...
├── contexts/             # React contexts
│   └── event-data-context.tsx  # Event data with applications
├── lib/                  # Utility libraries
│   ├── actions/         # Server actions
│   └── db.ts            # Prisma client
├── prisma/              # Database schema and migrations
│   └── schema.prisma    # Data models with multi-person assignments
├── scripts/             # Utility scripts
│   └── migrate-shift-assignments.ts  # Migration script for legacy data
└── public/              # Static assets
```

## Permission System

### Shift Assignment Permissions

| Action | ADMIN | RESPONSIBLE | HELPER |
|--------|-------|-------------|--------|
| Assign RESPONSIBLE | ✅ | ❌ | ❌ |
| Add HELPER | ✅ | ✅ | ❌ |
| Remove HELPER | ✅ | ✅ | Self only |
| Set min/max helpers | ✅ | ❌ | ❌ |
| Update shift times | ✅ | ❌ | ❌ |

### Volunteer Application Workflow

1. **Admin** enables "Accepting Volunteers" for an event
2. **Volunteer** browses available events and submits application
3. **Admin** reviews application in Applications tab
4. **Admin** approves or rejects with optional review note
5. If approved: Volunteer automatically added to event crew
6. **Volunteer** can withdraw pending applications at any time

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma db push` - Push schema changes to database
- `npx tsx scripts/migrate-shift-assignments.ts` - Migrate legacy shift assignments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
