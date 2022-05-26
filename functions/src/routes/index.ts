import { Express } from "express";
import category from "./category";
import record from "./record";
import group from "./group";

export default (app: Express) => {
  app.use("/categories", category);
  app.use("/records", record);
  app.use("/groups", group);
};
