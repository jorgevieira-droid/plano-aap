import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
