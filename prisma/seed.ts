import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    console.log("Default user already exists:", existingUser.id);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: "admin@podcast-automation.local",
      name: "Admin",
      settings: {
        create: {},
      },
    },
  });

  console.log("Created default user:", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
