import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lineItemCreateSchema } from "@/lib/validators/line-item";
import Decimal from "decimal.js";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const settlement = await db.settlement.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const lineItems = await db.settlementLineItem.findMany({
    where: { settlementId: id },
    include: { template: { select: { description: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(lineItems);
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

  const parsed = lineItemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settlement = await db.settlement.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  // Create the line item
  const lineItem = await db.settlementLineItem.create({
    data: {
      settlementId: id,
      type: parsed.data.type,
      description: parsed.data.description,
      amount: parsed.data.amount,
      isAutoApplied: false,
    },
  });

  // Recalculate settlement totals
  await recalculateSettlementLineItems(id);

  return NextResponse.json(lineItem, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const lineItemId = searchParams.get("lineItemId");

  if (!lineItemId) {
    return NextResponse.json({ error: "lineItemId required" }, { status: 400 });
  }

  const settlement = await db.settlement.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  await db.settlementLineItem.delete({
    where: { id: lineItemId },
  });

  await recalculateSettlementLineItems(id);

  return NextResponse.json({ success: true });
}

async function recalculateSettlementLineItems(settlementId: string) {
  const lineItems = await db.settlementLineItem.findMany({
    where: { settlementId },
  });

  let lineItemsTotal = new Decimal(0);
  for (const item of lineItems) {
    const amount = new Decimal(item.amount.toString());
    if (item.type === "BONUS") {
      lineItemsTotal = lineItemsTotal.plus(amount);
    } else {
      lineItemsTotal = lineItemsTotal.minus(amount);
    }
  }

  const settlement = await db.settlement.findUnique({
    where: { id: settlementId },
  });
  if (!settlement) return;

  const totalPlatformNet = new Decimal(settlement.totalPlatformNet?.toString() || "0");
  const partnerCommission = new Decimal(settlement.partnerCommissionAmount?.toString() || "0");
  const vehicleRental = new Decimal(settlement.vehicleRentalDeduction?.toString() || "0");
  const insurance = new Decimal(settlement.insuranceDeduction?.toString() || "0");
  const fuel = new Decimal(settlement.fuelCostDeduction?.toString() || "0");
  const cashCollected = new Decimal(settlement.cashCollectedByDriver?.toString() || "0");

  const driverNetEarnings = totalPlatformNet
    .minus(partnerCommission)
    .minus(vehicleRental)
    .minus(insurance)
    .minus(fuel)
    .plus(lineItemsTotal)
    .toDecimalPlaces(2);

  const payoutAmount = driverNetEarnings.minus(cashCollected).toDecimalPlaces(2);

  await db.settlement.update({
    where: { id: settlementId },
    data: {
      lineItemsTotal: lineItemsTotal.toNumber(),
      driverNetEarnings: driverNetEarnings.toNumber(),
      payoutAmount: payoutAmount.toNumber(),
    },
  });
}
