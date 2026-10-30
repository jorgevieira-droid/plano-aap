# Painéis do Programa Escolas atualizam na hora quando um formulário muda

## O que muda para o usuário
- Alguém salva, edita ou apaga um formulário ou uma ação do Programa Escolas.
- Os painéis abertos de N1, N2 e N3 se atualizam sozinhos em poucos segundos, sem recarregar a página.
- Painéis que mudam:
  - Relatório de Gestão - Programa Escolas, incluindo o quadro "Ações realizadas sem formulário"
  - Reunião Mensal N1
  - O painel de cada ação: Apoio Presencial, Aula compartilhada, Planejamento conjunto, Formação Coletiva, Apoio com a Coordenação, Reunião com a coordenação, Reunião com o Professor, Alteração de Agenda e Encaminhamentos internos
- Para não recarregar a página várias vezes seguidas, as mudanças feitas em sequência são juntadas numa só atualização, com uma espera curta de cerca de 3 segundos.
- Cada pessoa continua vendo só os dados que já pode ver hoje. As regras de acesso não mudam.

## Detalhes técnicos
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.instrument_responses, public.registros_acao;`. As duas tabelas já têm RLS, então quem assina só recebe as linhas que pode ler.
- Novo hook `useRealtimeInvalidate(queryKeys: string[])`. Ele assina `postgres_changes` nas duas tabelas dentro de um `useEffect`, com nome de canal único. A cada evento, chama `queryClient.invalidateQueries` com debounce de 3s. O canal é removido quando a página fecha.
- O hook é ativado só para N1, N2 e N3 (admin, gestor, n3_coordenador_programa), e é chamado nas páginas listadas acima com as chaves de consulta de cada uma.
- Conferir no preview: com o Relatório de Gestão aberto, inserir e depois apagar uma resposta de teste e ver o número mudar sem recarregar.
