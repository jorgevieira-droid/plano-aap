import { addDays, format, parseISO, startOfWeek, endOfMonth } from 'date-fns';

/** Mês (yyyy-MM) ao qual a semana (seg–sex) da data pertence: o mês da quarta-feira (maioria dos dias úteis). */
export function mesDaSemana(data: string): string {
  const seg = startOfWeek(parseISO(data), { weekStartsOn: 1 });
  return format(addDays(seg, 2), 'yyyy-MM');
}

/** Período (segunda da 1ª semana → sexta da última semana) de um mês, pela regra de mesDaSemana. */
export function periodoDoMes(mes: string): { ini: string; fim: string } {
  const primeiro = parseISO(`${mes}-01`);
  let seg = startOfWeek(primeiro, { weekStartsOn: 1 });
  if (format(addDays(seg, 2), 'yyyy-MM') !== mes) seg = addDays(seg, 7);
  let segFim = startOfWeek(endOfMonth(primeiro), { weekStartsOn: 1 });
  if (format(addDays(segFim, 2), 'yyyy-MM') !== mes) segFim = addDays(segFim, -7);
  return { ini: format(seg, 'yyyy-MM-dd'), fim: format(addDays(segFim, 4), 'yyyy-MM-dd') };
}
