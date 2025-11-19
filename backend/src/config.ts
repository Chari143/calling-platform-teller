import dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT || 3000);
export const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/calls";
export const CONCURRENCY_LIMIT = Number(process.env.CONCURRENCY_LIMIT || 3);
export const CPS_LIMIT = Number(process.env.CPS_LIMIT || 2);
export const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
export const UPLOADS_DIR = process.env.UPLOADS_DIR || "uploads";