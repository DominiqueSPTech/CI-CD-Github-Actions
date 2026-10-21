import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";

export const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Salário",
  "Outros",
];

const TYPES = ["income", "expense"];

type TransactionInput = {
  type: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

function validate(body: Partial<TransactionInput>): string | null {
  if (!body.type || !TYPES.includes(body.type)) return "Escolha se é um gasto ou um recebimento.";
  if (!body.description || typeof body.description !== "string" || !body.description.trim())
    return "Informe uma descrição.";
  if (typeof body.amount !== "number" || !(body.amount > 0)) return "Informe um valor maior que zero.";
  if (!body.category || !CATEGORIES.includes(body.category)) return "Escolha uma categoria válida.";
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return "Informe uma data válida.";
  return null;
}

export function transactionsRouter(db: DatabaseSync): Router {
  const router = Router();

  router.get("/categories", (_req, res) => {
    res.json(CATEGORIES);
  });

  // Filtros opcionais: type, category, from, to (YYYY-MM-DD) e q (busca na descrição).
  // Paginação: page (1..n) e pageSize (1..100).
  router.get("/transactions", (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const page = Math.max(1, Math.floor(Number(query.page)) || 1);
    const pageSize = Math.min(100, Math.max(1, Math.floor(Number(query.pageSize)) || 10));

    const where: string[] = [];
    const params: (string | number)[] = [];
    if (query.type) {
      where.push("type = ?");
      params.push(query.type);
    }
    if (query.category) {
      where.push("category = ?");
      params.push(query.category);
    }
    if (query.from) {
      where.push("date >= ?");
      params.push(query.from);
    }
    if (query.to) {
      where.push("date <= ?");
      params.push(query.to);
    }
    if (query.q) {
      where.push("description LIKE ?");
      params.push(`%${query.q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM transactions ${whereSql}`).get(...params) as {
      total: number;
    };
    const items = db
      .prepare(`SELECT * FROM transactions ${whereSql} ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, (page - 1) * pageSize);

    res.json({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  });

  router.post("/transactions", (req, res) => {
    const body = (req.body ?? {}) as Partial<TransactionInput>;
    const error = validate(body);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const result = db
      .prepare("INSERT INTO transactions (type, description, amount, category, date) VALUES (?, ?, ?, ?, ?)")
      .run(body.type!, body.description!.trim(), body.amount!, body.category!, body.date!);
    const created = db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(created);
  });

  router.delete("/transactions/:id", (req, res) => {
    const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(Number(req.params.id));
    if (result.changes === 0) {
      res.status(404).json({ error: "Esse lançamento não existe mais." });
      return;
    }
    res.status(204).end();
  });

  router.get("/summary", (_req, res) => {
    const totals = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS income,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
         FROM transactions`,
      )
      .get() as { income: number; expense: number };

    const byCategory = db
      .prepare(
        `SELECT category, SUM(amount) AS total
         FROM transactions
         WHERE type = 'expense'
         GROUP BY category
         ORDER BY total DESC`,
      )
      .all();

    res.json({
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
      byCategory,
    });
  });

  return router;
}
