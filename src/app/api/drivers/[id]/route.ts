import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { driverUpdateSchema } from "@/lib/validators/driver";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const driver = await db.driver.findFirst({
    where: { id, partnerId: session.user.partnerId },
    include: { vehicle: true, settlements: { orderBy: { periodEnd: "desc" }, take: 5 } },
  });

  if (!driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  return NextResponse.json(driver);
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
  const parsed = driverUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.driver.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const data = parsed.data;
  const driver = await db.driver.update({
    where: { id },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.taxId !== undefined && { taxId: data.taxId || null }),
      ...(data.bankIban !== undefined && { bankIban: data.bankIban || null }),
      ...(data.bankBic !== undefined && { bankBic: data.bankBic || null }),
      ...(data.taxiLicenseNumber !== undefined && { taxiLicenseNumber: data.taxiLicenseNumber || null }),
      ...(data.taxiLicenseExpiry !== undefined && { taxiLicenseExpiry: data.taxiLicenseExpiry ? new Date(data.taxiLicenseExpiry) : null }),
      ...(data.commissionModel !== undefined && { commissionModel: data.commissionModel }),
      ...(data.commissionRate !== undefined && { commissionRate: data.commissionRate ?? null }),
      ...(data.fixedFee !== undefined && { fixedFee: data.fixedFee ?? null }),
      ...(data.hybridThreshold !== undefined && { hybridThreshold: data.hybridThreshold ?? null }),
      ...(data.perRideFee !== undefined && { perRideFee: data.perRideFee ?? null }),
      ...(data.settlementFrequency !== undefined && { settlementFrequency: data.settlementFrequency }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.boltDriverId !== undefined && { boltDriverId: data.boltDriverId || null }),
      ...(data.uberDriverUuid !== undefined && { uberDriverUuid: data.uberDriverUuid || null }),
      ...(data.freenowDriverId !== undefined && { freenowDriverId: data.freenowDriverId || null }),
      ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId || null }),
    },
  });

  return NextResponse.json(driver);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role !== "PARTNER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.driver.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  // Soft delete - set status to INACTIVE
  await db.driver.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  return NextResponse.json({ success: true });
}
