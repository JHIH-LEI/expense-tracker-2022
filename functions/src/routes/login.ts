import express, { Response, Request } from "express";
import { googleAuthClient, google, prisma, googleAuthURL } from "../init";
import { ErrorCode, ErrorCodeMapToStatus } from "../types/error";
import { hashSync } from "bcrypt";
import { DEFAULT_CATEGORY } from "../types/common";
import { CategoryRecord } from "@prisma/client";
import jwt from "jsonwebtoken";
import ms from "ms";
const router = express.Router();

router.get("/google", async (req: Request, res: Response) => {
  return res.redirect(googleAuthURL);
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  const { tokens } = await googleAuthClient.getToken(code);

  googleAuthClient.credentials = tokens;
  const oauth2 = google.oauth2("v2");

  const {
    data: { email, id: google_open_id },
  } = await oauth2.userinfo.v2.me
    .get({ auth: googleAuthClient })
    .catch((error) => {
      throw new Error(
        JSON.stringify({
          code: ErrorCode.GOOGLE_OAUTH_ERROR,
          status: ErrorCodeMapToStatus[ErrorCode.GOOGLE_OAUTH_ERROR],
          message: "send code to exchange token have unexpected error",
          error,
        })
      );
    });

  if (!email) {
    throw new Error(
      JSON.stringify({
        code: ErrorCode.INVALID_EMAIL,
        status: ErrorCodeMapToStatus[ErrorCode.INVALID_EMAIL],
        message: "send code to exchange token have unexpected error",
      })
    );
  }

  const userData = await prisma.user.findUnique({ where: { email } });

  if (userData !== null) {
    const randomPassword = (Math.random() + 1).toString(36).substring(2);

    const password = hashSync(randomPassword, 10);

    const userDefaultCategories = Object.values(DEFAULT_CATEGORY).map((id) => ({
      categoryId: id,
      // TODO: 換成真的userId
      userId: 1,
    })) as Array<Pick<CategoryRecord, "categoryId" | "userId">>;

    await prisma.user.create({
      data: {
        username: google_open_id || email.slice(0, 5),
        email,
        password,
        icon: null,
        refreshToken: tokens.refresh_token || null,
        userCategories: {
          createMany: {
            data: userDefaultCategories,
          },
        },
      },
      include: {
        userCategories: true,
      },
    });
  }

  const token = jwt.sign(
    {
      user_id: userData?.id,
    },
    process.env.JWT_SECRET!,
    { expiresIn: ms("7 days") }
  );

  // TODO: 存access_token

  res.status(200).json({
    token,
  });
});

export default router;
