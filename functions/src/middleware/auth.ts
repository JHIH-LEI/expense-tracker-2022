import jwt from "jsonwebtoken";
import { Request, NextFunction, Response } from "express";
import "dotenv";
import { RequestWithJWT } from "../types/common";

export default async function authenticator(
  req: Request & { user: jwt.JwtPayload },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const { user_id } = req.params;
  const {
    user: { user_id: authId },
  } = req as RequestWithJWT;

  if (!token) {
    return res.sendStatus(401);
  }

  if (user_id && parseInt(user_id) !== authId) {
    return res
      .status(403)
      .end(`user id:${user_id} not equal to login in user id :${authId}.`);
  }

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    user && typeof user !== "string" && (req.user = user);
    next();
  });
}
