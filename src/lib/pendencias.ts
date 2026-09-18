export const PENDENCIA_SLA_DIAS = 7;

export interface RegistroParaPendencia {
  data: string;
  status: string;
  reagendada_para?: string | null;
}

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getDataReferenciaPendencia = (registro: RegistroParaPendencia): string =>
  registro.status === 'reagendada' && registro.reagendada_para
    ? registro.reagendada_para
    : registro.data;

export const getDiasAtraso = (registro: RegistroParaPendencia, today = new Date()): number => {
  const referenceDate = parseLocalDate(getDataReferenciaPendencia(registro));
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
};

export const isRegistroPendente = (registro: RegistroParaPendencia, today = new Date()): boolean =>
  (registro.status === 'agendada' || registro.status === 'reagendada')
  && getDiasAtraso(registro, today) >= PENDENCIA_SLA_DIAS;