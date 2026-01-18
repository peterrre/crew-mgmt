/**
 * Fix script: Add missing EventCrew records
 *
 * This script finds all users assigned to shifts (via helperId or ShiftAssignment)
 * and ensures they have an EventCrew record for that event.
 *
 * Run with: npx tsx scripts/fix-event-crew.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEventCrew() {
  console.log('🔧 Fixing EventCrew records...\n');

  // Get all shifts with their assignments
  const shifts = await prisma.shift.findMany({
    include: {
      assignments: true,
      event: true,
    },
  });

  // Collect all user-event pairs that should have EventCrew records
  const userEventPairs = new Map<string, { userId: string; eventId: string; userName?: string; eventName?: string }>();

  for (const shift of shifts) {
    // From legacy helperId
    if (shift.helperId) {
      const key = `${shift.eventId}-${shift.helperId}`;
      if (!userEventPairs.has(key)) {
        userEventPairs.set(key, {
          userId: shift.helperId,
          eventId: shift.eventId,
          eventName: shift.event?.name,
        });
      }
    }

    // From ShiftAssignment
    for (const assignment of shift.assignments) {
      const key = `${shift.eventId}-${assignment.userId}`;
      if (!userEventPairs.has(key)) {
        userEventPairs.set(key, {
          userId: assignment.userId,
          eventId: shift.eventId,
          eventName: shift.event?.name,
        });
      }
    }
  }

  console.log(`Found ${userEventPairs.size} user-event pairs that should have EventCrew records\n`);

  let created = 0;
  let skipped = 0;

  for (const [key, { userId, eventId, eventName }] of userEventPairs) {
    // Check if EventCrew record already exists
    const existing = await prisma.eventCrew.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Get user info for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Create EventCrew record
    await prisma.eventCrew.create({
      data: {
        eventId,
        userId,
      },
    });

    console.log(`✅ Added ${user?.name || user?.email} to "${eventName}" crew`);
    created++;
  }

  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Already existed: ${skipped}`);
  console.log(`  Total pairs: ${userEventPairs.size}`);
}

fixEventCrew()
  .catch((e) => {
    console.error('Fix failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
