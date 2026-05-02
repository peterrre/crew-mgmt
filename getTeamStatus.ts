import { prisma } from './lib/db';

async function getTeamStatus() {
  const now = new Date();

  // 1. Find ongoing event
  let event = await prisma.event.findFirst({
    where: {
      isArchived: false,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });

  // 2. If no ongoing, find upcoming (nearest future)
  if (!event) {
    event = await prisma.event.findFirst({
      where: {
        isArchived: false,
        startDate: { gt: now },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  // 3. If no upcoming, find most recent past event
  if (!event) {
    event = await prisma.event.findFirst({
      where: {
        isArchived: false,
        endDate: { lt: now },
      },
      orderBy: {
        endDate: 'desc',
      },
    });
  }

  if (!event) {
    console.log('No events found.');
    return;
  }

  console.log(`=== Current Team Status ===\n`);
  console.log(`Event: ${event.name}`);
  console.log(`Location: ${event.location || 'N/A'}`);
  console.log(`Start: ${event.startDate.toLocaleString()}`);
  console.log(`End: ${event.endDate.toLocaleString()}\n`);

  // Get crew for this event
  const crew = await prisma.eventCrew.findMany({
    where: { eventId: event.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  console.log(`Crew Members (${crew.length}):`);
  crew.forEach((c) => {
    const u = c.user;
    console.log(`  - ${u.name} (${u.email}) - Role: ${u.role}`);
  });
  console.log('');

  // Get shifts and assignments for this event
  const shifts = await prisma.shift.findMany({
    where: { eventId: event.id },
    include: {
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: {
      start: 'asc',
    },
  });

  console.log(`Shifts (${shifts.length}):`);
  shifts.forEach((shift) => {
    console.log(`  - ${shift.title}`);
    console.log(`    Time: ${shift.start.toLocaleString()} - ${shift.end.toLocaleString()}`);
    console.log(`    Assignments (${shift.assignments.length}):`);
    shift.assignments.forEach((a) => {
      const u = a.user;
      console.log(`      * ${u.name} (${u.email}) - Role: ${a.role}`);
    });
    console.log('');
  });
}

getTeamStatus()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });