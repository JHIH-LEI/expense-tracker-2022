import { createPool } from "mysql2";
import dotenv from "dotenv";
switch (process.env.NODE_ENV) {
  case "development":
    dotenv.config({ path: "./.env.dev" });
  case "production":
    dotenv.config({ path: "./.env.prod" });
  default:
    dotenv.config({ path: "./.env" });
}

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
