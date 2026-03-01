import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateSepaExport } from "@/lib/sepa/validator";
import { generateSepaXml } from "@/lib/sepa/generator";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { settlementIds, executionDate } = body as {
    settlementIds: string[];
    executionDate?: string;
  };

  if (!settlementIds || !Array.isArray(settlementIds) || settlementIds.length === 0) {
    return NextResponse.json({ error: "settlementIds required" }, { status: 400 });
  }

  // Fetch partner details
  const partner = await db.partner.findUnique({
    where: { id: session.user.partnerId },
    select: {
      companyName: true,
      bankIban: true,
      bankBic: true,
    },
  });

  if (!partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  // Fetch settlements with driver bank details
  const settlements = await db.settlement.findMany({
    where: {
      id: { in: settlementIds },
      partnerId: session.user.partnerId,
    },
    include: {
      driver: {
        select: {
          firstName: true,
          lastName: true,
          bankIban: true,
          bankBic: true,
        },
      },
    },
  });

  // Validate
  const validation = validateSepaExport({
    partnerIban: partner.bankIban,
    partnerName: partner.companyName,
    settlements: settlements.map((s) => ({
      id: s.id,
      driverName: `${s.driver.firstName} ${s.driver.lastName}`,
      driverIban: s.driver.bankIban,
      payoutAmount: Number(s.payoutAmount || 0),
      status: s.status,
    })),
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", errors: validation.errors, warnings: validation.warnings },
      { status: 400 }
    );
  }

  // Filter to only positive payouts
  const payableSettlements = settlements.filter(
    (s) => Number(s.payoutAmount || 0) > 0
  );

  if (payableSettlements.length === 0) {
    return NextResponse.json(
      { error: "No settlements with positive payout amounts" },
      { status: 400 }
    );
  }

  const now = new Date();
  const messageId = `MF-${now.toISOString().replace(/[-:T.Z]/g, "").substring(0, 14)}`;
  const execDate = executionDate || now.toISOString().split("T")[0];

  const payments = payableSettlements.map((s) => ({
    endToEndId: `${messageId}-${s.id.substring(0, 8)}`,
    creditorName: `${s.driver.firstName} ${s.driver.lastName}`,
    creditorIban: s.driver.bankIban!,
    creditorBic: s.driver.bankBic || undefined,
    amount: Number(s.payoutAmount),
    remittanceInfo: `Settlement ${new Date(s.periodStart).toLocaleDateString("de-AT")} - ${new Date(s.periodEnd).toLocaleDateString("de-AT")}`,
  }));

  const controlSum = payments.reduce((sum, p) => sum + p.amount, 0);

  const xml = generateSepaXml({
    messageId,
    creationDateTime: now.toISOString(),
    numberOfTransactions: payments.length,
    controlSum,
    initiatingPartyName: partner.companyName,
    debtorName: partner.companyName,
    debtorIban: partner.bankIban!,
    debtorBic: partner.bankBic || undefined,
    executionDate: execDate,
    payments,
  });

  const filename = `sepa_payout_${execDate}.xml`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
