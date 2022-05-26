import { Group, GroupRoster } from "@prisma/client";
import { prisma } from "../init";
import { Request, Response } from "express";
import { ACCOUNT_LEVEL, GROUP_CAPACITY, RequestWithJWT } from "../types/common";
import { ErrorCode, ErrorCodeMapToStatus } from "../types/error";
import { parseError } from "../utils/parseError";

type postGroupFromRequest = Pick<Group, "name"> & { members: Array<number> };

export const groupController = {
  createGroup: async (req: Request, res: Response) => {
    const {
      user: { user_id: userId },
    } = req as RequestWithJWT;
    const { name, members = [] } = req.body as postGroupFromRequest;
    try {
      if (!name) {
        throw new Error(
          JSON.stringify({
            code: ErrorCode.MISS_REQUIRED_FELIDS,
            status: ErrorCodeMapToStatus.MISS_REQUIRED_FELIDS,
            message: "name is required.",
          })
        );
      }

      const ownGroupCount = await prisma.group.count({
        where: {
          adminId: userId,
        },
      });

      if (ownGroupCount >= 3) {
        throw new Error(
          JSON.stringify({
            code: ErrorCode.CONFLICT,
            status: ErrorCodeMapToStatus.CONFLICT,
            message: "user can not create more then 3 group.",
          })
        );
      }

      const { id: newGroupId } = await prisma.group.create({
        data: {
          name,
          adminId: userId,
          capacity: GROUP_CAPACITY[ACCOUNT_LEVEL.FREE],
          memberCount: members.length + 1,
        },
      });

      const groupRosters: Array<Omit<GroupRoster, "id">> = members.reduce(
        (prev: any, memberId: number) => {
          const groupRoster: Omit<GroupRoster, "id"> = {
            groupId: newGroupId,
            userId: memberId,
          };
          return prev.push(groupRoster);
        },
        []
      );

      await prisma.groupRoster.createMany({ data: groupRosters });

      return res.sendStatus(200);
    } catch (err) {
      const customErrorObject = parseError(err);
      if (!customErrorObject) {
        return res.sendStatus(500).json(err);
      }

      return res.status(customErrorObject.status).json(customErrorObject);
    }
  },
};
