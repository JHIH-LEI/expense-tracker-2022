import { Request, Response } from "express";
import { prisma } from "../init";
import { RequestWithJWT } from "../types/common";

type AddCategoryFromRequest = {
  categoriesIDS: Array<number>;
  groupId: number | null;
};

type RemoveCategoryFromRequest = {
  groupId: number | null;
};

export const categoryController = {
  removeCategory: async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const {
      user: { user_id: userId },
    } = req as RequestWithJWT;
    const { groupId = null } = req.body as RemoveCategoryFromRequest;

    try {
      const condition = groupId
        ? { groupCategory: { id: parseInt(id), groupId } }
        : { ownCategory: { id: parseInt(id), userId } };

      await prisma.categoryRecord.delete({
        where: condition,
      });
      return res.status(200).send("delete category success");
    } catch (err: any) {
      return res.status(500).json(err.stack);
    }
  },
  addCategory: async (req: Request, res: Response) => {
    const {
      user: { user_id: userId },
    } = req as RequestWithJWT;
    const { categoriesIDS: newCategoriesIDS, groupId } =
      req.body as AddCategoryFromRequest;

    const validCategories = newCategoriesIDS.map((categoryId) =>
      prisma.categoryRecord.upsert({
        where: { categoryId },
        update: {},
        create: { userId, categoryId, groupId },
      })
    );

    await prisma
      .$transaction(validCategories)
      .catch((err) => res.status(500).json(err));

    return res.status(200).send("add category success");
  },
};
