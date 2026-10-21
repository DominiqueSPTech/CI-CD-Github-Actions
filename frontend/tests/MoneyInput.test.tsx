import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import MoneyInput from "../src/components/MoneyInput.tsx";

function Harness() {
  const [cents, setCents] = useState(0);
  return <MoneyInput aria-label="valor" cents={cents} onChange={setCents} />;
}

describe("MoneyInput", () => {
  it("formata os dígitos digitados como moeda brasileira", () => {
    render(<Harness />);
    const input = screen.getByLabelText("valor") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "5" } });
    expect(input.value).toMatch(/R\$\s0,05/);

    fireEvent.change(input, { target: { value: "123456" } });
    expect(input.value).toMatch(/R\$\s1\.234,56/);

    fireEvent.change(input, { target: { value: "R$ abc" } });
    expect(input.value).toBe("");
  });
});
