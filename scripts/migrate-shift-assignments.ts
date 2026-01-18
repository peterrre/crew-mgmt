/**
 * Data migration script: Migrate existing helperId to ShiftAssignment
 *
 * This script creates ShiftAssignment records for all existing shifts
 * that have a helperId assigned, setting them as RESPONSIBLE.
 *
 * Run with: npx ts-node scripts/migrate-shift-assignments.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateShiftAssignments() {
  console.log('Starting migration of shift assignments...');

  // Find all shifts with a helperId that don't already have a ShiftAssignment
  const shiftsWithHelper = await prisma.shift.findMany({
    where: {
      helperId: { not: null },
    },
    include: {
      assignments: true,
    },
  });

  console.log(`Found ${shiftsWithHelper.length} shifts with helperId`);

  let migrated = 0;
  let skipped = 0;

  for (const shift of shiftsWithHelper) {
    // Check if this shift already has an assignment for this user
    const existingAssignment = shift.assignments.find(
      (a) => a.userId === shift.helperId
    );

    if (existingAssignment) {
      console.log(`Skipping shift ${shift.id} - assignment already exists`);
      skipped++;
      continue;
    }

    // Create ShiftAssignment with RESPONSIBLE role
    await prisma.shiftAssignment.create({
      data: {
        shiftId: shift.id,
        userId: shift.helperId!,
        role: 'RESPONSIBLE',
      },
    });

    console.log(`Migrated shift ${shift.id} -> user ${shift.helperId} as RESPONSIBLE`);
    migrated++;
  }

  console.log('\nMigration complete!');
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Total shifts with helper: ${shiftsWithHelper.length}`);
}

migrateShiftAssignments()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
