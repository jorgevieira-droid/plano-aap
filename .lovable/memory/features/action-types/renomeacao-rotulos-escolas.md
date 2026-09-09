---
name: Renomeação visual das ações do Programa Escolas
description: De => Para dos rótulos das ações do Olhar Parceiro; chaves técnicas inalteradas
type: feature
---
Alteração apenas de rótulos visíveis (set/2026). Chaves técnicas no banco permanecem as mesmas.

| Chave técnica | De | Para |
| --- | --- | --- |
| `registro_consultoria_pedagogica` | Registro de Apoio Presencial com Coordenação | Apoio Presencial com a Coordenação |
| `registro_apoio_presencial` | Registro de Apoio Presencial | Apoio Presencial |
| `registro_apoio_coordenador` | Registro de Apoio ao Coordenador | Reunião com a coordenação |
| `registro_aula_compartilhada` | Registro de Aula Compartilhada | Aula compartilhada com prof. |
| `registro_formacao_coletiva` | Registro de Formação Coletiva | Formação Coletiva |
| `registro_planejamento_conjunto` | Registro de Planejamento Conjunto com o Professor | Planejamento conjunto com prof. |

Fontes principais dos rótulos: `ACAO_TYPE_INFO` (`src/config/acaoPermissions.ts`) e `INSTRUMENT_FORM_TYPES` (`src/hooks/useInstrumentFields.ts`). Títulos de relatórios/PDF usam o padrão "Relatório - <novo nome>".
