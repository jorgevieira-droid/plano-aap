let hasLanded = false;

/** Indica se o redirecionamento de "primeira página" já foi aplicado nesta sessão. */
export function hasLandedOnce() {
  return hasLanded;
}

/** Marca o redirecionamento de "primeira página" como aplicado. */
export function markLanded() {
  hasLanded = true;
}

/** Reinicia o redirecionamento de "primeira página" (chamado no logout). */
export function resetLandingRedirect() {
  hasLanded = false;
}
