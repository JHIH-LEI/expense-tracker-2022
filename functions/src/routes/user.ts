import express from "express";
import { userController } from "../controller/user";
import { groupController } from "../controller/group";
const router = express.Router();

router.get("/:user_id/groups", userController.getUserGroupList);
router.get("/:user_id", userController.getUserFile);
router.patch("/:user_id", userController.modifyUserFile);
router.delete(
  "/:user_id/groups/:group_id/request",
  groupController.cancelGroupRequest
);
export default router;
