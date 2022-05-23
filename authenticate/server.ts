import express, { Request, Response } from "express";
import { googleAuthClient, google, prisma, googleAuthURL, redis } from "./init";
import { hashSync } from "bcrypt";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import "dotenv";
import { Category, CategoryRecord } from "@prisma/client";
import ms from "ms";

const app = express();

enum DEFAULT_CATEGORY {
  "薪水" = 1,
  "伙食" = 2,
  "娛樂" = 3,
  "自我學習" = 4,
  "交通" = 5,
}

// login
app.get("/login/google", async (req: Request, res: Response) => {
  return res.redirect(googleAuthURL);
});

// response token
app.get("/login/google/callback", async (req: Request, res: Response) => {
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
          code: "GOOGLE_OAUTH_ERROR",
          status: 500,
          message: "send code to exchange token have unexpected error",
          error,
        })
      );
    });

  if (!email) {
    throw new Error(
      JSON.stringify({
        code: "INVALID_EMAIL",
        status: 400,
        message: "send code to exchange token have unexpected error",
      })
    );
  }

  let userData = await prisma.user.findUnique({ where: { email } });

  if (userData === null) {
    const randomPassword = (Math.random() + 1).toString(36).substring(2);

    const password = hashSync(randomPassword, 10);

    const userDefaultCategories = Object.values(DEFAULT_CATEGORY)
      .map((id) => ({
        categoryId: id,
      }))
      .filter(({ categoryId }) => typeof categoryId === "number") as Array<
      Pick<CategoryRecord, "categoryId">
    >;

    userData = await prisma.user.create({
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

  let accessToken = "";
  let refreshToken = "";

  if (userData?.id) {
    accessToken = createAccessToken(userData.id);
    refreshToken = await createRefreshToken({
      userId: userData.id,
      ip: req.ip,
    });
  }

  return res.status(200).json({
    accessToken,
    refreshToken,
  });
});

app.post("/token", async (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  const refreshToken = authHeader && authHeader.split(" ")[1];

  if (!refreshToken) {
    return res
      .status(400)
      .json("must provide refresh token in authorization header");
  }

  let accessToken = "";

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_TOKEN_SECRET!,
    async (err, user) => {
      if (err) {
        console.log(err);

        let message = "";
        if (err instanceof TokenExpiredError) {
          message = "refresh token has expired";
        }

        res.status(403).end(message);
      }

      // TODO: 查看是否來自同一個ip地址、設備、瀏覽器
      // TODO: 提醒使用者有未知的人嘗試登入他的帳號, 使用者可以選擇登出所有裝置（刪除refresh token）

      if (typeof user !== "string" && user?.user_id) {
        const isExistRefreshToken = await redis.hkeys(
          `${user.user_id}:${refreshToken}`
        );

        isExistRefreshToken.length &&
          (accessToken = createAccessToken(user.user_id));
      }

      if (accessToken) {
        return res.status(200).json({ accessToken });
      } else {
        return res.sendStatus(403);
      }
    }
  );
});

app.delete("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers["authorization"];
    const refreshToken = authHeader && authHeader.split(" ")[1];

    refreshToken &&
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_TOKEN_SECRET!,
        async (err, user) => {
          if (err) return res.sendStatus(403);
          const key =
            typeof user !== "string" &&
            user?.user_id &&
            `${user.user_id}:${refreshToken}`;

          const ip = await redis.hget(key, "ip");

          // TODO: compare ip

          await redis.del(key);
        }
      );
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
  }
});

const port = process.env.PORT || 4111;

app.listen(port, () =>
  console.log(`authenticate server is running on port ${port}`)
);

function createAccessToken(userId: number) {
  return jwt.sign(
    {
      user_id: userId,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET!,
    { expiresIn: ms("15m") }
  );
}
async function createRefreshToken({
  userId,
  ip,
}: {
  userId: number;
  ip: string;
}) {
  const refreshToken = jwt.sign(
    {
      user_id: userId,
    },
    process.env.JWT_REFRESH_TOKEN_SECRET!,
    { expiresIn: ms("14 days") }
  );
  await redis.hset(`${userId}:${refreshToken}`, { ip });
  await redis.expire(`${userId}:${refreshToken}`, ms("14 days") / 1000);
  return refreshToken;
}
