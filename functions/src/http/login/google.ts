import { http } from "@google-cloud/functions-framework";
import { googleAuthURL } from "../../init";
import { Response, Request } from "express";

export default http("/login/google", async (req: Request, res: Response) => {
  return res.redirect(googleAuthURL);
});
