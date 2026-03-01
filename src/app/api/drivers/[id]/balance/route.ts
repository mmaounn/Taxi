import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calculateDriverBalance,
  getBalanceHistory,
  addManualAdjustment,
} from "@/lib/settlement/balance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Drivers can only see their own balance
  if (session.user.role === "DRIVER" && session.user.driverId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify driver belongs to partner
  const driver = await db.driver.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const balance = await calculateDriverBalance(id);
  const history = await getBalanceHistory(id);

  return NextResponse.json({
    currentBalance: balance.currentBalance,
    lastEntry: balance.lastEntry,
    history: history.map((entry) => ({
      id: entry.id,
      periodStart: entry.periodStart.toISOString(),
      periodEnd: entry.periodEnd.toISOString(),
      openingBalance: Number(entry.openingBalance),
      settlementNet: Number(entry.settlementNet),
      lineItemsTotal: Number(entry.lineItemsTotal),
      cashCollected: Number(entry.cashCollected),
      payoutMade: Number(entry.payoutMade),
      adjustments: Number(entry.adjustments),
      closingBalance: Number(entry.closingBalance),
      notes: entry.notes,
      settlement: entry.settlement,
      createdAt: entry.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const { amount, notes } = body;
  if (typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Verify driver belongs to partner
  const driver = await db.driver.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const entry = await addManualAdjustment({
    driverId: id,
    partnerId: session.user.partnerId,
    amount,
    notes,
  });

  return NextResponse.json(entry, { status: 201 });
}
