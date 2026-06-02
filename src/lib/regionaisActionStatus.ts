export type RegionaisBucket = 'realizada' | 'prevista' | 'atrasada' | 'pendente' | 'cancelada';

export const PENDENTE_THRESHOLD_DAYS = 7; // > 7 dias de atraso => pendente

export interface RegionaisActionLike {
  status: string;
  data: string;
  reagendada_para?: string | null;
}

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export function getEffectiveDate(r: RegionaisActionLike): Date {
  const raw = r.status === 'reagendada' && r.reagendada_para ? r.reagendada_para : r.data;
  return new Date(raw);
}

export function getDiasAtraso(r: RegionaisActionLike, today: Date = new Date()): number {
  const eff = startOfDay(getEffectiveDate(r));
  const t = startOfDay(today);
  return Math.floor((t.getTime() - eff.getTime()) / (1000 * 60 * 60 * 24));
}

export function classifyRegionaisAction(r: RegionaisActionLike, today: Date = new Date()): RegionaisBucket {
  if (r.status === 'realizada') return 'realizada';
  if (r.status === 'cancelada') return 'cancelada';
  if (r.status === 'agendada' || r.status === 'reagendada') {
    const dias = getDiasAtraso(r, today);
    if (dias <= 0) return 'prevista';
    if (dias > PENDENTE_THRESHOLD_DAYS) return 'pendente';
    return 'atrasada';
  }
  return 'prevista';
}

export const BUCKET_LABEL: Record<RegionaisBucket, string> = {
  realizada: 'Realizada',
  prevista: 'Prevista',
  atrasada: 'Atrasada',
  pendente: 'Pendente',
  cancelada: 'Cancelada',
};

export const BUCKET_BADGE_VARIANT: Record<RegionaisBucket, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  realizada: 'success',
  prevista: 'info',
  atrasada: 'warning',
  pendente: 'error',
  cancelada: 'default',
};
