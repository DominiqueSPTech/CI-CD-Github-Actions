import { useEffect, useState } from "react";
import { api } from "../api.ts";
import CategoryChart from "../components/CategoryChart.tsx";
import RecentTransactions from "../components/RecentTransactions.tsx";
import SummaryCards from "../components/SummaryCards.tsx";
import type { Theme } from "../hooks/useTheme.ts";
import { useToast } from "../toast.tsx";
import type { Summary, Transaction } from "../types.ts";

const EMPTY_SUMMARY: Summary = { income: 0, expense: 0, balance: 0, byCategory: [] };

type Props = { version: number; theme: Theme };

export default function Dashboard({ version, theme }: Props) {
  const toast = useToast();
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    Promise.all([api.getSummary(), api.listTransactions({ pageSize: 5 })])
      .then(([sum, page]) => {
        setSummary(sum);
        setRecent(page.items);
        setUnavailable(false);
      })
      .catch((err) => {
        setUnavailable(true);
        toast.error(err.message, "Não foi possível carregar o painel");
      });
  }, [version, toast]);

  return (
    <div className="dashboard">
      <SummaryCards summary={summary} />
      <div className="dash-grid">
        <CategoryChart data={summary.byCategory} theme={theme} unavailable={unavailable} />
        <RecentTransactions items={recent} unavailable={unavailable} />
      </div>
    </div>
  );
}
