import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "../format.ts";
import type { Theme } from "../hooks/useTheme.ts";
import type { Summary } from "../types.ts";

const COLORS = ["#ff8a80", "#ffe066", "#4fd1c5", "#b794f4", "#90cdf4", "#f6ad55", "#9ae6b4", "#fbb6ce"];

type Props = { data: Summary["byCategory"]; theme: Theme; unavailable?: boolean };

export default function CategoryChart({ data, theme, unavailable }: Props) {
  const line = theme === "dark" ? "#f5f1e6" : "#111111";
  const surface = theme === "dark" ? "#1f1f24" : "#ffffff";
  const tick = { fontFamily: "Space Mono", fontSize: 11, fill: line };

  return (
    <section className="box panel fade-up" style={{ animationDelay: "160ms" }}>
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Gastos por categoria</h3>
          <p className="panel-subtitle">Maiores gastos primeiro</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="empty">
          {unavailable ? "Dados indisponíveis: sem resposta do servidor." : "Nenhum gasto lançado ainda."}
        </p>
      ) : (
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 0 }}>
              <CartesianGrid stroke={line} strokeDasharray="3 6" horizontal={false} />
              <XAxis
                type="number"
                stroke={line}
                tick={tick}
                tickFormatter={(v: number) => `R$${v}`}
              />
              <YAxis type="category" dataKey="category" stroke={line} tick={tick} width={96} interval={0} />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={{
                  background: surface,
                  color: line,
                  border: `2px solid ${line}`,
                  borderRadius: 0,
                  fontFamily: "Space Mono",
                }}
                labelStyle={{ color: line, fontWeight: 700 }}
                itemStyle={{ color: line }}
                cursor={{ fill: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
              />
              <Bar dataKey="total" name="Total" stroke={line} strokeWidth={2} maxBarSize={34} animationDuration={700}>
                {data.map((entry, i) => (
                  <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
