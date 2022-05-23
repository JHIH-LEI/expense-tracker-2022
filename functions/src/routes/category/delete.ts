import express, { Response, Request } from "express";
import { prisma } from "../../init";
const router = express.Router();

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    // TODO: where userId = req.user.user_id
    await prisma.categoryRecord.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).send("delete category success");
  } catch (err) {
    return res.status(500).json(err);
  }
});

export { router };
