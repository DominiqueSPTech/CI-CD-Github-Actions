import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.ts";
import { openDatabase } from "../src/db.ts";

const expense = { type: "expense", description: "Mercado", amount: 150.5, category: "Alimentação", date: "2026-10-01" };
const income = { type: "income", description: "Salário", amount: 5000, category: "Salário", date: "2026-10-05" };

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp(openDatabase(":memory:"));
});

describe("API /api", () => {
  it("GET /api/health responde ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("cria e lista transações", async () => {
    const created = await request(app).post("/api/transactions").send(expense);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject(expense);

    const list = await request(app).get("/api/transactions");
    expect(list.body.items).toHaveLength(1);
    expect(list.body.total).toBe(1);
  });

  it("rejeita transação inválida com 400", async () => {
    const res = await request(app).post("/api/transactions").send({ ...expense, amount: -10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("responde 400 em JSON quando o corpo é inválido", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .set("Content-Type", "application/json")
      .send("{quebrado");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JSON/);
  });

  it("rejeita categoria desconhecida", async () => {
    const res = await request(app).post("/api/transactions").send({ ...expense, category: "Foo" });
    expect(res.status).toBe(400);
  });

  it("calcula o resumo com saldo e gastos por categoria", async () => {
    await request(app).post("/api/transactions").send(expense);
    await request(app).post("/api/transactions").send({ ...expense, amount: 49.5 });
    await request(app).post("/api/transactions").send({ ...expense, category: "Lazer", amount: 300 });
    await request(app).post("/api/transactions").send(income);

    const res = await request(app).get("/api/summary");
    expect(res.body.income).toBe(5000);
    expect(res.body.expense).toBe(500);
    expect(res.body.balance).toBe(4500);
    expect(res.body.byCategory).toEqual([
      { category: "Lazer", total: 300 },
      { category: "Alimentação", total: 200 },
    ]);
  });

  it("exclui transação e retorna 404 para id inexistente", async () => {
    const created = await request(app).post("/api/transactions").send(expense);
    expect((await request(app).delete(`/api/transactions/${created.body.id}`)).status).toBe(204);
    expect((await request(app).delete(`/api/transactions/${created.body.id}`)).status).toBe(404);
  });

  it("pagina a listagem", async () => {
    for (let i = 1; i <= 12; i++) {
      await request(app).post("/api/transactions").send({ ...expense, description: `Gasto ${i}` });
    }
    const res = await request(app).get("/api/transactions?page=2&pageSize=5");
    expect(res.body).toMatchObject({ total: 12, page: 2, pageSize: 5, totalPages: 3 });
    expect(res.body.items).toHaveLength(5);
    expect(res.body.items[0].description).toBe("Gasto 7");
  });

  it("filtra por tipo, categoria, período e descrição", async () => {
    await request(app).post("/api/transactions").send(expense);
    await request(app).post("/api/transactions").send({ ...expense, description: "Cinema", category: "Lazer", date: "2026-09-10" });
    await request(app).post("/api/transactions").send(income);

    const byType = await request(app).get("/api/transactions?type=income");
    expect(byType.body.items.map((t: { description: string }) => t.description)).toEqual(["Salário"]);

    const byCategory = await request(app).get("/api/transactions?category=Lazer");
    expect(byCategory.body.total).toBe(1);

    const byPeriod = await request(app).get("/api/transactions?from=2026-10-01&to=2026-10-31");
    expect(byPeriod.body.total).toBe(2);

    const bySearch = await request(app).get("/api/transactions?q=merc");
    expect(bySearch.body.items[0].description).toBe("Mercado");
  });

  it("retorna 404 JSON para rota desconhecida em /api", async () => {
    const res = await request(app).get("/api/nao-existe");
    expect(res.status).toBe(404);
  });
});
