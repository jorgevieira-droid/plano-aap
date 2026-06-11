## Diagnóstico

O PDF anexado contém apenas o cabeçalho e nenhuma pergunta. A ação SME está usando o formulário genérico baseado em `instrument_fields` + `instrument_responses`, mas o fluxo atual de impressão não garante conteúdo quando não encontra `responses` para o `registro_acao_id` principal e também não tem uma seção dedicada com a legenda/estrutura da SME.

Além disso, no replay a ação estava com status `prevista`, então o PDF deveria ao menos sair com a estrutura em branco das 24 perguntas — isso confirma que o problema não é só ausência de preenchimento, é falha de renderização/busca no print.

## Plano de correção

1. **Criar uma seção dedicada de impressão para SME**
   - Novo componente `VisitaTecnicaSecretariaSmePrintSection`.
   - Renderizar:
     - cadastro da visita: município/entidade, data, horário, responsável, núcleo/departamento e observador;
     - legenda das rubricas 0–3;
     - 10 critérios agrupados por dimensão;
     - campo de evidência logo abaixo de cada critério;
     - bloco final de encaminhamentos com os 4 campos descritivos.
   - Usar `data-pdf-section` nos blocos para evitar páginas quebradas ou seções perdidas.

2. **Atualizar `AcaoPrintForm` para SME não depender do fallback genérico**
   - Importar e renderizar a nova seção quando `programacao.tipo === 'visita_tecnica_secretaria_sme'`.
   - Excluir SME do fallback genérico para evitar duplicidade e manter layout controlado.
   - Passar `fields` + `responses` para a seção dedicada, permitindo PDF preenchido ou estrutura em branco.

3. **Fortalecer a busca de respostas no `AcaoPrintDialog`**
   - Para `visita_tecnica_secretaria_sme`, buscar `instrument_responses` em camadas:
     1. `registro_acao_id` principal;
     2. qualquer `registro_acao` da mesma programação;
     3. fallback por mesma entidade/escola + data + tipo.
   - Escolher a resposta mais recente quando houver mais de uma.
   - Exibir aviso no modal quando a ação estiver `realizada` e não houver resposta salva, mas ainda permitir gerar a estrutura em branco.

4. **Documentar o caso na checklist de novas ações**
   - Atualizar `mem://process/new-action-type-checklist` para explicitar que ações genéricas com `instrument_fields` também precisam de teste de impressão em dois cenários:
     - prevista/sem resposta: deve imprimir perguntas em branco;
     - realizada/com resposta: deve imprimir dados preenchidos.

## Validação

- Confirmar que o PDF da SME passa a conter as perguntas mesmo sem respostas.
- Confirmar que, quando houver `instrument_responses`, notas e textos aparecem no PDF.
- Conferir o PDF visualmente após geração para garantir que não sai branco e que as seções não ficam cortadas.