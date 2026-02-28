import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create the H&H Drive Company OG partner
  const partner = await prisma.partner.upsert({
    where: { id: "hh-drive-company" },
    update: {},
    create: {
      id: "hh-drive-company",
      companyName: "H&H Drive Company OG",
      address: "Vienna, Austria",
      defaultCommissionModel: "PERCENTAGE",
      defaultCommissionRate: 25,
    },
  });

  console.log("Created partner:", partner.companyName);

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@hhdrive.at" },
    update: {},
    create: {
      email: "admin@hhdrive.at",
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
