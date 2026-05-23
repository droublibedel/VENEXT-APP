import express from "express";

import { registerRoutes } from "./routes.js";

const app = express();
const port = Number(process.env.COMMERCE_BFF_PORT ?? 3210);

app.use(express.json());
registerRoutes(app);

app.listen(port, () => {
  console.log(`commerce-bff listening on http://127.0.0.1:${port}`);
});
