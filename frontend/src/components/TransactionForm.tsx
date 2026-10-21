import { useState, type FormEvent } from "react";
import { useToast } from "../toast.tsx";
import type { NewTransaction, TransactionType } from "../types.ts";
import MoneyInput from "./MoneyInput.tsx";

type Props = {
  categories: string[];
  onSubmit: (data: NewTransaction) => Promise<void>;
  onDone?: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ categories, onSubmit, onDone }: Props) {
  const toast = useToast();
  const [type, setType] = useState<TransactionType>("expense");
  const [description, setDescription] = useState("");
  const [cents, setCents] = useState(0);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (cents <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        type,
        description,
        amount: cents / 100,
        category: category || categories[0],
        date,
      });
      toast.success(type === "income" ? "Recebimento lançado!" : "Gasto lançado!");
      setDescription("");
      setCents(0);
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message, "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="toggle" role="group" aria-label="Tipo">
        <button
          type="button"
          className={`toggle-btn${type === "expense" ? " active-pink" : ""}`}
          onClick={() => setType("expense")}
        >
          Gasto
        </button>
        <button
          type="button"
          className={`toggle-btn${type === "income" ? " active-teal" : ""}`}
          onClick={() => setType("income")}
        >
          Recebimento
        </button>
      </div>

      <label>
        Descrição
        <input value={description} onChange={(e) => setDescription(e.target.value)} required autoFocus />
      </label>

      <div className="row">
        <label>
          Valor
          <MoneyInput cents={cents} onChange={setCents} />
        </label>
        <label>
          Data
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
      </div>

      <label>
        Categoria
        <select value={category || categories[0] || ""} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Lançar"}
      </button>
    </form>
  );
}
