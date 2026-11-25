# UltraConcursos IA — Etapas 1, 2, 3 e 4

## Produto e escopo

Construir um SaaS web/mobile-first chamado **UltraConcursos IA**, com preparação gamificada para concursos públicos brasileiros. A Etapa 1 entregou a experiência frontend completa, originalmente demonstrativa. A Etapa 2 conecta cadastro/login reais (e-mail/senha e Google), onboarding universal, verticalização de edital por IA, trilha e caderno de erros persistentes. A Etapa 3 acrescenta calibragem assistida por provas anteriores em PDF, materiais de fixação gerados por tópico e cronograma adaptado com revisões espaçadas. O app não deve simular autenticação nem afirmar que questões do acervo atual foram produzidas por IA ou são provas oficiais.

A navegação mobile conserva seis destinos fixos: **Início, Trilha, Questões, Conteúdos, Ranking e Perfil**. Em desktop há sidebar e topo contextual. Páginas públicas: `/`, `/login`, `/cadastro`; fluxo protegido: `/onboarding` e `/app`, `/app/trilha`, `/app/questoes`, `/app/conteudos`, `/app/ranking`, `/app/perfil`. Visitantes não autenticados permanecem em estado deslogado e são redirecionados para login ao acessar as áreas privadas. O app registra saída real e não oferece um acesso demonstrativo que burle a sessão.

## Funcionalidades

- **Entrada e autenticação**: cadastro e login com e-mail/senha e OAuth 2.0 Google. Senhas são derivadas por `scrypt` com salt por conta; sessões são aleatórias, opacas, de curta duração renovável e persistidas pelo hash no banco. OAuth usa `state`/nonce de uso único e PKCE. Sessão em cookie próprio `ultra_session`, `HttpOnly; Secure; SameSite=None; Path=/` para HTTPS Preview embutido; mutações autenticadas exigem proteção CSRF. Endpoints não revelam segredos nem aceitam redirects arbitrários. Google usa Client ID/Secret protegidos pelo WebDev. O callback é `/api/auth/google/callback` na origem pública do app; essa URL precisa constar entre os redirect URIs do cliente OAuth Google.
- **Onboarding universal**: concurso, cargo, nível, banca, formato padrão, horas por dia, data de prova opcional e conteúdo programático colado ou PDF. Bancas incluem Cebraspe, FGV, FCC, Vunesp, Cesgranrio, IBFC, IBAM, Quadrix e opção Outra. A preferência pode ser substituída por questão/formato explicitamente identificado no edital; não inferir formato universal só pelo nome da banca.
- **Verticalização real de edital**: armazenar PDFs em objeto privado de Storage sob chave aleatória e guardar metadados/dono no banco. Texto colado fica no banco com limite de tamanho. O backend encaminha texto/PDF ao modelo LLM do Manus via chamada server-side e resposta JSON estruturada; valida limites, estrutura, disciplinas e tópicos antes de mostrar uma prévia editável. Salvar a confirmação cria concurso/meta, disciplinas, nós da trilha e revisões associados ao usuário. Erros de OCR/modelo, conteúdo vazio, limites ou JSON inválido são apresentados como falhas recuperáveis; nunca fabricar sucesso. A chamada de IA consome créditos do projeto.
- **Trilha personalizada**: gerar nós de estudo a partir das disciplinas e tópicos confirmados; armazenar ordenação, nível, status e progresso no banco, com ownership por usuário/meta. Nível 2 reutiliza temas em etapa mais avançada e só abre após completar o Nível 1. Manter o caminho sinuoso, os nós táteis, a mascote e a progressão visual existentes. Onde o acervo atual não tiver questão para um tópico novo, mostrar indisponibilidade honesta em vez de associar conteúdo incorreto.
- **Questões por banca**: resolver formato efetivo conforme edital/preferência: Certo/Errado com “Deixar em Branco”; quatro alternativas A–D (incluindo IBAM); cinco alternativas A–E (FGV, FCC, Vunesp, Cesgranrio); override por questão quando necessário. A resposta correta é verificada no servidor e só é revelada depois da tentativa. A correção mantém reação da mascote, comentário, “Pegadinha da banca” e justificativa de cada alternativa fornecida pelo acervo. O acervo de demonstração existente permanece identificado como amostra, não como questões oficiais nem geração por IA.
- **Persistência do estudo**: guardar metas/edital, disciplinas/tópicos, nós/progresso, tentativas, XP/streak que forem atualizados pelo app e caderno de erros no banco. Registrar toda resposta incorreta não-em-branco para revisão, sem duplicar itens do caderno; resposta correta remove/resolve o erro pendente conforme regra documentada. Dados e arquivos sempre pertencem ao usuário autenticado.
- **Módulos ainda demonstrativos**: Tutor IA, redação e ranking permanecem identificados como demonstração. Conteúdo de fixação e cronograma passam a usar geração e persistência próprias na Etapa 3; não alegar ranking real, conteúdo oficial ou resposta de IA onde isso ainda não foi implementado.

## Identidade visual e experiência

Preservar o estilo **gamificação lúdica premium**, suave e tátil, para leitura longa. Fundo #F7F9FC, cards brancos e borda #E2E8F0, verde menta #58CC82, lavanda #8B80F9 e coral #FF7675, sem neon. Modo claro/escuro, alto contraste e reduced motion. Títulos Nunito Sans; corpo DM Sans, números tabulares. Marca acolhedora, motivadora e competente, sem prometer aprovação.

Princípios: feedback positivo e específico; progressão visível; controles táteis consistentes; pouca carga visual; conteúdo claro sobre o que é real e demonstrativo. Landing usa mascote e amostra estilizada de trilha.

**Botões mecânicos 3D**: CTAs, alternativas e nós da trilha têm face arredondada, borda inferior sólida de 5px mais escura, sombra curta e elevação no hover. Pressionar desloca 3–5px e comprime a sombra; Framer Motion, duração de 150–300ms. Som suave opcional, desligado por padrão. Alvos touch, foco e estado acessíveis.

### Mascote original

Usar sem alteração as ilustrações originais já integradas: sapo verde de moletom vermelho estudando, comemorando, incentivando e ícone com check. O dashboard mantém o sapo estudando; trilha/acerto celebram; erro incentiva. Imagens responsivas com alt acessível; não gerar visuais duplicados.

### PWA e privacidade

Manter manifesto próprio, ícones instaláveis e service worker versionado. Cache apenas shell e assets estáticos; **não armazenar em cache API privada, autenticação, upload, respostas ou dados de perfil**. Logout invalida a sessão no banco e limpa estado privado em memória/local. Evitar persistir estado autenticado ou progresso associado a uma conta no `localStorage` compartilhado entre usuários.

## Abordagem técnica e árvore de arquivos

Reutilizar o projeto `web-db-user`: React 19, TypeScript, Vite, Wouter, Express, tRPC, Drizzle ORM, MySQL gerenciado, `jose`, `cookie`, `mysql2`, Vitest, Framer Motion e Recharts. O backend será necessário em desenvolvimento e publicação. Manter credenciais do Manus/Google e a URL do banco somente no servidor. Fazer migrações MySQL determinísticas e aditivas; preservar `users`/histórico existente e nunca executar SQL destrutivo. A aplicação compartilha o MySQL entre Preview e publicado.

- `client/src/pages/Entry.tsx`: formulários reais de e-mail/senha, CTA Google, mensagens/localizações e onboarding com upload/preview/edição.
- `client/src/lib/auth.tsx` e `client/src/lib/api.ts`: contexto de sessão, fetch/tRPC com CSRF, estados de loading/erro e integração tipada.
- `client/src/lib/progress.tsx`: adaptador para meta, nós, tentativas e erros do usuário atual; estado demonstrativo não atravessa contas.
- `client/src/features/Trail.tsx`, `Questions.tsx`, `Profile.tsx` e `Dashboard.tsx`: consomem meta, trilha, gabarito e caderno persistidos. Preservar módulos ainda demonstrativos.
- `server/_core/index.ts`: Express serve Vite no desenvolvimento e `dist/public` na produção, com APIs montadas antes do fallback estático, rotas de saúde e OAuth.
- `server/_core/auth/`: hashing de senha, sessões opacas, proteção de cookie/CSRF e OAuth Google com state, nonce e PKCE.
- `server/ultra/`: serviços autenticados para metas/onboarding, armazenamento e verticalização, nó/progresso, questões/answer key e caderno de erros; validação no servidor e filtros por userId.
- `server/ultra/exams.ts`: extração de texto de provas PDF, análise estruturada do formato/estilo/pegadinhas e perfil de calibração associado à banca e ao cargo; a IA usa o perfil como referência de estilo e gera itens originais, sem reproduzir questões enviadas.
- `server/ultra/materials.ts`: geração validada por IA de mapa mental, resumo esquematizado e flashcards para tópicos pertencentes à meta do usuário.
- `server/ultra/schedule.ts`: cálculo e persistência de tarefas semanais de teoria, questões e revisões 24h/7d/15d/30d; replanejamento preserva histórico concluído.
- `server/routers.ts`: procedures públicas de autenticação e routers protegidos da UltraConcursos.
- `server/db.ts` e `drizzle/schema.ts`: persistência e ownership. Tabelas novas previstas: identidades, sessões, metas, documentos/metadados, disciplinas, nós, progresso, tentativas, caderno de erros e acervo de questões. IDs de usuário se relacionam à tabela existente sem remover ou redefinir contas.
- `drizzle/migrations/`: migrations SQL aditivas revisadas para autenticação, estudo, provas/calibração, materiais gerados e tarefas espaçadas, aplicadas sem truncar ou sobrescrever dados existentes.
- `client/public/sw.js`, `scripts/precache.mjs`: manter cache do shell e recursos versionados sem armazenar APIs autenticadas.
- `Dockerfile`, `package.json` e `app.config.ts`: compilação/execução Express+Vite/arquivos estáticos e configuração de publicação como container, sem publicar automaticamente.

## Integração e entrega

Habilitar `server:true` e `database:true` no projeto WebDev existente (habilitação é de mão única; mudança solicitada pelo usuário). Solicitar credenciais Google via formulário protegido. Implementar o backend, aplicar migrations aditivas, configurar o processo de Preview em `pnpm dev`, revisar rotas públicas APIs/estáticas e o contrato de container. Não habilitar auto-publicação nem executar publicação. Verificar autenticação, autorização, validação, scoring, extração/geração estruturada e migrations sem fazer inserts/limpezas de dados reais no banco partilhado. Rodar `pnpm check`, testes e builds disponíveis; executar revisão somente leitura especializada. Integrar sem sobrescrever trabalho concorrente e salvar o commit na `origin/main` como checkpoint, confirmando o SHA/cartão retornado. Direcionar a avaliação do app ao Preview, não a um URL direto.

## Etapa 3 — provas anteriores, fábrica de fixação e cronograma inteligente

- **Calibragem por prova anterior**: estudante ou administrador pode enviar PDF de uma prova associada a banca e cargo. Validar o PDF, extrair texto com limite e registrar owner, banca/cargo, hash e resultado da análise. O LLM identifica formato (CE/A–D/A–E), estrutura, estilo de cobrança e pegadinhas típicas em JSON validado. Usar o perfil salvo como referência obrigatória de estilo quando houver geração posterior de questões para a mesma combinação. Questões devem ser novas e não copiar itens do PDF.
- **Materiais por tópico**: exigir que tópico pertença ao edital ativo do usuário; gerar e validar mapa mental expansível, resumo esquematizado com foco em lei seca, prazos e tabelas, e flashcards com resposta e mnemônico. Persistir artefatos, modelo/versão, tópico, owner e datas; permitir regeneração explícita sem apagar o material anterior. Exibir loading, erro recuperável e conteúdo anterior enquanto nova geração acontece.
- **Cronograma adaptativo**: distribuir os tópicos da trilha nos dias disponíveis, respeitando horas por dia e alternando teoria, questões e revisões de 24h, 7d, 15d e 30d. Persistir tarefas, conclusão e origem do intervalo; recalcular tarefas pendentes sem modificar tarefas concluídas nem deslocar revisões já vencidas sem comunicar a mudança.
- **Dados/isolamento**: ampliar migrations Drizzle com provas e perfis de calibração, materiais, versões/flashcards e tarefas de estudo; cada consulta e alteração é vinculada ao usuário autenticado, com acesso administrativo limitado às funções de gerenciamento explicitamente autorizadas.

## Etapa 4 — simulados, redação por IA, ligas e monetização

- **Simulado cronometrado**: montar prova com duração, questões e formato definidos pela meta/edital. Persistir início, respostas e entrega por usuário; autoentregar ao encerrar o cronômetro. Calcular nota no servidor conforme a regra configurada para aquele concurso: quando o edital usar o modelo Cebraspe de anulação, correta = +1, errada = −1 e em branco = 0; outros editais podem ter regra própria, então a configuração confirmada no edital prevalece sobre o padrão da banca. A pontuação do cliente nunca é autoritativa.
- **Ranking semanal e ligas**: registrar no servidor XP elegível ganho por questões, ofensivas e simulados, com chaves de idempotência para impedir créditos repetidos. Criar classificação real semanal nacional e por concurso e ligas Bronze, Prata, Ouro e Diamante. A semana segue o calendário de São Paulo; nome público é pseudônimo/opt-in. Atualizar liga e promoção/rebaixamento no fechamento semanal, preservando histórico necessário para auditoria e privacidade.
- **Redação e discursiva com IA**: fornecer editor/folha pautada de exatamente 30 linhas e escolha de concurso/banca. Aplicar uma rubrica versionada para os critérios publicados no edital fornecido ou selecionado para a banca; a IA retorna nota discriminada, comentário e sugestões de reescrita. Preservar a redação em caso de falha e apresentar a correção como estimativa educacional, não como nota oficial da banca.
- **Planos e quotas**: Free permite até 10 questões novas por dia — revisões e refações não consomem esse limite — e 1 mapa mental por dia. Ultra Pro libera questões e simulados ilimitados, upload de provas em PDF e correção de redações. Validar limites no servidor de forma atômica, na zona America/Sao_Paulo, e registrar uso por usuário/dia; bloquear no ponto de consumo com mensagem amigável e CTA de upgrade. Mostrar banners suaves em Início e Perfil.
- **Stripe e entitlement**: usar a integração Stripe gerenciada pelo WebDev apenas para provisionar sandbox/credenciais e webhook. Criar Checkout Session no backend para usuário autenticado, com produto/preço centralizado e configuração ainda dependente de confirmação de preço, moeda, periodicidade e modo pelo proprietário. Persistir customer/subscription/price IDs, entitlement, eventos processados e registros mínimos de compra; validar assinatura sobre bytes originais do webhook e tratar reentregas idempotentemente. Só webhook validado concede, altera ou revoga Ultra Pro; nunca liberar Pro por retorno de Checkout/URL ou estado enviado pelo browser. Não guardar dados de cartão. Live keys e publicação permanecem sob controle explícito do proprietário.
- **Dependências**: simulados, redação, ligas e planos reais exigem antes autenticação, ownership, persistência e rotas backend da Etapa 2. Upload em PDF e provas/calibração dependem da Etapa 3. As telas atuais de redação e ranking continuam rotuladas como demonstração até essas APIs estarem implementadas e verificadas.

### Estrutura técnica complementar da Etapa 4

- `server/ultra/simulations.ts`: criação, sessão cronometrada, gravação de respostas e cálculo verificável da pontuação segundo o edital.
- `server/ultra/essays.ts`: validação de 30 linhas, seleção de rubrica e chamada server-side ao LLM com saída estruturada.
- `server/ultra/ranking.ts`: ledger de XP idempotente, snapshots semanais, ligas e consulta por concurso/nacional com nomes pseudônimos.
- `server/ultra/billing.ts` e `server/ultra/products.ts`: quotas/entitlements e criação server-side de Checkout Sessions; preços sem valor embutido até confirmação do proprietário.
- `server/_core/index.ts`: montar `/api/stripe/webhook` antes de parser JSON, preservando bytes exatos para verificação de assinatura; os outros endpoints autenticados permanecem depois do middleware de sessão/CSRF.
- `drizzle/migrations/`: adicionar, sem apagar dados, tabelas para tentativas/simulados, redações e correções, ledger de XP/ligas, uso diário, clientes/assinaturas, entitlements e IDs de eventos Stripe processados.
