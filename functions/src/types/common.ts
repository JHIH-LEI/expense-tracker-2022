import { Request } from "express";
export enum DEFAULT_CATEGORY {
  "薪水" = 1,
  "伙食",
  "娛樂",
  "自我學習",
  "交通",
}

export type RequestWithJWT = Request & Record<"user", { user_id: number }>;
