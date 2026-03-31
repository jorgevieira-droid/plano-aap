

# Adicionar rótulos descritivos nas opções de escala dos formulários REDES

## Problema

Nos formulários **Encontro ET/EG – REDES** e **Encontro Professor – REDES**, os botões de rádio dos itens de verificação exibem apenas os números (0, 1, 2) sem os rótulos descritivos da escala. A opção "0 – Não Implementado" não fica clara para o usuário. O card "Escala de Resposta" (BinaryScaleLegendCard) já aparece no topo, mas os botões de rádio não refletem esses rótulos.

## Solução

### Arquivos: `EncontroETEGRedesForm.tsx` e `EncontroProfessorRedesForm.tsx`

Alterar o RadioGroup dos itens de verificação para exibir os rótulos da escala junto aos valores numéricos:

- **0 – Não Implementado**
- **1 – Parcialmente**
- **2 – Implementado**

Mudar o layout de `grid-cols-3` para uma disposição vertical ou com mais espaço, já que os rótulos são mais longos que os números simples.

### Constante compartilhada

Criar em `redesFormShared.tsx` uma constante com os rótulos curtos da escala binária para reutilizar nos dois formulários:

```typescript
export const BINARY_SCALE_OPTIONS = [
  { value: 0, label: 'Não Implementado' },
  { value: 1, label: 'Parcialmente' },
  { value: 2, label: 'Implementado' },
] as const;
```

### Resultado visual

Cada item de verificação mostrará 3 opções com formato:
```
○ 0 – Não Implementado    ○ 1 – Parcialmente    ○ 2 – Implementado
```

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/pages/formularios/redesFormShared.tsx` | Adicionar constante `BINARY_SCALE_OPTIONS` |
| `src/components/formularios/EncontroETEGRedesForm.tsx` | Usar rótulos descritivos no RadioGroup |
| `src/components/formularios/EncontroProfessorRedesForm.tsx` | Usar rótulos descritivos no RadioGroup |

