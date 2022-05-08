// import { http } from "@google-cloud/functions-framework";
import { googleAuthURL } from "../../init";
import express, { Response, Request } from "express";
const http = express();

export default http.get(
  "/login/google",
  async (req: Request, res: Response) => {
    return res.redirect(googleAuthURL);
  }
);

http.listen(3000, () => console.log(""));
