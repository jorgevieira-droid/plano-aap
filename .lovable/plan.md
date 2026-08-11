# Novo campo no Registro de Encaminhamento Interno

Incluir uma segunda pergunta de texto longo no formulário de registro, logo após a pergunta existente.

## O que muda

Bloco "Dados do Encaminhamento" passa a ter:

1. "Existe alguma informação que precisa ser circulada internamente? Descreva abaixo" (já existe, obrigatória)
2. "Existe algum encaminhamento ou resultado de uma informação circulada em REI anterior?" — novo campo de texto longo, com a orientação "Descreva abaixo o encaminhamento e para quem ele se destina" e preenchimento opcional.

O campo aparece do mesmo jeito em modo leitura de registros já salvos (vazio nos antigos).

## Detalhes técnicos

- `src/components/formularios/OlharParceiroContents.tsx`: em `EncaminhamentosInternosContent`, adicionar um `Textarea` ligado à chave `encaminhamento_rei_anterior`, com rótulo e texto de apoio acima do campo.
- As respostas desse instrumento são salvas em JSON, então não é necessária migração de banco.
