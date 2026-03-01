import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lineItemTemplateCreateSchema } from "@/lib/validators/line-item";

export async function GET() {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await db.lineItemTemplate.findMany({
    where: { partnerId: session.user.partnerId },
    include: { driver: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.partnerId || session.user.role === "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = lineItemTemplateCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await db.lineItemTemplate.create({
    data: {
      partnerId: session.user.partnerId,
      ...parsed.data,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
