import express from "express";
import useRoutes from "./routes/index";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());

useRoutes(app);

app.listen(process.env.PORT || 3000, () =>
  console.log(`app listening on port: ${process.env.PORT || 3000}. 執行中!!!`)
);
