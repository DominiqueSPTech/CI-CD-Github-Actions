import { useEffect, useState } from "react";

const current = () => window.location.hash.slice(1) || "/";

// Roteamento mínimo por hash (#/ e #/lancamentos), sem biblioteca.
export function useHashRoute() {
  const [path, setPath] = useState(current);

  useEffect(() => {
    const onChange = () => setPath(current());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return path;
}
