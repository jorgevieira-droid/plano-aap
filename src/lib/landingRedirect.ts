const KEY = 'bussola:landed';

// Flag em sessionStorage: persiste entre reloads/nova aba? (sessionStorage é por aba)
// e reinicia ao fechar a aba ou no logout (clearPersistedFilters não cobre esta chave,
// então o logout a remove explicitamente).
function read(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Indica se o redirecionamento de "primeira página" já foi aplicado nesta sessão. */
export function hasLandedOnce() {
  return read();
}

/** Marca o redirecionamento de "primeira página" como aplicado. */
export function markLanded() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage indisponível — ignora */
  }
}

/** Reinicia o redirecionamento de "primeira página" (chamado no logout). */
export function resetLandingRedirect() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}
