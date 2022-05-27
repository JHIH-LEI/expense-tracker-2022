import express from "express";
import { groupController } from "../controller/group";
const router = express.Router();

router.post("/:group_id/join", groupController.joinGroup);
router.delete("/:group_id/leave", groupController.leaveGroup);
router.delete("/:group_id/invite", groupController.rejectGroupInvite);
router.post("/", groupController.createGroup);

export default router;
