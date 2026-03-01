import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { SettlementPDF } from "@/lib/pdf/settlement-pdf";

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
          email: true,
          bankIban: true,
          commissionModel: true,
          commissionRate: true,
        },
      },
      lineItems: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!settlement) {
    return NextResponse.json({ error: "Settlement not found" }, { status: 404 });
  }

  const partner = await db.partner.findUnique({
    where: { id: session.user.partnerId },
    select: { companyName: true },
  });

  const toNum = (v: unknown) => v ? Number(v) : null;
  const pdfElement = React.createElement(SettlementPDF, {
    settlement: {
      periodStart: settlement.periodStart.toISOString(),
      periodEnd: settlement.periodEnd.toISOString(),
      status: settlement.status,
      boltGrossRevenue: toNum(settlement.boltGrossRevenue),
      boltCommission: toNum(settlement.boltCommission),
      boltCashServiceFee: toNum(settlement.boltCashServiceFee),
      boltTips: toNum(settlement.boltTips),
      boltBonuses: toNum(settlement.boltBonuses),
      boltNetAmount: toNum(settlement.boltNetAmount),
      uberGrossRevenue: toNum(settlement.uberGrossRevenue),
      uberServiceFee: toNum(settlement.uberServiceFee),
      uberTips: toNum(settlement.uberTips),
      uberNetAmount: toNum(settlement.uberNetAmount),
      freenowGrossRevenue: toNum(settlement.freenowGrossRevenue),
      freenowCommission: toNum(settlement.freenowCommission),
      freenowTips: toNum(settlement.freenowTips),
      freenowNetAmount: toNum(settlement.freenowNetAmount),
      totalPlatformNet: toNum(settlement.totalPlatformNet),
      partnerCommissionAmount: toNum(settlement.partnerCommissionAmount),
      vehicleRentalDeduction: toNum(settlement.vehicleRentalDeduction),
      fuelCostDeduction: toNum(settlement.fuelCostDeduction),
      insuranceDeduction: toNum(settlement.insuranceDeduction),
      cashCollectedByDriver: toNum(settlement.cashCollectedByDriver),
      lineItemsTotal: toNum(settlement.lineItemsTotal),
      lineItems: settlement.lineItems.map((li) => ({
        type: li.type,
        description: li.description,
        amount: Number(li.amount),
        isAutoApplied: li.isAutoApplied,
      })),
      driverNetEarnings: toNum(settlement.driverNetEarnings),
      payoutAmount: toNum(settlement.payoutAmount),
      driver: {
        firstName: settlement.driver.firstName,
        lastName: settlement.driver.lastName,
        email: settlement.driver.email,
        bankIban: settlement.driver.bankIban,
        commissionModel: settlement.driver.commissionModel,
        commissionRate: toNum(settlement.driver.commissionRate),
      },
    },
    companyName: partner?.companyName || "Fleet Settlement",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(pdfElement as any);

  const driverName = `${settlement.driver.firstName}_${settlement.driver.lastName}`;
  const periodStr = settlement.periodStart.toISOString().split("T")[0];
  const filename = `settlement_${driverName}_${periodStr}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
