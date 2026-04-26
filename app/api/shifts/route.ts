// Auto-assign shifts to available volunteers
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    // Find shifts that need more assignments
    const shiftsNeedingHelp = await prisma.shift.findMany({
      where: {
        eventId: eventId || undefined,
      },
      include: {
        assignments: true,
      },
      orderBy: { start: 'asc' },
    });

    // Filter to shifts that need more helpers (considering maxHelpers)
    const unassignedShifts = shiftsNeedingHelp.filter(
      (shift) => shift.assignments.length < shift.maxHelpers
    );

    let totalAssignments = 0;

    if (unassignedShifts.length === 0) {
      return NextResponse.json({ message: `Created ${totalAssignments} assignments` });
    }

    // Get all volunteers with their availability
    const volunteers = (await prisma.user.findMany({
      where: { role: 'VOLUNTEER' },
      include: { availabilitySlots: true },
    })) as any;

    for (const shift of unassignedShifts) {
      const remainingCapacity = shift.maxHelpers - shift.assignments.length;
      if (remainingCapacity <= 0) continue;

      // Find volunteers available for this shift
      const availableVolunteers = volunteers.filter((volunteer: any) => {
        // Check if volunteer is already assigned to this shift
        const alreadyAssigned = shift.assignments.some(
          (a) => a.userId === volunteer.id
        );
        if (alreadyAssigned) return false;

        return volunteer.availabilitySlots.some((slot: any) => {
          const slotStart = new Date(slot.start);
          const slotEnd = new Date(slot.end);
          return shift.start >= slotStart && shift.end <= slotEnd;
        });
      });

      // Assign up to remainingCapacity volunteers
      const volunteersToAssign = availableVolunteers.slice(0, remainingCapacity);

      for (let i = 0; i < volunteersToAssign.length; i++) {
        const volunteer = volunteersToAssign[i];
        // First assignment is RESPONSIBLE, rest are HELPERS
        const role = shift.assignments.length === 0 && i === 0 ? 'RESPONSIBLE' : 'HELPER';

        await prisma.$transaction([
          prisma.shiftAssignment.create({
            data: {
              shiftId: shift.id,
              userId: volunteer.id,
              role: role as 'RESPONSIBLE' | 'HELPER',
            },
          }),
          // Update legacy helperId for backward compatibility (only for RESPONSIBLE)
          ...(role === 'RESPONSIBLE'
            ? [
                prisma.shift.update({
                  where: { id: shift.id },
                  data: { helperId: volunteer.id },
                }),
              ]
            : []),
        ]);

        totalAssignments++;
      }
    }

    return NextResponse.json({ message: `Created ${totalAssignments} assignments` });
  } catch (error) {
    console.error('Error auto-assigning shifts:', error);
    return NextResponse.json(
      { error: 'Failed to auto-assign shifts' },
      { status: 500 }
    );
  }
}