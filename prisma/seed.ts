import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create the H&H Drive Company OG partner with Bolt API credentials
  const partner = await prisma.partner.upsert({
    where: { id: "hh-drive-company" },
    update: {
      boltClientId: "CGd4iuoHy2C50zXPYpifS",
      boltClientSecret: "JmfbLat_8r38noNWS0G6UZPt9iQA1dCZbqLdyuctcB0LH6OJoQZy-SAQ0_vWc5jfUod8TILwsKNz4W46XnYopA",
    },
    create: {
      id: "hh-drive-company",
      companyName: "H&H Drive Company OG",
      address: "Vienna, Austria",
      defaultCommissionModel: "PERCENTAGE",
      defaultCommissionRate: 25,
      boltClientId: "CGd4iuoHy2C50zXPYpifS",
      boltClientSecret: "JmfbLat_8r38noNWS0G6UZPt9iQA1dCZbqLdyuctcB0LH6OJoQZy-SAQ0_vWc5jfUod8TILwsKNz4W46XnYopA",
    },
  });

  console.log("Created partner:", partner.companyName);

  // Create admin user with production credentials
  const passwordHash = await bcrypt.hash("Hesamhossein2025!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "office@hh-drivecompany.com" },
    update: { passwordHash },
    create: {
      email: "office@hh-drivecompany.com",
      passwordHash,
      role: "PARTNER_ADMIN",
      partnerId: partner.id,
    },
  });

  console.log("Created admin user:", admin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
