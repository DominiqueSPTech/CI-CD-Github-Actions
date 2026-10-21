import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import type { DatabaseSync } from "node:sqlite";
import { transactionsRouter } from "./transactions.ts";

export function createApp(db: DatabaseSync, corsOrigin = "*") {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  const api = express.Router();
  api.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  api.use(transactionsRouter(db));

  app.use("/api", api);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Rota não encontrada na API." });
  });

  // Garante que qualquer erro volte como JSON (o padrão do Express é HTML).
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: "O corpo da requisição não é um JSON válido." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Erro interno no servidor." });
  };
  app.use(errorHandler);

  return app;
}
