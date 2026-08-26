import { InstrumentForm } from './InstrumentForm';
import RegistroApoioPresencialContent from '@/components/formularios/RegistroApoioPresencialContent';
import {
  FormacaoCoordenadorContent,
  EncaminhamentosInternosContent,
  FormacaoColetivaContent,
} from '@/components/formularios/OlharParceiroContents';
import PlanejamentoConjuntoContent from '@/components/formularios/PlanejamentoConjuntoContent';
import ApoioCoordenadorContent from '@/components/formularios/ApoioCoordenadorContent';
import AulaCompartilhadaContent from '@/components/formularios/AulaCompartilhadaContent';

interface Props {
  formType: string;
  responses: Record<string, any>;
  onResponseChange: (key: string, value: any) => void;
  selectedKeys?: string[];
  readOnly?: boolean;
}

/** Tipos com formulário dedicado (modelo "Olhar Parceiro") */
export const DEDICATED_CONTENT_TYPES = new Set([
  'registro_apoio_presencial',
  'registro_consultoria_pedagogica',
  'registro_encaminhamentos_internos',
  'registro_formacao_coletiva',
  'registro_planejamento_conjunto',
  'registro_apoio_coordenador',
  'registro_aula_compartilhada',
]);

export function InstrumentFormRouter({
  formType,
  responses,
  onResponseChange,
  selectedKeys,
  readOnly,
}: Props) {
  if (formType === 'registro_apoio_presencial') {
    return (
      <RegistroApoioPresencialContent
        responses={responses}
        onChange={onResponseChange}
        readOnly={readOnly}
      />
    );
  }
  if (formType === 'registro_consultoria_pedagogica') {
    return (
      <FormacaoCoordenadorContent
        responses={responses}
        onChange={onResponseChange}
        readOnly={readOnly}
      />
    );
  }
  if (formType === 'registro_formacao_coletiva') {
    return (
      <FormacaoColetivaContent
        responses={responses}
        onChange={onResponseChange}
        readOnly={readOnly}
      />
    );
  }
  if (formType === 'registro_planejamento_conjunto') {
    return (
      <PlanejamentoConjuntoContent
        responses={responses}
        onChange={onResponseChange}
        readOnly={readOnly}
      />
    );
  }
  if (formType === 'registro_apoio_coordenador') {
    return (
      <ApoioCoordenadorContent
        responses={responses}
        onChange={onResponseChange}
        readOnly={readOnly}
      />
    );
  }
  if (formType === 'registro_aula_compartilhada') {
    return (
      <AulaCompartilhadaContent
        responses={responses}
        onChange={onResponseChange}
        readOnly={readOnly}
      />
    );
  }
  if (formType === 'registro_encaminhamentos_internos') {
    return (
      <EncaminhamentosInternosContent
        responses={responses}
        onChange={onResponseChange}
        readOnly={readOnly}
      />
    );
  }
  return (
    <InstrumentForm
      formType={formType}
      responses={responses}
      onResponseChange={onResponseChange}
      selectedKeys={selectedKeys}
      readOnly={readOnly}
    />
  );
}

export default InstrumentFormRouter;
