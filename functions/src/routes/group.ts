import express from "express";
import { groupController } from "../controller/group";
import { categoryController } from "../controller/category";
const router = express.Router();

router.get("/categories", categoryController.getGroupCategories);
router.post("/:group_id/join", groupController.joinGroup);
router.delete("/:group_id/leave", groupController.leaveGroup);
router.delete("/:group_id/invite", groupController.rejectGroupInvite);
router.post("/", groupController.createGroup);

export default router;
