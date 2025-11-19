import { Request, Response, NextFunction } from "express";
// Auth middleware

export function auth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization") || req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const apiKey = auth.slice(7).trim();
  if (!apiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.apiKey = apiKey;
  next();
}