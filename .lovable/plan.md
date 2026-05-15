## Objetivo
Remover do PDF de impressão das ações os três campos genéricos puxados de `programacoes` (Encaminhamentos, Fechamento e Descrição) que aparecem no bloco "Campos descritivos".

## Mudança

**Arquivo:** `src/components/print/AcaoPrintDialog.tsx` (linhas 146-148)

Remover os três pushes:
```ts
if (prog.encaminhamentos) textFields.push({ label: 'Encaminhamentos', value: prog.encaminhamentos });
if (prog.fechamento) textFields.push({ label: 'Fechamento', value: prog.fechamento });
if (prog.descricao) textFields.push({ label: 'Descrição', value: prog.descricao });
```

## Efeito

- O bloco "Campos descritivos" só aparecerá para tipos que tenham campos específicos (Observação de Aula com Observações, Consultoria Pedagógica com Boas práticas/Encaminhamentos/etc., REDES Observação de Aula com Pontos fortes/Aspectos a fortalecer/etc.).
- Demais ações (incluindo Monitoramento e Gestão) não terão mais o bloco genérico no PDF.
- Sem mudanças no `AcaoPrintForm.tsx` (a seção já é condicional a `textFields.length > 0`).
- Sem alteração de banco, RLS ou outros componentes.
