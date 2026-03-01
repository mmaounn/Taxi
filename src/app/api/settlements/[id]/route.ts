import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { settlementUpdateSchema } from "@/lib/validators/settlement";
import { createOrUpdateSettlement } from "@/lib/settlement/engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const where: Record<string, unknown> = {
    id,
    partnerId: session.user.partnerId,
  };

  // Drivers can only see their own
  if (session.user.role === "DRIVER" && session.user.driverId) {
    where.driverId = session.user.driverId;
  }

  const settlement = await db.settlement.findFirst({
    where,
    include: {
      driver: {
        select: {
          firstName: true,
          lastName: true,
          commissionModel: true,
          commissionRate: true,
          fixedFee: true,
          email: true,
          bankIban: true,
        },
      },
      rideData: {
        orderBy: { completedAt: "desc" },
      },
      lineItems: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  return NextResponse.json(settlement);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Handle recalculate action
  if (body.action === "recalculate") {
    const settlement = await db.settlement.findFirst({
      where: { id, partnerId: session.user.partnerId },
    });
    if (!settlement) {
      return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
    }

    await createOrUpdateSettlement({
      driverId: settlement.driverId,
      partnerId: settlement.partnerId,
      periodStart: settlement.periodStart,
      periodEnd: settlement.periodEnd,
    });

    const updated = await db.settlement.findUnique({ where: { id } });
    return NextResponse.json(updated);
  }

  const parsed = settlementUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.settlement.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (data.status) {
    updateData.status = data.status;
    if (data.status === "APPROVED") {
      updateData.approvedAt = new Date();
      updateData.approvedBy = session.user.id;
    }
    if (data.status === "PAID") {
      updateData.paidAt = new Date();
      updateData.payoutStatus = "TRANSFERRED";
    }
  }

  if (data.cashCollectedByDriver !== undefined) {
    const cash = data.cashCollectedByDriver ?? 0;
    updateData.cashCollectedByDriver = cash;
    // Recalculate payout when cash changes
    const driverNet = Number(existing.driverNetEarnings || 0);
    updateData.payoutAmount = driverNet - cash;
  }

  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.payoutReference !== undefined) updateData.payoutReference = data.payoutReference;
  if (data.payoutDate !== undefined) updateData.payoutDate = data.payoutDate ? new Date(data.payoutDate) : null;

  const settlement = await db.settlement.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(settlement);
}
