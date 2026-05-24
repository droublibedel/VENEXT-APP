import express from "express";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "./openapi.js";
import { registerRoutes } from "./routes.js";

const app = express();
const port = Number(process.env.COMMERCE_BFF_PORT ?? 3210);

app.use(express.json());
app.get("/api/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
registerRoutes(app);

app.listen(port, () => {
  console.log(`commerce-bff listening on http://127.0.0.1:${port}`);
});
