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
  getGroupCategories: async (req: Request, res: Response) => {
    try {
      const { group_id } = req.params;
      const categories = await prisma.categoryRecord.findMany({
        where: {
          groupId: parseInt(group_id),
        },
        select: {
          groupId: false,
          userId: false,
          id: false,
          category: true,
        },
      });
      return res.status(200).json(categories);
    } catch (err: any) {
      return res.status(500).json(err.stack);
    }
  },
  removeCategory: async (req: Request, res: Response) => {
    const { category_id } = req.params as { category_id: string };
    const {
      user: { user_id: userId },
    } = req as RequestWithJWT;
    const { groupId = null } = req.body as RemoveCategoryFromRequest;

    try {
      const condition = groupId
        ? {
            categoryId_groupId: {
              categoryId: parseInt(category_id),
              groupId,
            },
          }
        : { categoryId_userId: { categoryId: parseInt(category_id), userId } };

      await prisma.categoryRecord.delete({
        where: condition,
      });
      return res.status(200).send("delete category success");
    } catch (err: any) {
      return res.status(500).json(err.stack);
    }
  },
  addCategory: async (req: Request, res: Response) => {
    try {
      const {
        user: { user_id: userId },
      } = req as RequestWithJWT;
      const { categoriesIDS: newCategoriesIDS, groupId } =
        req.body as AddCategoryFromRequest;

      const validCategories = newCategoriesIDS.map((categoryId) =>
        prisma.categoryRecord.upsert({
          where: groupId
            ? {
                categoryId_groupId: {
                  groupId,
                  categoryId,
                },
              }
            : { categoryId_userId: { categoryId, userId } },
          update: {},
          create: { userId: groupId ? null : userId, categoryId, groupId },
        })
      );

      await prisma.$transaction(validCategories);

      return res.status(200).send("add category success");
    } catch (err: any) {
      return res.status(500).json(err.stack);
    }
  },
};
