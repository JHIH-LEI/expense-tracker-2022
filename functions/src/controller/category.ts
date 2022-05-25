import { Category, CategoryType, CategoryRecord, User } from "@prisma/client";
import { Request, Response } from "express";
import filter from "lodash/filter";
import isArray from "lodash/isArray";
import { prisma } from "../init";
import { RequestWithJWT } from "../types/common";
import { ErrorCode, ErrorCodeMapToStatus } from "../types/error";
import { parseError } from "../utils/parseErrorMsg";

type addCategoryFromRequest = {
  categoriesIDS: Array<number>;
  groupId: number | null;
};

export const categoryController = {
  removeCategory: async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    try {
      // TODO: where userId = req.user.user_id, groupId = groupId
      await prisma.categoryRecord.delete({
        where: { id: parseInt(id) },
      });
      return res.status(200).send("delete category success");
    } catch (err) {
      return res.status(500).json(err);
    }
  },
  addCategory: async (req: Request, res: Response) => {
    const {
      user: { user_id: userId },
    } = req as RequestWithJWT;
    const { categoriesIDS: newCategoriesIDS, groupId } =
      req.body as addCategoryFromRequest;

    const validCategories: Array<Omit<CategoryRecord, "id">> =
      newCategoriesIDS.reduce((prev: any, categoryId: number) => {
        const newCategoryRecord: Omit<CategoryRecord, "id"> = {
          userId,
          groupId,
          categoryId,
        };
        return prev.push(newCategoryRecord);
      }, []);

    await prisma.categoryRecord.createMany({
      data: validCategories,
      skipDuplicates: true,
    });

    return res.status(200).send("add category success");
  },
};
