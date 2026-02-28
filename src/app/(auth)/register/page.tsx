"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  registrationStep1Schema,
  registrationStep2Schema,
  registrationStep3Schema,
  type RegistrationStep1,
  type RegistrationStep2,
  type RegistrationStep3,
} from "@/lib/validators/registration";

type ValidationStatus = "idle" | "loading" | "valid" | "invalid";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Step 1 form
  const step1Form = useForm<RegistrationStep1>({
    resolver: zodResolver(registrationStep1Schema),
    defaultValues: {
      companyName: "",
      address: "",
      taxId: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  // Step 2 form
  const step2Form = useForm<RegistrationStep2>({
    resolver: zodResolver(registrationStep2Schema),
    defaultValues: { boltClientId: "", boltClientSecret: "" },
  });
  const [boltStatus, setBoltStatus] = useState<ValidationStatus>("idle");
  const [boltError, setBoltError] = useState("");

  // Step 3 form
  const step3Form = useForm<RegistrationStep3>({
    resolver: zodResolver(registrationStep3Schema),
    defaultValues: { uberClientId: "", uberClientSecret: "" },
  });
  const [uberStatus, setUberStatus] = useState<ValidationStatus>("idle");
  const [uberError, setUberError] = useState("");

  async function validateCredentials(
    platform: "bolt" | "uber",
    clientId: string,
    clientSecret: string
  ) {
    const setStatus = platform === "bolt" ? setBoltStatus : setUberStatus;
    const setError = platform === "bolt" ? setBoltError : setUberError;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, clientId, clientSecret }),
      });
      const data = await res.json();
      if (data.valid) {
        setStatus("valid");
      } else {
        setStatus("invalid");
        setError(data.error || "Validierung fehlgeschlagen");
      }
    } catch {
      setStatus("invalid");
      setError("Verbindung fehlgeschlagen");
    }
  }

  function handleStep1() {
    step1Form.handleSubmit(() => setStep(2))();
  }

  function handleStep2() {
    step2Form.handleSubmit(() => {
      if (boltStatus !== "valid") {
        setBoltError("Bitte testen Sie zuerst die Bolt-Verbindung");
        return;
      }
      setStep(3);
    })();
  }

  async function handleComplete() {
    setSubmitting(true);
    setGlobalError("");

    const step1 = step1Form.getValues();
    const step2 = step2Form.getValues();
    const step3 = step3Form.getValues();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1,
          ...step2,
          uberClientId: step3.uberClientId || undefined,
          uberClientSecret: step3.uberClientSecret || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/login?registered=true");
      } else {
        setGlobalError(data.error || "Registrierung fehlgeschlagen");
      }
    } catch {
      setGlobalError("Ein Fehler ist aufgetreten");
    } finally {
      setSubmitting(false);
    }
  }

  function StatusIcon({ status }: { status: ValidationStatus }) {
    if (status === "loading") return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
    if (status === "valid") return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === "invalid") return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s === step
                    ? "bg-gray-900 text-white"
                    : s < step
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-12 ${s < step ? "bg-green-500" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        {globalError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {globalError}
          </div>
        )}

        {/* Step 1: Company Info */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Unternehmen registrieren</CardTitle>
              <CardDescription>
                Erstellen Sie Ihr Konto bei meineflotte.at
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStep1();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname *</Label>
                  <Input
                    id="companyName"
                    {...step1Form.register("companyName")}
                    placeholder="Mein Taxiunternehmen GmbH"
                  />
                  {step1Form.formState.errors.companyName && (
                    <p className="text-sm text-red-500">
                      {step1Form.formState.errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    {...step1Form.register("address")}
                    placeholder="Musterstraße 1, 1010 Wien"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">UID-Nummer</Label>
                  <Input
                    id="taxId"
                    {...step1Form.register("taxId")}
                    placeholder="ATU12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...step1Form.register("email")}
                    placeholder="office@meinefirma.at"
                  />
                  {step1Form.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {step1Form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort *</Label>
                    <Input
                      id="password"
                      type="password"
                      {...step1Form.register("password")}
                    />
                    {step1Form.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {step1Form.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirm">Passwort bestätigen *</Label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      {...step1Form.register("passwordConfirm")}
                    />
                    {step1Form.formState.errors.passwordConfirm && (
                      <p className="text-sm text-red-500">
                        {step1Form.formState.errors.passwordConfirm.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Weiter
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Bereits registriert?{" "}
                  <Link href="/login" className="text-gray-900 underline">
                    Anmelden
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Bolt Credentials */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Bolt verbinden</CardTitle>
              <CardDescription>
                Ihre Bolt Fleet API-Zugangsdaten sind erforderlich
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStep2();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="boltClientId">Bolt Client ID *</Label>
                  <Input
                    id="boltClientId"
                    {...step2Form.register("boltClientId")}
                    placeholder="Ihre Bolt Client ID"
                  />
                  {step2Form.formState.errors.boltClientId && (
                    <p className="text-sm text-red-500">
                      {step2Form.formState.errors.boltClientId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boltClientSecret">Bolt Client Secret *</Label>
                  <Input
                    id="boltClientSecret"
                    type="password"
                    {...step2Form.register("boltClientSecret")}
                    placeholder="Ihr Bolt Client Secret"
                  />
                  {step2Form.formState.errors.boltClientSecret && (
                    <p className="text-sm text-red-500">
                      {step2Form.formState.errors.boltClientSecret.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const vals = step2Form.getValues();
                      if (vals.boltClientId && vals.boltClientSecret) {
                        validateCredentials("bolt", vals.boltClientId, vals.boltClientSecret);
                      } else {
                        setBoltError("Bitte füllen Sie beide Felder aus");
                        setBoltStatus("invalid");
                      }
                    }}
                    disabled={boltStatus === "loading"}
                  >
                    {boltStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verbindung testen
                  </Button>
                  <StatusIcon status={boltStatus} />
                  {boltError && <p className="text-sm text-red-500">{boltError}</p>}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Zurück
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={boltStatus !== "valid"}
                  >
                    Weiter
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Optional Platforms */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Weitere Plattformen</CardTitle>
              <CardDescription>Optional: Verbinden Sie zusätzliche Plattformen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uberClientId">Uber Client ID</Label>
                <Input
                  id="uberClientId"
                  {...step3Form.register("uberClientId")}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uberClientSecret">Uber Client Secret</Label>
                <Input
                  id="uberClientSecret"
                  type="password"
                  {...step3Form.register("uberClientSecret")}
                  placeholder="Optional"
                />
              </div>

              {(step3Form.watch("uberClientId") || step3Form.watch("uberClientSecret")) && (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const vals = step3Form.getValues();
                      if (vals.uberClientId && vals.uberClientSecret) {
                        validateCredentials("uber", vals.uberClientId, vals.uberClientSecret);
                      } else {
                        setUberError("Bitte füllen Sie beide Felder aus");
                        setUberStatus("invalid");
                      }
                    }}
                    disabled={uberStatus === "loading"}
                  >
                    {uberStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verbindung testen
                  </Button>
                  <StatusIcon status={uberStatus} />
                  {uberError && <p className="text-sm text-red-500">{uberError}</p>}
                </div>
              )}

              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
                <strong>FreeNow:</strong> Wird per CSV-Upload unterstützt. Sie können dies später in den Einstellungen konfigurieren.
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrierung...
                    </>
                  ) : (
                    "Registrierung abschließen"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
