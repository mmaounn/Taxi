import { z } from "zod";

export const registrationStep1Schema = z
  .object({
    companyName: z.string().min(1, "Firmenname ist erforderlich"),
    address: z.string().optional(),
    taxId: z.string().optional(),
    email: z.string().email("Ungültige E-Mail-Adresse"),
    password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

export const registrationStep2Schema = z.object({
  boltClientId: z.string().min(1, "Bolt Client ID ist erforderlich"),
  boltClientSecret: z.string().min(1, "Bolt Client Secret ist erforderlich"),
});

export const registrationStep3Schema = z.object({
  uberClientId: z.string().optional(),
  uberClientSecret: z.string().optional(),
});

export const registrationSchema = z
  .object({
    companyName: z.string().min(1, "Firmenname ist erforderlich"),
    address: z.string().optional(),
    taxId: z.string().optional(),
    email: z.string().email("Ungültige E-Mail-Adresse"),
    password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
    passwordConfirm: z.string(),
    boltClientId: z.string().min(1, "Bolt Client ID ist erforderlich"),
    boltClientSecret: z.string().min(1, "Bolt Client Secret ist erforderlich"),
    uberClientId: z.string().optional(),
    uberClientSecret: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwörter stimmen nicht überein",
    path: ["passwordConfirm"],
  });

export type RegistrationStep1 = z.infer<typeof registrationStep1Schema>;
export type RegistrationStep2 = z.infer<typeof registrationStep2Schema>;
export type RegistrationStep3 = z.infer<typeof registrationStep3Schema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
