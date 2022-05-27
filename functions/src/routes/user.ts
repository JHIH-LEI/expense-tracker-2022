import express from "express";
import { userController } from "../controller/user";
const router = express.Router();

router.get("/:user_id/groups", userController.getUserGroupList);
router.get("/:user_id", userController.getUserFile);
router.patch("/:user_id", userController.modifyUserFile);
export default router;
