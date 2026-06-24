import { useEffect, useState } from "react";

/**
 * Retorna uma versão "atrasada" do valor, que só é atualizada após `delay`
 * milissegundos sem alterações. Útil para evitar disparar requisições a cada
 * tecla digitada (ex.: campo de busca).
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
