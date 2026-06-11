## Problema
No alerta "Ações pendentes há mais de 7 dias" do Dashboard, o nome da ação aparece como a chave técnica (ex.: `qualidade_implementacao`, `visita_tecnica_secretaria_sme`) em vez do rótulo amigável (ex.: "Visita Técnica à Secretaria (SME)").

## Mudança
**`src/pages/admin/AdminDashboard.tsx` (linha 981)** — Trocar `{reg.tipo}` por `{getAcaoLabel(reg.tipo)}`, usando o helper já existente em `@/config/acaoPermissions` (mesmo usado em `ProgramacaoPage`/`RegistrosPage`). Se o import ainda não existir no arquivo, adicioná-lo.

## Validação
Recarregar `/dashboard` e confirmar que cada ação listada no alerta de pendências mostra o nome legível da ação (ex.: "Visita Técnica à Secretaria (SME)") em vez da chave do banco.