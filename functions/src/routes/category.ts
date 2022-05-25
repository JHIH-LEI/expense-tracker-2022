import { categoryController } from "../controller/category";

import express from "express";
const router = express.Router();

router.post("/", categoryController.addCategory);
router.delete("/:id", categoryController.removeCategory);

export default router;
