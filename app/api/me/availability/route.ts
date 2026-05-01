import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const availabilitySlots = await prisma.availabilitySlot.findMany({
      where: { userId },
      orderBy: { start: "asc" },
    });

    return NextResponse.json({ availabilitySlots });
  } catch (error) {
    console.error("Error fetching user availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
