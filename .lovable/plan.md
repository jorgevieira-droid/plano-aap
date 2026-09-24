# Permitir Remover/Reincluir presença também para N5

Vale para as janelas de presença da **Programação** e dos **Registros** (Encontro Formativo – Microciclos de Recomposição, Encontro Formativo ET/EG – REDES e Encontro Formativo Professor – REDES) e para o **Histórico de Presença** (ambas as abas, todos os tipos de encontro).

## Hoje

Os botões **Remover** e **Reincluir** (seção "Removidos / não incluídos neste encontro") só aparecem para N1, N2 e N3 (perfis administrativo/gerencial). N5 – Formador vê apenas a marcação de Presente/Ausente.

## O que muda

1. N5 – Formador passa a ver os mesmos botões **Remover** e **Reincluir** nessas janelas de presença, com o mesmo comportamento atual (remover = apagar a linha de presença daquele encontro ao salvar; reincluir = volta como Ausente).
2. O contador "X de Y presentes" continua desconsiderando os removidos — sem mudança de regra.
3. N4.1 (CPed), N4.2 (GPI), N6, N7 e N8 continuam sem os botões.
4. O **Histórico de Presença** permanece como está (Remover/Reincluir apenas para N1–N3), pois lá a remoção vale para todos os tipos de encontro, não apenas esses três. Se quiser N5 também lá, é um ajuste separado.

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx` (~l.322): `canGerenciarListaPresenca` passa a incluir `hasRole('n5_formador')` além de `isAdmin || isGestor || isManager`.
- `src/pages/admin/RegistrosPage.tsx` (~l.1749): mesmo ajuste no `canGerenciarListaPresenca`.
- Nenhuma mudança no banco: remover já apaga a linha de `presencas`, e o salvamento usa upsert por `(registro_acao_id, professor_id)`. RLS de `presencas` já permite delete a N5 (mesmo padrão dos demais atores operacionais).

## Verificação

Como N5 (ou simulando o papel), abrir um dos três encontros na Programação, remover um participante, salvar, reabrir e conferir que ele segue fora; repetir em Registros e confirmar o mesmo total no Histórico de Presença.
