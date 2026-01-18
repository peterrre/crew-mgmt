import { prisma } from '../lib/db';

async function checkUserEventStatus() {
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log('\n=== All Users ===');
  for (const user of users) {
    console.log(`\n${user.name || user.email} (${user.role})`);
    console.log(`  ID: ${user.id}`);
  }

  // Get the Festival 2026 event
  const festivalEvent = await prisma.event.findFirst({
    where: {
      name: 'Festival 2026',
    },
    select: {
      id: true,
      name: true,
      acceptingVolunteers: true,
    },
  });

  if (!festivalEvent) {
    console.log('\nFestival 2026 not found');
    return;
  }

  console.log(`\n\n=== Festival 2026 Status ===`);
  console.log(`Event ID: ${festivalEvent.id}`);
  console.log(`Accepting Volunteers: ${festivalEvent.acceptingVolunteers}`);

  // Check who's in the event crew
  const eventCrew = await prisma.eventCrew.findMany({
    where: {
      eventId: festivalEvent.id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  console.log(`\n=== Event Crew Members (${eventCrew.length}) ===`);
  for (const crew of eventCrew) {
    console.log(`  - ${crew.user.name || crew.user.email} (${crew.user.role})`);
  }

  // Check all applications for this event
  const applications = await prisma.volunteerApplication.findMany({
    where: {
      eventId: festivalEvent.id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  console.log(`\n=== Applications (${applications.length}) ===`);
  for (const app of applications) {
    console.log(`  - ${app.user.name || app.user.email}: ${app.status}`);
  }

  await prisma.$disconnect();
}

checkUserEventStatus();
