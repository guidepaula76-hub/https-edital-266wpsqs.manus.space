# TODO — UltraConcursos IA, Etapas 1 a 4

## Etapa 1 — frontend e PWA entregues

## [x] 1. Identidade, landing, navegação e experiência responsiva
- Criar aplicação web chamada **UltraConcursos IA**, completa em frontend, gamificada, responsiva e Mobile-First, inspirada na experiência interativa do Duolingo para preparação de concursos públicos no Brasil.
- Aplicar fundo #F7F9FC, cards brancos e bordas #E2E8F0, verde menta/sálvia #58CC82 para acertos e progresso, lilás/lavanda #8B80F9 para trilhas e destaques e coral #FF7675 para alertas e detalhes, sem tons neon agressivos.
- Oferecer modo claro e escuro com contraste legível, estados de foco e suporte a reduced motion.
- Em mobile, mostrar barra inferior fixa com Início, Trilha, Questões, Conteúdos, Ranking e Perfil. Em desktop, oferecer estrutura equivalente com navegação lateral/topo.
- Na rota `/`, apresentar a UltraConcursos IA, o mascote sapo 3D, botões mecânicos “Começar Agora” e “Já tenho conta”.
- Usar microinterações fluidas com Framer Motion em transições, progresso, hover e respostas corretas/incorretas. Os botões principais, alternativas e nós circulares da trilha terão aspecto mecânico 3D, borda inferior sólida de 5px mais escura, afundamento físico com translateY ao pressionar e opção de som suave de clique.

## [x] 2. Mascote original e marca
- Integrar um sapo verde simpático, em estilo 3D estilizado, usando roupa/moletom vermelho.
- O sapo aparece estudando com livros no Dashboard, torcendo nos cards/unidades, comemorando quando a resposta está correta e incentivando quando a resposta está incorreta.
- Criar ícone PWA personalizado com rosto do sapo verde de roupa vermelha e símbolo de aprovação/check.
- As imagens do mascote são originais, consistentes entre estados, sem texto incorporado, e acompanham texto alternativo acessível.

## [x] 3. PWA instalável
- Configurar aplicação web instalável (PWA) com manifesto, service worker, ícones apropriados, metatags para dispositivos móveis e apple touch icon.
- A aplicação é proprietária do manifesto; usar `application_owned` e manter manifesto e service worker próprios.
- Instalar o aplicativo na tela inicial Android/iOS quando suportado; informar limitações e instruções iOS quando necessário.
- Oferecer shell/app offline por cache controlado, sem cache de informações sensíveis, e estados claros quando recursos remotos não estiverem disponíveis.

## [x] 4. Onboarding e dados demonstrativos da Etapa 1
- Pedir concurso, cargo, nível, banca examinadora, formato padrão da prova, horas disponíveis por dia e texto do edital.
- Incluir as bancas Cebraspe, FGV, FCC, Vunesp, Cesgranrio, IBFC, Quadrix e outras.
- Dar suporte a Certo/Errado, A–D e A–E e identificar banca/formato para apresentação adaptativa.
- Aceitar colagem de texto do edital e apresentar verticalização automática demonstrativa dos tópicos, sem alegar processamento por IA real.
- Usar dados fictícios nesta etapa, com transparência sobre login/cadastro, tutor, correção e ranking demonstrativos; sem persistência em banco ou autenticação real. Este comportamento foi substituído pelos resultados da Etapa 2 quando estes forem implementados; módulos ainda pendentes permanecem rotulados como demonstração.

## [x] 5. Início / Dashboard de performance
- Mostrar saudação com o sapo estudando, barra superior com XP, ofensiva/streak e avatar.
- Exibir concurso ativo, progresso de tópicos do edital e botão para iniciar sessão rápida.
- Exibir gráficos de evolução, taxa de acerto por disciplina, Raio-X de Pontos Fracos, ofensiva de dias seguidos e contagem regressiva para a prova.
- Atualizar estados de demonstração a partir das interações locais.

## [x] 6. Trilha de estudos e progressão
- Mostrar caminho sinuoso vertical por seções/matérias, com botão “Guia” teórico.
- Cada etapa será um nó circular mecânico com estados concluído, ativo pulsante, bloqueado com cadeado e troféu final.
- Ao concluir todos os tópicos do Nível 1, desbloquear automaticamente o Nível 2, com os mesmos tópicos, questões novas e mais difíceis.
- Refletir XP, progresso, conquistas e streak localmente quando o usuário completa atividades.

## [x] 7. Questões, filtros e banca adaptativa da Etapa 1
- Disponibilizar filtros por matéria, assunto, banca e dificuldade.
- Renderizar automaticamente opções Certo/Errado para Cebraspe/Quadrix ou bancas configuradas como C/E, quatro alternativas A a D ou cinco alternativas A a E conforme formato/banca.
- Incluir “Deixar em Branco” no modelo Certo/Errado, timer, feedback visual, gabarito comentado, destaque da “Pegadinha da Banca” e justificativa item por item.
- Atualizar XP/progresso localmente e exibir sapo comemorando acertos e incentivando após erros.
- Incluir caderno de erros com lista de questões incorretas e ação para refazê-las.

## [x] 8. Cronograma e ciclo adaptativo
- Oferecer grade visual alternando teoria, questões e revisões espaçadas de 24h, 7d, 15d e 30d.
- Incluir botão “Recalcular Rota” para o cenário em que o aluno atrasa, com novo cronograma de demonstração.
- Integrar cronograma com a Trilha e com o destino Conteúdos.

## [x] 9. Conteúdos e fábrica de fixação
- Criar abas internas para Guia/Resumo Esquematizado, Mapa Mental Interativo e Flashcards.
- O mapa mental será árvore visual expansível.
- Flashcards deverão virar com animação flip e apresentar mnemônicos.
- Fornecer conteúdo de estudo fictício porém utilizável para a demonstração.

## [x] 10. Redação e discursiva
- Disponibilizar editor de texto com contador de linhas e padrão de 30 linhas.
- Mostrar painel com nota demonstrativa por critério de banca — estrutura, gramática e conteúdo — e sugestões de reescrita.
- Identificar a avaliação como fictícia, não como correção de IA em produção.

## [x] 11. Simulado e ranking
- Oferecer interface de prova real com cronômetro regressivo, modo de foco/bloqueio de distrações, resposta/entrega e tela de resultado demonstrativa.
- Disponibilizar ranking nacional e por concurso entre usuários fictícios, identificado como demonstração, sem alegar sincronização ou competição real.

## [x] 12. Perfil e Tutor IA demonstrativo
- Incluir perfil/avatar, preferências, progresso e ajustes de experiência, incluindo tema claro/escuro e efeito sonoro opcional desligado por padrão.
- Disponibilizar chat flutuante lateral “Tutor IA 24h” com interação local e respostas demonstrativas identificadas como tais.
- Acessar o caderno de erros e refazer questões pela área Perfil, sem impedir acesso aos módulos principais.

## [x] 13. Rotas, PWA, Preview e entrega da Etapa 1
- Manter o conjunto de rotas do app consistente com `client/src` em `/manus-routes.json`, incluindo landing, login, cadastro, onboarding e as seis áreas principais.
- Manter metadados do documento em português do Brasil, manifesto, ícones e links relativos para recursos locais.
- A configuração estática inicial foi usada apenas para a Etapa 1; a nova solicitação da Etapa 2 autoriza habilitar servidor e banco de dados.
- Configurar `pnpm dev:static` como comando de desenvolvimento gerenciado e confirmar que a porta 3000 responde.
- Resolver diagnósticos TypeScript e garantir `pnpm build:static` concluído antes do checkpoint.
- Salvar a versão como checkpoint no repositório canônico, sem publicar automaticamente.

## Etapa 2 — autenticação, verticalizador e persistência solicitados

## [ ] 14. Conta real por e-mail/senha e Google, sessão e proteção
- Implementar cadastro e login funcionais com e-mail/senha e login Google OAuth 2.0, além de logout real; remover mensagens de protótipo destes fluxos e não criar uma rota de exploração que burle a autenticação.
- Armazenar hashes de senha gerados com algoritmo apropriado e salt individual; nunca salvar senha em texto simples. Usar sessão aleatória persistida no servidor, cookie protegido e invalidação no logout. Sessões e contas pertencem a usuários no banco.
- Vincular Google OAuth com `state` e nonce de uso único e PKCE; verificar os dados retornados pelo provedor; restringir redirects às páginas internas. Segredos Google permanecem no armazenamento protegido/servidor.
- Manter estado “deslogado” até autenticação real, proteger as rotas internas e limpar dados em memória/local ao trocar de conta. Não simular um usuário Preview nem usar um switch de desenvolvimento para ignorar autenticação.

## [ ] 15. Onboarding universal e perfil de concurso persistido
- Ao clicar em “Começar”, pedir concurso, cargo, nível, banca examinadora, formato padrão da prova, horas disponíveis/dia e, opcionalmente, data da prova.
- Oferecer Cebraspe, FGV, FCC, Vunesp, Cesgranrio, IBFC, **IBAM**, Quadrix, outras bancas e formato selecionável Certo/Errado, A–D ou A–E. Permitir ajustar o formato conforme o edital mesmo quando divergir do padrão associado à banca.
- Persistir meta/edital e as preferências no banco associadas ao usuário autenticado; ao reabrir o app, restaurar a meta e progresso corretos daquele usuário.

## [ ] 16. Verticalizador IA para texto colado e edital PDF
- Permitir colar o conteúdo programático do edital e fazer upload de PDF; validar tipo, tamanho e conteúdo antes de transferir.
- Armazenar PDF privado em armazenamento durável usando chave não adivinhável, guardar metadados/ownership no banco e não revelar URL assinada.
- Processar o conteúdo no backend com o serviço LLM integrado e instruções de extração estruturada para separar disciplinas e tópicos e gerar nós personalizados da trilha.
- Apresentar prévia editável da verticalização, permitindo correção antes de salvar; criar meta, disciplinas, tópicos e nós persistidos apenas após confirmação do usuário.
- Se PDF/texto for ilegível, vazio, extenso demais, inválido ou o modelo falhar, apresentar erro e preservar a edição; não mostrar resultado fictício nem afirmar que houve sucesso.

## [ ] 17. Modelo de dados, migrações e isolamento por usuário
- Usar MySQL gerenciado com Drizzle; preservar a tabela de usuários existente e adicionar migrações SQL determinísticas/aditivas para identidades, sessões, metas/editais, documentos, disciplinas, tópicos/nós da trilha, progresso, tentativas, acervo e caderno de erros.
- Aplicar migrações com ownership entre cada dado e o userId autenticado; validar ownership no servidor em cada consulta, alteração, upload, verticalização e revisão, sem confiar em `userId` recebido do browser.
- Nunca eliminar ou sobrescrever dados reais em migração; evitar seed destrutivo e manter o banco disponível tanto para Preview quanto para o serviço publicado.

## [ ] 18. Fidelidade estrutural a banca e correção Raio-X
- Adaptar o layout conforme banca/formato escolhido ou override confirmado no edital: Certo/Errado (incluindo Cebraspe/Quadrix), quatro opções A–D (incluindo IBAM e bancas municipais), cinco opções A–E (incluindo FGV, FCC, Vunesp e Cesgranrio).
- Em Certo/Errado, oferecer botão tátil “Deixar em Branco”.
- Registrar resposta e verificar acerto no servidor. Na correção, exibir gabarito comentado, reação de acerto/apoio do sapo, card suave “Pegadinha da Banca” e justificativas das alternativas disponíveis no acervo.
- Manter identificação de demonstração para questões de amostra não oficiais; não afirmar geração por IA de questões se esse recurso não foi implementado.

## [ ] 19. Caderno de erros e progresso persistidos
- Gravar no banco todas as questões respondidas incorretamente (não em branco) por usuário, com referência/snapshot suficiente para revisão futura e chave única para não criar duplicatas desnecessárias.
- Disponibilizar consulta do caderno apenas para o usuário dono, apresentar itens errados na área Perfil/trilha e permitir refazê-los. Registrar revisão e resolver/remover o item pendente após acerto, de modo persistente.
- Sincronizar tentativas, progresso dos nós da trilha, XP e streak com o usuário autenticado; nunca reutilizar estado local demonstrativo ao iniciar sessão para outro usuário.

## [ ] 20. Backend e integração de Preview/publicação sem exposição de APIs privadas
- Ligar servidor Express/tRPC ao frontend, usar backend em desenvolvimento e produção e servir assets Vite de `dist/public` sem as rotas SPA interceptarem API/health/OAuth.
- Manter `/api/health` sem autenticação; não cachear em service worker qualquer endpoint privado, autenticação, sessão, upload ou resposta; não incluir segredos server-side nos bundles.
- Configurar build/deploy de container e regras de rota que sirvam `/api/*` ao servidor e os assets/páginas do SPA à aplicação estática correspondente; manter `auto_publish` desligado.
- Preservar as etiquetas de demonstração de tutor, redação, ranking e conteúdo amostral até implementação própria desses recursos.

## Evidências de implementação da Etapa 1

As 13 áreas acima foram implementadas no frontend da Etapa 1. As seis rotas internas e os quatro fluxos de entrada estão registrados em `client/public/manus-routes.json`, confirmado com HTTP 200 no runtime estático gerenciado (porta 3000). `pnpm check`, os 10 testes de `pnpm test`, `pnpm build:static` e `git diff --check` passaram. O build gera precache versionado de todos os bundles em `dist/public/sw.js`. Ícones 192/512/maskable e Apple 180 foram verificados a partir do ícone original gerado. Diagnósticos TypeScript/CSS/JSON/HTML estão registrados. A revisão somente leitura foi concluída e os defeitos confirmados de índices da trilha, fallback da banca Outra, pré-requisitos N2, ofensiva e largura de redação foram corrigidos.

A instalação do PWA depende de publicação HTTPS e suporte do navegador; o registro do service worker ocorre no build de produção, evitando cache de módulos de desenvolvimento. A versão fica disponível no Preview e será salva como checkpoint, sem publicação automática. Login, tutor, correção e ranking foram demonstrativos na Etapa 1; o novo escopo abre apenas os fluxos especificados acima para implementação real.

## Etapa 3 — Leitura de Provas Anteriores, Mapas Mentais e Cronograma

## [ ] 21. Calibragem por provas anteriores em PDF
- Adicionar uma área onde o aluno ou administrador pode subir provas anteriores em PDF daquela banca/cargo.
- Criar um pipeline que extrai o texto do PDF, identifica o formato das questões (Certo/Errado, A–D ou A–E), mapeia o estilo de cobrança e as pegadinhas típicas, e usa esse padrão como referência obrigatória para a IA gerar questões inéditas no estilo da banca real, sem copiar literalmente itens da prova enviada.
- Associar arquivo e perfil de calibração ao dono, banca e cargo; validar tipo, tamanho e conteúdo e apresentar erro recuperável quando o PDF estiver vazio, ilegível ou inválido.

## [ ] 22. Conteúdos — Fábrica de Fixação por tópico
- Ao clicar em “Guia” na trilha ou acessar a aba Conteúdos, permitir que o aluno gere para qualquer tópico do edital ativo: Mapa Mental Interativo, Resumo Esquematizado e Flashcards.
- O Mapa Mental Interativo deve ser uma árvore visual expansível com cores suaves.
- O Resumo Esquematizado deve priorizar lei seca, prazos e tabelas, conforme o tópico e o edital informado.
- Os Flashcards devem virar com animação 3D e apresentar resposta e dica mnemônica.
- Gerar com IA a partir do tópico escolhido, validar a estrutura e preservar materiais existentes enquanto uma nova geração estiver carregando ou falhar.

## [ ] 23. Cronograma Inteligente e Revisão Espaçada
- Distribuir automaticamente os tópicos da trilha nos dias da semana do aluno, respeitando as horas disponíveis e intercalando teoria, questões e revisões programadas.
- Agendar revisões espaçadas em 24h, 7d, 15d e 30d para cada tópico estudado, registrando o progresso das tarefas no banco.
- Ao recalcular a rota, redistribuir somente as tarefas pendentes, sem apagar o histórico de tarefas concluídas nem deslocar silenciosamente revisões já vencidas.

## Etapa 4 — Simulado, Redação, Ranking e Planos

## [ ] 24. Simulado cronometrado e pontuação conforme edital
- Oferecer simulados completos com cronômetro regressivo, navegação entre questões, salvamento de respostas e entrega manual ou automática ao fim do tempo.
- Calcular e persistir a nota no servidor usando a regra oficial definida para o concurso/edital. Para o modelo Cebraspe Certo/Errado com penalidade de anulação, resposta certa soma 1, errada subtrai 1 e em branco vale 0; respeitar regras diferentes documentadas no edital.
- O resultado exibe acertos, erros, brancos, nota líquida e critério aplicado; a resposta/pontuação calculada no navegador não concede resultado nem XP.

## [ ] 25. Ranking real semanal e ligas
- Substituir participantes fictícios por estudantes reais que tenham consentido em aparecer, usando nome público/pseudônimo e nunca expondo e-mail ou dados privados.
- Alimentar XP do ranking com eventos validados no servidor: questões novas e revisões, ofensiva e simulados concluídos, cada um creditado no máximo uma vez.
- Disponibilizar ranking semanal nacional e por concurso e ligas Bronze, Prata, Ouro e Diamante; atualizar a liga ao fechar a semana sem apagar o histórico necessário para explicar posição e progresso.
- Mostrar estado vazio ou “ranking ainda indisponível” quando faltarem participantes reais, sem criar nomes/pontuações fictícias nem declarar a demonstração como competição real.

## [ ] 26. Correção de redação/discursiva por IA
- Disponibilizar folha pautada virtual com exatamente 30 linhas e contador de linhas/caracteres.
- Corrigir por IA no backend segundo a banca e critérios/rubrica versionados do edital aplicável, mostrando nota por critério, justificativa e sugestões concretas de melhoria.
- Salvar redação e retorno ligados ao usuário/concurso; preservar o texto se a correção falhar e oferecer nova tentativa sem perder o rascunho.
- Informar que a nota é estimativa educacional e não resultado oficial da banca; nunca inventar uma correção concluída quando a IA falhar.

## [ ] 27. Planos Free/Ultra Pro, quotas e incentivo de upgrade
- Plano Gratuito: no máximo 10 questões novas por dia e 1 mapa mental por dia; revisões/refações não descontam do limite de questões novas.
- Plano Ultra Pro: questões ilimitadas, upload de provas anteriores em PDF, correção de redações e simulados ilimitados.
- Aplicar quotas e permissões no servidor, de forma concorrente/atômica e vinculada ao usuário autenticado; não confiar em contadores, plano ou horário enviados pelo browser.
- Mostrar banners suaves de upgrade no Início e no Perfil, informar limite atingido antes de executar a função bloqueada e preservar o rascunho/atividade.

## [ ] 28. Stripe Checkout, webhooks e assinatura Pro
- Habilitar Stripe pelo fluxo de integração gerenciado WebDev; usar primeiro sandbox/teste e não ativar pagamentos live ou publicar sem ação separada autorizada pelo proprietário.
- Criar Checkout Session no backend somente para usuário autenticado, com customer/e-mail e IDs de usuário associados; manter catálogo/preços centralizados e não embutir chaves secretas no cliente.
- Persistir customer, subscription, price/entitlement e eventos processados necessários; verificar assinatura do webhook em bytes originais, tratar reentregas sem duplicar eventos e conceder/revogar Pro apenas após evento validado.
- Oferecer retorno pendente/cancelado/sucesso sem tratar o redirect do Stripe como prova de pagamento; nunca armazenar número de cartão, CVV ou validade.
- Aguardar confirmação do proprietário para preço, moeda, periodicidade e valores/IDs Stripe antes de definir preço de produção ou permitir cobrança live.
