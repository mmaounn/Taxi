import Decimal from "decimal.js";
import { db } from "@/lib/db";

/**
 * Get current driver balance (Kontostand).
 */
export async function calculateDriverBalance(driverId: string): Promise<{
  currentBalance: number;
  lastEntry: {
    id: string;
    periodStart: string;
    periodEnd: string;
    closingBalance: number;
    updatedAt: string;
  } | null;
}> {
  const lastEntry = await db.driverBalance.findFirst({
    where: { driverId },
    orderBy: { periodEnd: "desc" },
  });

  return {
    currentBalance: lastEntry ? Number(lastEntry.closingBalance) : 0,
    lastEntry: lastEntry
      ? {
          id: lastEntry.id,
          periodStart: lastEntry.periodStart.toISOString(),
          periodEnd: lastEntry.periodEnd.toISOString(),
          closingBalance: Number(lastEntry.closingBalance),
          updatedAt: lastEntry.updatedAt.toISOString(),
        }
      : null,
  };
}

/**
 * Create a balance entry after a settlement has been calculated.
 * Finds the previous closing balance as the new opening balance.
 */
export async function createBalanceEntry(settlementId: string) {
  const settlement = await db.settlement.findUnique({
    where: { id: settlementId },
    include: { lineItems: true },
  });
  if (!settlement) return null;

  // Find previous closing balance
  const previousEntry = await db.driverBalance.findFirst({
    where: {
      driverId: settlement.driverId,
      periodEnd: { lt: settlement.periodStart },
    },
    orderBy: { periodEnd: "desc" },
  });

  const openingBalance = previousEntry
    ? new Decimal(previousEntry.closingBalance.toString())
    : new Decimal(0);

  const settlementNet = new Decimal(settlement.driverNetEarnings?.toString() || "0");
  const lineItemsTotal = new Decimal(settlement.lineItemsTotal?.toString() || "0");
  const cashCollected = new Decimal(settlement.cashCollectedByDriver?.toString() || "0");

  // closingBalance = opening + settlementNet - cashCollected
  // (settlementNet already includes lineItemsTotal from the engine)
  // payoutMade starts at 0 — updated when payment is made
  const closingBalance = openingBalance
    .plus(settlementNet)
    .minus(cashCollected)
    .toDecimalPlaces(2);

  const entry = await db.driverBalance.upsert({
    where: { settlementId },
    create: {
      driverId: settlement.driverId,
      partnerId: settlement.partnerId,
      settlementId,
      periodStart: settlement.periodStart,
      periodEnd: settlement.periodEnd,
      openingBalance: openingBalance.toNumber(),
      settlementNet: settlementNet.toNumber(),
      lineItemsTotal: lineItemsTotal.toNumber(),
      cashCollected: cashCollected.toNumber(),
      payoutMade: 0,
      adjustments: 0,
      closingBalance: closingBalance.toNumber(),
    },
    update: {
      openingBalance: openingBalance.toNumber(),
      settlementNet: settlementNet.toNumber(),
      lineItemsTotal: lineItemsTotal.toNumber(),
      cashCollected: cashCollected.toNumber(),
      closingBalance: closingBalance.toNumber(),
    },
  });

  return entry;
}

/**
 * Add a manual adjustment to a driver's balance.
 */
export async function addManualAdjustment({
  driverId,
  partnerId,
  amount,
  notes,
}: {
  driverId: string;
  partnerId: string;
  amount: number;
  notes?: string;
}) {
  // Find the latest balance entry
  const lastEntry = await db.driverBalance.findFirst({
    where: { driverId },
    orderBy: { periodEnd: "desc" },
  });

  const openingBalance = lastEntry
    ? new Decimal(lastEntry.closingBalance.toString())
    : new Decimal(0);

  const adjustmentAmount = new Decimal(amount);
  const closingBalance = openingBalance.plus(adjustmentAmount).toDecimalPlaces(2);

  const now = new Date();

  const entry = await db.driverBalance.create({
    data: {
      driverId,
      partnerId,
      periodStart: now,
      periodEnd: now,
      openingBalance: openingBalance.toNumber(),
      settlementNet: 0,
      lineItemsTotal: 0,
      cashCollected: 0,
      payoutMade: 0,
      adjustments: amount,
      closingBalance: closingBalance.toNumber(),
      notes: notes || "Manual adjustment",
    },
  });

  return entry;
}

/**
 * Get balance history for a driver, ordered by date descending.
 */
export async function getBalanceHistory(driverId: string, limit = 20) {
  return db.driverBalance.findMany({
    where: { driverId },
    orderBy: { periodEnd: "desc" },
    take: limit,
    include: {
      settlement: {
        select: {
          id: true,
          status: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  });
}
