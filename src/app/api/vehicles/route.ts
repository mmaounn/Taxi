import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicleCreateSchema } from "@/lib/validators/vehicle";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { partnerId: session.user.partnerId };
  if (status) where.status = status;

  const vehicles = await db.vehicle.findMany({
    where,
    include: { drivers: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { licensePlate: "asc" },
  });

  return NextResponse.json(vehicles);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = vehicleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const vehicle = await db.vehicle.create({
    data: {
      partnerId: session.user.partnerId,
      licensePlate: data.licensePlate,
      make: data.make || null,
      model: data.model || null,
      year: data.year ?? null,
      color: data.color || null,
      monthlyRentalCost: data.monthlyRentalCost ?? null,
      insuranceMonthlyCost: data.insuranceMonthlyCost ?? null,
      otherMonthlyCosts: data.otherMonthlyCosts ?? null,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
