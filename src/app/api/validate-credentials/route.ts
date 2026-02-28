import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const validateSchema = z.object({
  platform: z.enum(["bolt", "uber"]),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, clientId, clientSecret } = validateSchema.parse(body);

    if (platform === "bolt") {
      const res = await fetch("https://oidc.bolt.eu/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "fleet-integration:api",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { valid: false, error: `Bolt-Authentifizierung fehlgeschlagen: ${res.status}` },
          { status: 200 }
        );
      }

      return NextResponse.json({ valid: true });
    }

    if (platform === "uber") {
      const res = await fetch("https://login.uber.com/oauth/v2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "eats.report fleet.report",
        }),
      });

      if (!res.ok) {
        return NextResponse.json(
          { valid: false, error: `Uber-Authentifizierung fehlgeschlagen: ${res.status}` },
          { status: 200 }
        );
      }

      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: "Unbekannte Plattform" }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, error: "Ungültige Eingabe" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { valid: false, error: "Validierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
