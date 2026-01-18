import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Populating eventId in ShiftRequest...');

  // Get all shift requests (migration already completed, this is for reference only)
  const requests = await prisma.shiftRequest.findMany({
    include: {
      shift: true,
    },
  });

  console.log(`Found ${requests.length} total shift requests`);

  // Verify all requests have eventId matching their shift's eventId
  let mismatches = 0;

  for (const request of requests) {
    if (request.eventId !== request.shift.eventId) {
      console.warn(
        `Mismatch found: request ${request.id} has eventId ${request.eventId} but shift has ${request.shift.eventId}`
      );
      mismatches++;
    }
  }

  if (mismatches === 0) {
    console.log('Migration verification complete: All requests have correct eventId');
  } else {
    console.log(`Found ${mismatches} mismatches that need fixing`);
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
