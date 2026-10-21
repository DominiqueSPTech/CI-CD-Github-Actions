import { useCallback, useEffect, useState } from "react";
import { api } from "./api.ts";
import Modal from "./components/Modal.tsx";
import Sidebar from "./components/Sidebar.tsx";
import TransactionForm from "./components/TransactionForm.tsx";
import { useHashRoute } from "./hooks/useHashRoute.ts";
import { useTheme } from "./hooks/useTheme.ts";
import Dashboard from "./pages/Dashboard.tsx";
import Transactions from "./pages/Transactions.tsx";
import { useToast } from "./toast.tsx";
import type { NewTransaction } from "./types.ts";

export default function App() {
  const path = useHashRoute();
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const [categories, setCategories] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  // Incrementado a cada alteração para as páginas recarregarem os dados.
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch((err) => toast.error(err.message, "Não foi possível carregar as categorias"));
  }, [toast]);

  async function handleCreate(data: NewTransaction) {
    await api.createTransaction(data);
    bump();
  }

  const isList = path.startsWith("/lancamentos");

  return (
    <div className="layout">
      <Sidebar path={path} />

      <main className="main">
        <header className="topbar">
          <div className="topbar-heading">
            <h1>{isList ? "Lançamentos" : "Visão geral"}</h1>
            <span className="tag">CONTROLE DE GASTOS v1.0</span>
          </div>
          <div className="topbar-actions">
            <button
              className="btn-icon"
              onClick={toggle}
              aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              + Novo lançamento
            </button>
          </div>
        </header>

        <section className="content page-enter" key={isList ? "list" : "home"}>
          {isList ? (
            <Transactions version={version} categories={categories} onChanged={bump} />
          ) : (
            <Dashboard version={version} theme={theme} />
          )}
        </section>
      </main>

      <Modal open={modalOpen} title="Novo lançamento" onClose={() => setModalOpen(false)}>
        <TransactionForm categories={categories} onSubmit={handleCreate} onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
