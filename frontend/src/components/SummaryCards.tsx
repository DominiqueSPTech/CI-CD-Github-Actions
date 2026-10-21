import { formatMoney } from "../format.ts";
import { useCountUp } from "../hooks/useCountUp.ts";
import type { Summary } from "../types.ts";

type CardProps = { label: string; value: number; icon: string; className: string; delay: number };

function StatCard({ label, value, icon, className, delay }: CardProps) {
  const animated = useCountUp(value);
  return (
    <article className={`box stat lift fade-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <span className="stat-icon">{icon}</span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value" data-testid={`stat-${label}`}>
          {formatMoney(animated)}
        </p>
      </div>
    </article>
  );
}

export default function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="cards">
      <StatCard label="Saldo" value={summary.balance} icon="$" className="card-yellow" delay={0} />
      <StatCard label="Receitas" value={summary.income} icon="↗" className="card-teal" delay={60} />
      <StatCard label="Gastos" value={summary.expense} icon="↘" className="card-pink" delay={120} />
    </div>
  );
}
