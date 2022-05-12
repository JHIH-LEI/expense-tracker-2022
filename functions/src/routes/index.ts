import { Express } from "express";
import login from "./login";

export default (app: Express) => {
  app.use("/login", login);
};
