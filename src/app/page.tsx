import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import {
  Zap,
  Calculator,
  Users,
  FileText,
  Banknote,
  SlidersHorizontal,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Bolt, Uber & FreeNow",
    description: "Automatische API-Synchronisierung aller Fahrten und Abrechnungsdaten.",
  },
  {
    icon: Calculator,
    title: "Automatische Abrechnungen",
    description: "Wöchentliche Berechnung der Fahrerabrechnungen auf Knopfdruck.",
  },
  {
    icon: Users,
    title: "Fahrer-Portal",
    description: "Eigener Zugang für jeden Fahrer mit Einsicht in Abrechnungen.",
  },
  {
    icon: FileText,
    title: "PDF-Export",
    description: "Professionelle Abrechnungsberichte als PDF herunterladen.",
  },
  {
    icon: Banknote,
    title: "Bargeld-Abrechnung",
    description: "Automatische Cash-Reconciliation für Barfahrten.",
  },
  {
    icon: SlidersHorizontal,
    title: "Flexible Provisionsmodelle",
    description: "Prozentual, fix, hybrid oder pro Fahrt — individuell pro Fahrer.",
  },
];

const steps = [
  { number: "1", title: "Registrieren", description: "Erstellen Sie Ihr Konto in wenigen Minuten." },
  { number: "2", title: "Plattformen verbinden", description: "Verbinden Sie Bolt, Uber oder FreeNow." },
  { number: "3", title: "Automatisch abrechnen", description: "Abrechnungen werden automatisch erstellt." },
];

function Waves() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Wave 1 — back, slowest */}
      <svg
        className="absolute bottom-0 w-[200%] animate-[wave_18s_ease-in-out_infinite]"
        style={{ height: "35%" }}
        viewBox="0 0 2880 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="rgba(59,130,246,0.12)"
          d="M0,160C240,200,480,260,720,260C960,260,1200,200,1440,160C1680,120,1920,100,2160,120C2400,140,2640,200,2760,230L2880,260V320H0Z"
        />
      </svg>
      {/* Wave 2 — middle */}
      <svg
        className="absolute bottom-0 w-[200%] animate-[wave_14s_ease-in-out_infinite_reverse]"
        style={{ height: "30%" }}
        viewBox="0 0 2880 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="rgba(37,99,235,0.18)"
          d="M0,200C240,240,480,280,720,270C960,260,1200,200,1440,180C1680,160,1920,180,2160,210C2400,240,2640,280,2760,290L2880,300V320H0Z"
        />
      </svg>
      {/* Wave 3 — front, fastest */}
      <svg
        className="absolute bottom-0 w-[200%] animate-[wave_10s_ease-in-out_infinite]"
        style={{ height: "22%" }}
        viewBox="0 0 2880 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="rgba(29,78,216,0.10)"
          d="M0,240C240,260,480,300,720,290C960,280,1200,240,1440,230C1680,220,1920,240,2160,260C2400,280,2640,300,2760,305L2880,310V320H0Z"
        />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24">
        <Waves />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Deine Flottenabrechnung, automatisiert.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Verbinden Sie Bolt, Uber und FreeNow — meineflotte.at berechnet
            Fahrerabrechnungen, Provisionen und Bargeldsalden automatisch.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Kostenlos starten</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Anmelden</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-blue-50/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">
            Alles, was Sie für Ihre Flotte brauchen
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden py-20">
        <div className="relative mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">
            So funktioniert&apos;s
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.number} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {s.number}
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/register">Jetzt kostenlos starten</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
