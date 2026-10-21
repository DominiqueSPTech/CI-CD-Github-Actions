import type { InputHTMLAttributes } from "react";
import { formatMoney } from "../format.ts";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  cents: number;
  onChange: (cents: number) => void;
};

// Máscara monetária: o usuário digita só números e o valor "anda" da direita
// para a esquerda (1 → R$ 0,01, 150 → R$ 1,50). Internamente guardamos centavos.
export default function MoneyInput({ cents, onChange, ...rest }: Props) {
  return (
    <input
      {...rest}
      inputMode="numeric"
      placeholder="R$ 0,00"
      value={cents > 0 ? formatMoney(cents / 100) : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
        onChange(Number(digits || 0));
      }}
    />
  );
}
