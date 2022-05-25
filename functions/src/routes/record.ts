import express from "express";
import { recordController } from "../controller/record";
const router = express.Router();

router.post("/", recordController.addRecord);
router.patch("/:id", recordController.patchRecord);
router.delete("/:id", recordController.deleteRecord);

export default router;
