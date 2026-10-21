import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TransactionForm from "../src/components/TransactionForm.tsx";
import { ToastProvider } from "../src/toast.tsx";

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined), onDone = vi.fn()) {
  render(
    <ToastProvider>
      <TransactionForm categories={["Alimentação", "Salário"]} onSubmit={onSubmit} onDone={onDone} />
    </ToastProvider>,
  );
  return { onSubmit, onDone };
}

describe("TransactionForm", () => {
  it("envia um recebimento e mostra toast de sucesso", async () => {
    const { onSubmit, onDone } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Recebimento" }));
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Freela" } });
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "150075" } });
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "Salário" } });
    fireEvent.click(screen.getByRole("button", { name: "Lançar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      type: "income",
      description: "Freela",
      amount: 1500.75,
      category: "Salário",
    });
    expect(await screen.findByText("Recebimento lançado!")).toBeInTheDocument();
    expect(onDone).toHaveBeenCalled();
  });

  it("mostra toast de erro quando a API falha", async () => {
    renderForm(vi.fn().mockRejectedValue(new Error("Escolha uma categoria válida.")));

    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: "Lançar" }));

    expect(await screen.findByText("Escolha uma categoria válida.")).toBeInTheDocument();
    expect(screen.getByText("Não foi possível salvar")).toBeInTheDocument();
  });

  it("não envia com valor zerado", async () => {
    const { onSubmit } = renderForm();

    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Lançar" }));

    expect(await screen.findByText("Informe um valor maior que zero.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
