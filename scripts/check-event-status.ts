import { prisma } from '../lib/db';

async function checkEventStatus() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      acceptingVolunteers: true,
      isArchived: true,
      startDate: true,
    },
    orderBy: {
      startDate: 'desc',
    },
    take: 5,
  });

  console.log('\n=== Recent Events ===');
  for (const event of events) {
    console.log(`\nEvent: ${event.name}`);
    console.log(`  ID: ${event.id}`);
    console.log(`  Start Date: ${event.startDate}`);
    console.log(`  Accepting Volunteers: ${event.acceptingVolunteers}`);
    console.log(`  Is Archived: ${event.isArchived}`);
  }

  // Check for any volunteer applications
  const applications = await prisma.volunteerApplication.findMany({
    select: {
      id: true,
      status: true,
      event: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  console.log('\n\n=== Recent Applications ===');
  if (applications.length === 0) {
    console.log('No applications found');
  } else {
    for (const app of applications) {
      console.log(`\nApplication ${app.id}`);
      console.log(`  Event: ${app.event.name}`);
      console.log(`  User: ${app.user.name || app.user.email}`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Created: ${app.createdAt}`);
    }
  }

  await prisma.$disconnect();
}

checkEventStatus();
