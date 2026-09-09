---
name: Alterações de agenda da visita
description: Ação exclusiva do Programa Escolas — cadastro mínimo (Data, Escola, Consultor) e duas perguntas obrigatórias
type: feature
---
Tipo: `alteracao_agenda_visita` (apenas programa `escolas`, via `form_config_settings`).

Cadastro: Data, Escola (entidade) e Consultor (responsável). Título, Descrição, Tags e horários ocultos — o título é gravado automaticamente como "Alteração de agenda da visita". Sem Segmento, Componente e Ano/Série.

Registro (chaves em `instrument_responses`, definidas em `instrument_fields`, ambas obrigatórias):
- `contexto_alteracao` (`select_multi`): Feriado / Reunião de Pais / Conselho de Classe / Evento na escola / Convocação do profissional / Ausência do profissional / Outros
- `impacto_agenda` (`textarea`)

Usa o formulário genérico `InstrumentForm` (sem componente dedicado). Sem página de relatório própria.
