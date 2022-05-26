import { Express } from "express";
import category from "./category";
import record from "./record";

export default (app: Express) => {
  app.use("/categories", category);
  app.use("/records", record);
};
