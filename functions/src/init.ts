import { config as dotenvConfig } from "dotenv";
import { config as firebaseConfig } from "firebase-functions";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const functionsConfig = firebaseConfig();

switch (process.env.NODE_ENV) {
  case "development":
    dotenvConfig({ path: "./.env.development" });
  case "production":
    dotenvConfig({ path: "./.env.prod" });
  default:
    dotenvConfig({ path: "./.env" });
}

// google init
export const googleAuthClient = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_API_CLIENT_ID,
  clientSecret: process.env.GOOGLE_API_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_AUTH_API_REDIRECT,
});

const googleScopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export const googleAuthURL = googleAuthClient.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: googleScopes,
});

export { google };
