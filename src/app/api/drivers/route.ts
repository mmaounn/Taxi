import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { driverCreateSchema } from "@/lib/validators/driver";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { partnerId: session.user.partnerId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const drivers = await db.driver.findMany({
    where,
    include: { vehicle: true },
    orderBy: { lastName: "asc" },
  });

  return NextResponse.json(drivers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = driverCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const driver = await db.driver.create({
    data: {
      partnerId: session.user.partnerId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      taxId: data.taxId || null,
      bankIban: data.bankIban || null,
      bankBic: data.bankBic || null,
      taxiLicenseNumber: data.taxiLicenseNumber || null,
      taxiLicenseExpiry: data.taxiLicenseExpiry ? new Date(data.taxiLicenseExpiry) : null,
      commissionModel: data.commissionModel,
      commissionRate: data.commissionRate ?? null,
      fixedFee: data.fixedFee ?? null,
      hybridThreshold: data.hybridThreshold ?? null,
      perRideFee: data.perRideFee ?? null,
      settlementFrequency: data.settlementFrequency,
      boltDriverId: data.boltDriverId || null,
      uberDriverUuid: data.uberDriverUuid || null,
      freenowDriverId: data.freenowDriverId || null,
      vehicleId: data.vehicleId || null,
    },
  });

  return NextResponse.json(driver, { status: 201 });
}
