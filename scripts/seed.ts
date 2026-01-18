import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.shiftAssignment.deleteMany();
  await prisma.volunteerApplication.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.eventCrew.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('johndoe123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create crew members
  const crewPassword = await bcrypt.hash('crew123', 10);
  const crew1 = await prisma.user.create({
    data: {
      email: 'alice@crew.com',
      name: 'Alice Johnson',
      passwordHash: crewPassword,
      role: 'CREW',
    },
  });

  const crew2 = await prisma.user.create({
    data: {
      email: 'bob@crew.com',
      name: 'Bob Smith',
      passwordHash: crewPassword,
      role: 'CREW',
    },
  });

  const crew3 = await prisma.user.create({
    data: {
      email: 'charlie@crew.com',
      name: 'Charlie Brown',
      passwordHash: crewPassword,
      role: 'CREW',
    },
  });
  console.log('✅ Created 3 crew members');

  // Create volunteers
  const volunteerPassword = await bcrypt.hash('volunteer123', 10);
  const volunteer1 = await prisma.user.create({
    data: {
      email: 'david@volunteer.com',
      name: 'David Lee',
      passwordHash: volunteerPassword,
      role: 'VOLUNTEER',
    },
  });

  const volunteer2 = await prisma.user.create({
    data: {
      email: 'emma@volunteer.com',
      name: 'Emma Wilson',
      passwordHash: volunteerPassword,
      role: 'VOLUNTEER',
    },
  });

  const volunteer3 = await prisma.user.create({
    data: {
      email: 'frank@volunteer.com',
      name: 'Frank Miller',
      passwordHash: volunteerPassword,
      role: 'VOLUNTEER',
    },
  });

  const volunteer4 = await prisma.user.create({
    data: {
      email: 'grace@volunteer.com',
      name: 'Grace Taylor',
      passwordHash: volunteerPassword,
      role: 'VOLUNTEER',
    },
  });
  console.log('✅ Created 4 volunteers');

  // Create availability slots for volunteers
  const availabilitySlots = [
    // David - Weekends
    {
      userId: volunteer1.id,
      start: new Date('2026-07-10T08:00:00Z'),
      end: new Date('2026-07-10T23:59:59Z'),
    },
    {
      userId: volunteer1.id,
      start: new Date('2026-07-11T08:00:00Z'),
      end: new Date('2026-07-11T23:59:59Z'),
    },
    {
      userId: volunteer1.id,
      start: new Date('2026-07-12T08:00:00Z'),
      end: new Date('2026-07-12T23:59:59Z'),
    },
    // Emma - Evenings
    {
      userId: volunteer2.id,
      start: new Date('2026-07-11T18:00:00Z'),
      end: new Date('2026-07-11T23:59:59Z'),
    },
    {
      userId: volunteer2.id,
      start: new Date('2026-07-12T18:00:00Z'),
      end: new Date('2026-07-12T23:59:59Z'),
    },
    // Frank - Full-time
    {
      userId: volunteer3.id,
      start: new Date('2026-07-10T08:00:00Z'),
      end: new Date('2026-07-12T23:59:59Z'),
    },
    // Grace - Mornings
    {
      userId: volunteer4.id,
      start: new Date('2026-07-10T08:00:00Z'),
      end: new Date('2026-07-10T12:00:00Z'),
    },
  ];

  for (const slot of availabilitySlots) {
    await prisma.availabilitySlot.create({ data: slot });
  }
  console.log(`✅ Created ${availabilitySlots.length} availability slots`);

  // Create event
  const event = await prisma.event.create({
    data: {
      name: 'Festival 2026',
      startDate: new Date('2026-07-10T00:00:00Z'),
      endDate: new Date('2026-07-12T23:59:59Z'),
    },
  });
  console.log('✅ Created event:', event.name);

  // Create shifts for Festival 2026
  const shifts = [
    // July 10, 2026 - Day 1
    {
      title: 'Stage Setup',
      start: new Date('2026-07-10T08:00:00Z'),
      end: new Date('2026-07-10T12:00:00Z'),
      helperId: crew1.id,
      eventId: event.id,
    },
    {
      title: 'Sound Check',
      start: new Date('2026-07-10T12:00:00Z'),
      end: new Date('2026-07-10T14:00:00Z'),
      helperId: crew2.id,
      eventId: event.id,
    },
    {
      title: 'Registration Desk',
      start: new Date('2026-07-10T14:00:00Z'),
      end: new Date('2026-07-10T18:00:00Z'),
      helperId: volunteer1.id,
      eventId: event.id,
    },
    {
      title: 'Main Stage Security',
      start: new Date('2026-07-10T18:00:00Z'),
      end: new Date('2026-07-10T23:00:00Z'),
      helperId: crew3.id,
      eventId: event.id,
    },
    {
      title: 'Bar Service',
      start: new Date('2026-07-10T16:00:00Z'),
      end: new Date('2026-07-10T22:00:00Z'),
      helperId: volunteer2.id,
      eventId: event.id,
    },

    // July 11, 2026 - Day 2
    {
      title: 'Morning Setup',
      start: new Date('2026-07-11T08:00:00Z'),
      end: new Date('2026-07-11T11:00:00Z'),
      helperId: crew1.id,
      eventId: event.id,
    },
    {
      title: 'Entrance Management',
      start: new Date('2026-07-11T11:00:00Z'),
      end: new Date('2026-07-11T15:00:00Z'),
      helperId: volunteer3.id,
      eventId: event.id,
    },
    {
      title: 'Main Stage Operations',
      start: new Date('2026-07-11T15:00:00Z'),
      end: new Date('2026-07-11T20:00:00Z'),
      helperId: crew2.id,
      eventId: event.id,
    },
    {
      title: 'Food Court Assistance',
      start: new Date('2026-07-11T12:00:00Z'),
      end: new Date('2026-07-11T18:00:00Z'),
      helperId: volunteer1.id,
      eventId: event.id,
    },
    {
      title: 'Crowd Control',
      start: new Date('2026-07-11T18:00:00Z'),
      end: new Date('2026-07-11T23:00:00Z'),
      helperId: crew3.id,
      eventId: event.id,
    },

    // July 12, 2026 - Day 3 (Final Day)
    {
      title: 'Final Day Setup',
      start: new Date('2026-07-12T09:00:00Z'),
      end: new Date('2026-07-12T12:00:00Z'),
      helperId: crew1.id,
      eventId: event.id,
    },
    {
      title: 'Information Booth',
      start: new Date('2026-07-12T12:00:00Z'),
      end: new Date('2026-07-12T17:00:00Z'),
      helperId: volunteer4.id,
      eventId: event.id,
    },
    {
      title: 'Stage Management',
      start: new Date('2026-07-12T14:00:00Z'),
      end: new Date('2026-07-12T20:00:00Z'),
      helperId: crew2.id,
      eventId: event.id,
    },
    {
      title: 'Merchandise Stand',
      start: new Date('2026-07-12T13:00:00Z'),
      end: new Date('2026-07-12T19:00:00Z'),
      helperId: volunteer2.id,
      eventId: event.id,
    },
    {
      title: 'Teardown & Cleanup',
      start: new Date('2026-07-12T20:00:00Z'),
      end: new Date('2026-07-12T23:59:00Z'),
      helperId: crew3.id,
      eventId: event.id,
    },
    {
      title: 'Final Security',
      start: new Date('2026-07-12T20:00:00Z'),
      end: new Date('2026-07-12T23:59:00Z'),
      helperId: volunteer3.id,
      eventId: event.id,
    },
    // Unassigned shifts - available for volunteers
    {
      title: 'Parking Assistance',
      start: new Date('2026-07-10T09:00:00Z'),
      end: new Date('2026-07-10T13:00:00Z'),
      helperId: null,
      eventId: event.id,
    },
    {
      title: 'VIP Area Support',
      start: new Date('2026-07-11T14:00:00Z'),
      end: new Date('2026-07-11T20:00:00Z'),
      helperId: null,
      eventId: event.id,
    },
    {
      title: 'Lost & Found Desk',
      start: new Date('2026-07-11T10:00:00Z'),
      end: new Date('2026-07-11T16:00:00Z'),
      helperId: null,
      eventId: event.id,
    },
    {
      title: 'Artist Hospitality',
      start: new Date('2026-07-12T11:00:00Z'),
      end: new Date('2026-07-12T18:00:00Z'),
      helperId: null,
      eventId: event.id,
    },
    {
      title: 'Evening Cleanup Crew',
      start: new Date('2026-07-10T21:00:00Z'),
      end: new Date('2026-07-10T23:30:00Z'),
      helperId: null,
      eventId: event.id,
    },
  ];

  for (const shift of shifts) {
    await prisma.shift.create({ data: shift });
  }
  console.log(`✅ Created ${shifts.length} shifts`);

  console.log('✨ Seeding complete!');
  console.log('\n📝 Test Accounts:');
  console.log('Admin: john@doe.com / johndoe123');
  console.log('Crew: alice@crew.com / crew123');
  console.log('Volunteer: david@volunteer.com / volunteer123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
