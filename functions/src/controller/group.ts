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

      const createGroupRoster = prisma.groupRoster.upsert({
        where: {
          groupId_userId: {
            groupId: parseInt(groupId),
            userId,
          },
        },
        create: {
          groupId: parseInt(groupId),
          userId,
        },
        update: {},
      });

      await prisma.$transaction([deleteRequestRecord, createGroupRoster]);
      return res.sendStatus(200);
    } catch (err) {
      const customErrorObject = parseError(err);
      if (!customErrorObject) {
        return res.sendStatus(500).json(err);
      }
      return res.status(customErrorObject.status).json(err);
    }
  },
  rejectGroupInvite: async (req: Request, res: Response) => {
    try {
      const {
        user: { user_id: userId },
      } = req as RequestWithJWT;
      const { group_id: groupId } = req.body;

      // TODO: socket, notify group admin
      await prisma.groupRequest
        .delete({
          where: { groupId_inviteeId: { groupId: groupId, inviteeId: userId } },
        })
        .catch((error) => {
          throw new Error(
            JSON.stringify({
              status: ErrorCodeMapToStatus[ErrorCode.MYSQL_DATABASE_ERROR],
              code: ErrorCode.MYSQL_DATABASE_ERROR,
              error,
            })
          );
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
  cancelGroupRequest: async (req: Request, res: Response) => {
    try {
      // TODO: socket
      const { group_id, user_id } = req.params;
      const {
        user: { user_id: adminId },
      } = req as RequestWithJWT;

      const isOwnGroup = await prisma.group
        .findUnique({
          where: {
            adminId_id: {
              id: parseInt(group_id),
              adminId,
            },
          },
        })
        .catch((error) => {
          throw new Error(
            JSON.stringify({
              code: ErrorCode.MYSQL_DATABASE_ERROR,
              status: ErrorCodeMapToStatus.MYSQL_DATABASE_ERROR,
              message:
                "query group base on adminId & id have unexpected error.",
              error,
            })
          );
        });

      if (isOwnGroup === null) {
        throw new Error(
          JSON.stringify({
            status: ErrorCodeMapToStatus.FORBIDDEN,
            code: ErrorCode.FORBIDDEN,
            message:
              "only group admin can cancel group request. And group must exist.",
          })
        );
      }

      const getGroupRoster = prisma.groupRoster.findUnique({
        where: {
          groupId_userId: {
            groupId: parseInt(group_id),
            userId: parseInt(user_id),
          },
        },
      });

      const deleteGroupRequest = prisma.groupRequest.delete({
        where: {
          groupId_inviteeId: {
            groupId: parseInt(group_id),
            inviteeId: parseInt(user_id),
          },
        },
      });

      await prisma
        .$transaction([getGroupRoster, deleteGroupRequest])
        .catch((error) => {
          throw new Error(
            JSON.stringify({
              status: ErrorCodeMapToStatus[ErrorCode.MYSQL_DATABASE_ERROR],
              code: ErrorCode.MYSQL_DATABASE_ERROR,
              message: "can not reject group request because transaction error",
              error,
            })
          );
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
