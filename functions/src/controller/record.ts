import { Record } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../init";
import { RequestWithJWT } from "../types/common";
import { ErrorCode, ErrorCodeMapToStatus } from "../types/error";
import { parseError } from "../utils/parseErrorMsg";

type postRecordFromRequest = Omit<Record, "id">;
type patchRecordFromRequest = Omit<Record, "id">;
// 分為使用者/團體記帳
export const recordController = {
  addRecord: async (req: Request, res: Response) => {
    try {
      const {
        user: { user_id: authId },
      } = req as RequestWithJWT;

      validateNewRecord(req.body, authId);

      const { name, merchant, userId, groupId, categoryId, amount } =
        req.body as postRecordFromRequest;

      await prisma.record.create({
        data: { name, merchant, userId, groupId, categoryId, amount },
      });
      return res.sendStatus(200);
    } catch (err) {
      const customObject = parseError(err);

      if (customObject) {
        return res.status(customObject.status).json(customObject);
      }

      return res.status(500).json(err);
    }
  },
  deleteRecord: async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    // TODO: only can delete own record
    await prisma.record
      .delete({ where: { id: parseInt(id) } })
      .catch((err) => res.status(500).json(err));
    return res.sendStatus(200);
  },
  patchRecord: async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      const {
        user: { user_id: authId },
      } = req as RequestWithJWT;

      validateNewRecord(req.body, authId);
      const { name, merchant, userId, groupId, categoryId, amount } =
        req.body as patchRecordFromRequest;
      // TODO: only can patch own record, same group data
      await prisma.record.update({
        where: { id: parseInt(id) },
        data: { name, merchant, categoryId, amount },
      });
    } catch (err) {
      const customErrorObject = parseError(err);
      if (!customErrorObject) {
        return res.status(500).json(err);
      }

      return res.status(customErrorObject.status).json(customErrorObject);
    }
  },
};

function validateNewRecord(data: postRecordFromRequest, authId: number) {
  const { merchant, name, groupId, amount, categoryId, userId } = data;

  if (userId !== authId) {
    throw new Error(
      JSON.stringify({
        code: ErrorCode.FORBIDDEN,
        status: ErrorCodeMapToStatus.FORBIDDEN,
        message: "Can not add record to other user account.",
        data: { authId, userId },
      })
    );
  }

  if (!name || amount <= 0 || !categoryId || (!userId && !groupId)) {
    throw new Error(
      JSON.stringify({
        code: ErrorCode.FORBIDDEN,
        status: ErrorCodeMapToStatus.FORBIDDEN,
        message:
          "amount need to > 0, name, categoryId, amount are all required and contain userId or groupId.",
        data,
      })
    );
  }
}
