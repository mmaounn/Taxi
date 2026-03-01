import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lineItemTemplateUpdateSchema } from "@/lib/validators/line-item";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const template = await db.lineItemTemplate.findFirst({
    where: { id, partnerId: session.user.partnerId },
    include: { driver: { select: { firstName: true, lastName: true } } },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
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

  const parsed = lineItemTemplateUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.lineItemTemplate.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const template = await db.lineItemTemplate.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(template);
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

  const existing = await db.lineItemTemplate.findFirst({
    where: { id, partnerId: session.user.partnerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  await db.lineItemTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
