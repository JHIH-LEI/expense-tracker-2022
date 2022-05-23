import jwt from "jsonwebtoken";
import { Request, NextFunction, Response } from "express";
import "dotenv";

export default async function authenticator(
  req: Request & { user: jwt.JwtPayload },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    user && typeof user !== "string" && (req.user = user);
    next();
  });
}
