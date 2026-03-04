import prisma from "./prisma";

export async function getDefaultUser() {
  let user = await prisma.user.findFirst({
    include: { settings: true },
  });

  // Auto-create default user if none exists (first run / fresh deploy)
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "default@podcast.local",
        name: "Default User",
        settings: { create: {} },
      },
      include: { settings: true },
    });
  }

  return user;
}
