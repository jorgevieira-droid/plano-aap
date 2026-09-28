# Permitir Remover/Reincluir presença também para N5

Vale para as janelas de presença da **Programação** e dos **Registros** (Encontro Formativo – Microciclos de Recomposição, Encontro Formativo ET/EG – REDES e Encontro Formativo Professor – REDES) e para o **Histórico de Presença** (ambas as abas, todos os tipos de encontro).

## Hoje

Os botões **Remover** e **Reincluir** (seção "Removidos / não incluídos neste encontro") só aparecem para N1, N2 e N3 (perfis administrativo/gerencial). N5 – Formador vê apenas a marcação de Presente/Ausente.

## O que muda

1. N5 – Formador passa a ver os mesmos botões **Remover** e **Reincluir** nessas janelas de presença, com o mesmo comportamento atual (remover = apagar a linha de presença daquele encontro ao salvar; reincluir = volta como Ausente).
2. No **Histórico de Presença** (abas "Por Formação" e "Por Professor"), N5 também passa a ter Remover/Reincluir, aplicável a todos os tipos de encontro listados lá — mesma regra que N1–N3 já seguem nessa página.
3. O contador "X de Y presentes" continua desconsiderando os removidos — sem mudança de regra.
4. N4.1 (CPed), N4.2 (GPI), N6, N7 e N8 continuam sem os botões em todas as telas.

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx` (~l.322): `canGerenciarListaPresenca` passa a incluir N5 além de N1/N2/N3.
- `src/pages/admin/RegistrosPage.tsx` (~l.1749): mesmo ajuste no `canGerenciarListaPresenca`.
- `src/pages/admin/HistoricoPresencaPage.tsx`: as três condições `isManager` dos diálogos de detalhe (~l.587, ~l.600, ~l.649) passam a aceitar também N5.
- Banco: nenhuma migração. As políticas de `presencas` já permitem a N5 (perfil operacional) inserir/apagar presenças dos encontros que lidera (`N4N5 Operational delete/insert presencas`), confirmado nas policies vigentes.

## Verificação

Como N5 (ou simulando o papel): remover um participante em um dos três encontros na Programação, salvar, reabrir e conferir que ele segue fora; repetir em Registros e confirmar o mesmo total no Histórico de Presença; no Histórico, remover e reincluir pela aba "Por Formação" e pela aba "Por Professor".
