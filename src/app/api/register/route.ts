import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registrationSchema } from "@/lib/validators/registration";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registrationSchema.parse(body);

    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.$transaction(async (tx) => {
      const partner = await tx.partner.create({
        data: {
          companyName: data.companyName,
          address: data.address || null,
          taxId: data.taxId || null,
          boltClientId: data.boltClientId,
          boltClientSecret: data.boltClientSecret,
          uberClientId: data.uberClientId || null,
          uberClientSecret: data.uberClientSecret || null,
        },
      });

      await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "PARTNER_ADMIN",
          partnerId: partner.id,
        },
      });
    });

    return NextResponse.json(
      { success: true, message: "Registrierung erfolgreich" },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.issues.map((e) => e.message).join(", ");
      return NextResponse.json(
        { success: false, error: messages },
        { status: 400 }
      );
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Diese E-Mail-Adresse ist bereits registriert" },
        { status: 409 }
      );
    }

    console.error("Registration error:", err);
    return NextResponse.json(
      { success: false, error: "Registrierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
