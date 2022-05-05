import { createPool } from "mysql2";
import dotenv from "dotenv";
import { google } from "googleapis";

switch (process.env.NODE_ENV) {
  case "development":
    dotenv.config({ path: "./.env.dev" });
  case "production":
    dotenv.config({ path: "./.env.prod" });
  default:
    dotenv.config({ path: "./.env" });
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
// data base init

const initMySql = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  socketPath: `/cloudsql.${process.env.INSTANCE_CONNECTION_NAME}`,
};

process.env.NODE_ENV === "production" &&
  (initMySql.socketPath = `/cloudsql.${process.env.INSTANCE_CONNECTION_NAME}`);

export const pool = createPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});
