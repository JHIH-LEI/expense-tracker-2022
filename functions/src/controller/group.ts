import { Group, GroupRequest, GroupRoster } from "@prisma/client";
import { prisma } from "../init";
import { Request, Response } from "express";
import { ACCOUNT_LEVEL, GROUP_CAPACITY, RequestWithJWT } from "../types/common";
import { ErrorCode, ErrorCodeMapToStatus } from "../types/error";
import { parseError } from "../utils/parseError";

type postGroupFromRequest = Pick<Group, "name"> & { members: Array<number> };

// TODO: add socket in group request system

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

      // TODO: send request socket

      if (!members.length) {
        return res.sendStatus(200);
      }

      const groupRequests: Array<Omit<GroupRequest, "id">> = members.reduce(
        (prev: any, memberId: number) => {
          const groupRequest: Omit<GroupRequest, "id"> = {
            groupId: newGroupId,
            inviteeId: memberId,
          };
          return prev.push(groupRequest);
        },
        []
      );

      await prisma.groupRequest.createMany({ data: groupRequests });

      return res.sendStatus(200);
    } catch (err) {
      const customErrorObject = parseError(err);
      if (!customErrorObject) {
        return res.sendStatus(500).json(err);
      }

      return res.status(customErrorObject.status).json(customErrorObject);
    }
  },
  joinGroup: async (req: Request, res: Response) => {
    try {
      const { group_id: groupId } = req.params;
      const {
        user: { user_id: userId },
      } = req as RequestWithJWT;

      const deleteRequestRecord = prisma.groupRequest.delete({
        where: {
          groupId_inviteeId: {
            groupId: parseInt(groupId),
            inviteeId: userId,
          },
        },
      });

      const createGroupRoster = prisma.groupRoster.create({
        data: {
          groupId: parseInt(groupId),
          userId,
        },
      });

      await prisma.$transaction([deleteRequestRecord, createGroupRoster]);
      return res.sendStatus(200);
    } catch (err) {
      return res.sendStatus(500).json(err);
    }
  },
  leaveGroup: async (req: Request, res: Response) => {
    try {
      const { group_id: groupId } = req.params;
      const {
        user: { user_id: authId },
      } = req as RequestWithJWT;

      await prisma.groupRoster.delete({
        where: {
          groupId_userId: {
            groupId: parseInt(groupId),
            userId: authId,
          },
        },
      });
      return res.sendStatus(200);
    } catch (err) {
      const customErrorObject = parseError(err);
      if (!customErrorObject) {
        return res.status(500).json(err);
      }
      return res.status(customErrorObject.status).json(customErrorObject);
    }
  },
};
