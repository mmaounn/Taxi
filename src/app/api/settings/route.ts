import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partner = await db.partner.findUnique({
    where: { id: session.user.partnerId },
  });

  const syncLogs = await db.syncLog.findMany({
    where: { partnerId: session.user.partnerId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    partner: partner
      ? {
          id: partner.id,
          companyName: partner.companyName,
          taxId: partner.taxId,
          address: partner.address,
          bankIban: partner.bankIban,
          bankBic: partner.bankBic,
          bankName: partner.bankName,
          defaultCommissionModel: partner.defaultCommissionModel,
          defaultCommissionRate: partner.defaultCommissionRate,
          defaultFixedFee: partner.defaultFixedFee,
          // Only indicate if configured, never expose secrets
          boltClientId: partner.boltClientId ? "configured" : null,
          boltClientSecret: partner.boltClientSecret ? "configured" : null,
          uberClientId: partner.uberClientId ? "configured" : null,
          uberClientSecret: partner.uberClientSecret ? "configured" : null,
          uberOrgId: partner.uberOrgId,
        }
      : null,
    syncLogs,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role !== "PARTNER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "companyName",
    "taxId",
    "address",
    "bankIban",
    "bankBic",
    "bankName",
    "boltClientId",
    "boltClientSecret",
    "uberClientId",
    "uberClientSecret",
    "uberOrgId",
    "defaultCommissionModel",
    "defaultCommissionRate",
    "defaultFixedFee",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field] || null;
    }
  }

  const partner = await db.partner.update({
    where: { id: session.user.partnerId },
    data: updateData,
  });

  return NextResponse.json({ success: true, partner });
}
