import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

const prismaPlugin: FastifyPluginAsync = async (app) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
};

export default prismaPlugin;
