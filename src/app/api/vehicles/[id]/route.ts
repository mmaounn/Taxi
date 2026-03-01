import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicleUpdateSchema } from "@/lib/validators/vehicle";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const vehicle = await db.vehicle.findFirst({
    where: { id, partnerId: session.user.partnerId },
    include: { drivers: { select: { id: true, firstName: true, lastName: true, status: true } } },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
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
  const parsed = vehicleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.vehicle.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  const data = parsed.data;
  const vehicle = await db.vehicle.update({
    where: { id },
    data: {
      ...(data.licensePlate !== undefined && { licensePlate: data.licensePlate }),
      ...(data.make !== undefined && { make: data.make || null }),
      ...(data.model !== undefined && { model: data.model || null }),
      ...(data.year !== undefined && { year: data.year ?? null }),
      ...(data.color !== undefined && { color: data.color || null }),
      ...(data.monthlyRentalCost !== undefined && { monthlyRentalCost: data.monthlyRentalCost ?? null }),
      ...(data.insuranceMonthlyCost !== undefined && { insuranceMonthlyCost: data.insuranceMonthlyCost ?? null }),
      ...(data.otherMonthlyCosts !== undefined && { otherMonthlyCosts: data.otherMonthlyCosts ?? null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.insuranceExpiry !== undefined && { insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null }),
      ...(data.registrationExpiry !== undefined && { registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : null }),
      ...(data.nextServiceDate !== undefined && { nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : null }),
      ...(data.nextInspectionDate !== undefined && { nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : null }),
    },
  });

  return NextResponse.json(vehicle);
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
  const existing = await db.vehicle.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  // Soft delete
  await db.vehicle.update({
    where: { id },
    data: { status: "DECOMMISSIONED" },
  });

  return NextResponse.json({ success: true });
}
