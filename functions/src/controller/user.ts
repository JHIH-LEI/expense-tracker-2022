import { Request, Response } from "express";
import { RequestWithJWT } from "../types/common";
import { prisma } from "../init";
import { User } from "@prisma/client";

type ModifyUserFileRequest = Omit<User, "id" | "password">;

export const userController = {
  getUserFile: async (req: Request, res: Response) => {
    try {
      const {
        user: { user_id: userId },
      } = req as RequestWithJWT;

      const userFile = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, icon: true, username: true },
      });

      return res.status(200).json(userFile);
    } catch (err) {
      return res.status(500).json(err);
    }
  },
  getUserGroupList: async (req: Request, res: Response) => {
    try {
      const {
        user: { user_id: userId },
      } = req as RequestWithJWT;
      const userGroups = await prisma.groupRoster.findMany({
        where: { userId },
        select: {
          userId: false,
          groupId: false,
          id: false,
          group: {
            select: { name: true, id: true },
          },
        },
      });
      return res.status(200).json(userGroups);
    } catch (err) {
      return res.status(500).json(err);
    }
  },
  modifyUserFile: async (req: Request, res: Response) => {
    try {
      const {
        user: { user_id: userId },
      } = req as RequestWithJWT;

      const { username, icon, email, refreshToken } =
        req.body as ModifyUserFileRequest;

      await prisma.user.update({
        where: { id: userId },
        data: { username, icon, refreshToken, email },
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  },
};
