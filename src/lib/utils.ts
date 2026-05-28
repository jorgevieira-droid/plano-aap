import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Valida se uma string de data (YYYY-MM-DD) é uma data real e dentro de
 * uma faixa de anos razoável (2000 a 2100). Retorna false para datas
 * vazias, malformadas ou com ano fora da faixa.
 */
export function isValidDateInRange(value: string | null | undefined): boolean {
  if (!value) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  if (year < 2000 || year > 2100) return false;
  const parsed = new Date(value);
  return !isNaN(parsed.getTime());
}

export function calcularHorasFormacao(inicio: string, fim: string): number {
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  return (hf * 60 + mf - (hi * 60 + mi)) / 60;
}

export function professorAtivoNaFormacao(
  professorCreatedAt: string,
  professorDataDesativacao: string | null,
  formacaoData: string
): boolean {
  const dataFormacao = formacaoData.substring(0, 10);
  const createdAt = professorCreatedAt.substring(0, 10);
  if (dataFormacao < createdAt) return false;
  if (professorDataDesativacao) {
    const desativacao = professorDataDesativacao.substring(0, 10);
    if (dataFormacao > desativacao) return false;
  }
  return true;
}
