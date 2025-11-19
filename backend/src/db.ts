import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "./config.js";

export const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

export async function db() {
  return prisma.$connect();
}

export async function disconnect() {
  await prisma.$disconnect();
}