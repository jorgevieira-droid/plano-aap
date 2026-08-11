import { useCallback, useEffect, useState } from 'react';

/**
 * useState sincronizado com sessionStorage.
 * Mantém filtros/seleções ao navegar entre páginas (limpa ao fechar o navegador).
 *
 * @param key    chave única (ex.: "programacao:filtroPrograma")
 * @param initial valor padrão
 * @param validate opcional: valida o valor restaurado; se retornar false, usa o padrão
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  validate?: (value: T) => boolean,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `filters:${key}`;

  const [state, setState] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw == null) return initial;
      const parsed = JSON.parse(raw) as T;
      if (validate && !validate(parsed)) return initial;
      return parsed;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* storage indisponível — ignora */
    }
  }, [storageKey, state]);

  return [state, setState];
}

/** Limpa todos os filtros memorizados (usar no logout). */
export function clearPersistedFilters() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('filters:')) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignora */
  }
}

export default usePersistedState;
