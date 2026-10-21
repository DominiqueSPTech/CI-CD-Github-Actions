import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SummaryCards from "../src/components/SummaryCards.tsx";

describe("SummaryCards", () => {
  it("mostra saldo, receitas e gastos formatados em reais", () => {
    render(<SummaryCards summary={{ income: 5000, expense: 1250.5, balance: 3749.5, byCategory: [] }} />);

    expect(screen.getByTestId("stat-Saldo")).toHaveTextContent(/R\$\s3\.749,50/);
    expect(screen.getByTestId("stat-Receitas")).toHaveTextContent(/R\$\s5\.000,00/);
    expect(screen.getByTestId("stat-Gastos")).toHaveTextContent(/R\$\s1\.250,50/);
  });
});
