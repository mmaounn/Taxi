import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { settlementIds, payoutReference } = body as {
    settlementIds: string[];
    payoutReference?: string;
  };

  if (!settlementIds || !Array.isArray(settlementIds) || settlementIds.length === 0) {
    return NextResponse.json({ error: "settlementIds required" }, { status: 400 });
  }

  // Verify all settlements belong to partner and are APPROVED
  const settlements = await db.settlement.findMany({
    where: {
      id: { in: settlementIds },
      partnerId: session.user.partnerId,
    },
  });

  const notApproved = settlements.filter((s) => s.status !== "APPROVED");
  if (notApproved.length > 0) {
    return NextResponse.json(
      { error: `${notApproved.length} settlement(s) are not in APPROVED status` },
      { status: 400 }
    );
  }

  // Batch update to PAID
  const result = await db.settlement.updateMany({
    where: {
      id: { in: settlementIds },
      partnerId: session.user.partnerId,
      status: "APPROVED",
    },
    data: {
      status: "PAID",
      payoutStatus: "TRANSFERRED",
      payoutDate: new Date(),
      paidAt: new Date(),
      payoutReference: payoutReference || null,
    },
  });

  return NextResponse.json({
    success: true,
    updated: result.count,
  });
}
