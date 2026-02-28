import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      partnerId: string | null;
      driverId: string | null;
    };
  }

  interface User {
    role: UserRole;
    partnerId: string | null;
    driverId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    partnerId: string | null;
    driverId: string | null;
  }
}
