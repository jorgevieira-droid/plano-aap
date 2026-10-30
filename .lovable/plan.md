# Impressão em branco nas ações novas do Programa Escolas

## Causa (confirmada)
O formulário do Planejamento conjunto de 14/10 (México) está salvo, com todas as respostas (tema, nº da aula, papel do professor, desafios, Prática 1/2, link etc.).
A impressão monta as perguntas a partir de uma lista de perguntas cadastrada no banco. As ações criadas recentemente têm o formulário montado direto na tela e **não têm essa lista cadastrada**, por isso a impressão sai só com o cabeçalho.

Ações afetadas (formulários já salvos que imprimem em branco):
- Planejamento conjunto com prof. (29)
- Apoio Presencial com a Coordenação (156)
- Aula compartilhada com prof. (35)
- Formação Coletiva (35)
- Reunião com o Professor (12)

## O que será feito
Criar uma seção de impressão própria para cada uma dessas 5 ações, mostrando cada pergunta com o rótulo igual ao do formulário e a resposta preenchida (Sim/Não por extenso, listas de múltipla escolha, campos "Outro", textos longos com quebra de linha, link). Quando a ação não tem formulário, as perguntas aparecem em branco para preenchimento manual, como hoje nas outras ações.

Vale para os botões de imprimir em Registros e Programação (mesma janela de impressão).

## Detalhes técnicos
- Novo arquivo de definição `src/components/print/escolasFormsPrintConfig.ts` com, por form_type, a lista ordenada `{ key, label, type: text|longtext|bool|multi|link, outroKey? }` extraída dos componentes de formulário de cada ação (rótulos e opções reutilizados das constantes existentes).
- Novo `EscolasFormPrintSection.tsx` que renderiza a lista com `responses`.
- `AcaoPrintForm.tsx`: quando `formType` estiver nesse config, renderizar a nova seção em vez do bloco genérico de `instrument_fields`.
- Sem mudanças no banco.
- Verificação: imprimir o Planejamento de 14/10 México e um registro de cada uma das outras 4 ações.
