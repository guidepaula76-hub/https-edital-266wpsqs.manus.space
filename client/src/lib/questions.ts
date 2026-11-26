export type ExamFormat = "CE" | "AD" | "AE";
export type Difficulty = "Fácil" | "Médio" | "Difícil";

export interface DemoQuestion {
  id: string;
  subject: string;
  topic: string;
  board: string;
  difficulty: Difficulty;
  level: 1 | 2;
  lessonIndex: number;
  prompt: string;
  choices: [string, string, string, string, string];
  correctOption: "A" | "B" | "C" | "D" | "E";
  statementIsTrue: boolean;
  explanation: string;
  trap: string;
}

export interface AnswerChoice {
  value: string;
  label: string;
  text: string;
}

export const BOARD_FORMATS: Record<string, ExamFormat> = {
  Cebraspe: "CE",
  Quadrix: "CE",
  IBFC: "AD",
  FGV: "AE",
  FCC: "AE",
  Vunesp: "AE",
  Cesgranrio: "AE",
};

export const BOARD_NAMES = Object.keys(BOARD_FORMATS);
export const FORMAT_NAMES: Record<ExamFormat, string> = {
  CE: "Certo / Errado",
  AD: "Múltipla escolha · A–D",
  AE: "Múltipla escolha · A–E",
};

export const LESSON_TITLES = [
  "Língua Portuguesa",
  "Direito Administrativo",
  "Direito Constitucional",
  "Seguridade Social",
  "Raciocínio Lógico",
  "Ética e Informática",
];

const makeQuestion = (
  id: string,
  subject: string,
  topic: string,
  board: string,
  difficulty: Difficulty,
  level: 1 | 2,
  lessonIndex: number,
  prompt: string,
  choices: [string, string, string, string, string],
  correctOption: DemoQuestion["correctOption"],
  statementIsTrue: boolean,
  explanation: string,
  trap: string
): DemoQuestion => ({
  id,
  subject,
  topic,
  board,
  difficulty,
  level,
  lessonIndex,
  prompt,
  choices,
  correctOption,
  statementIsTrue,
  explanation,
  trap,
});

/**
 * Banco inteiramente fictício para demonstração da interface. Não representa
 * questões oficiais, nem respostas produzidas por um modelo de IA.
 */
export const DEMO_QUESTIONS: DemoQuestion[] = [
  // Trilha 1 · Língua Portuguesa · nível 1
  makeQuestion(
    "demo-portugues-2",
    "Língua Portuguesa",
    "Interpretação de texto",
    "Cebraspe",
    "Médio",
    1,
    0,
    "No período “Embora o edital tenha sido publicado, a equipe ainda revisava o cronograma”, a conjunção “embora” introduz uma ideia de concessão.",
    [
      "A oração subordinada expressa uma condição necessária.",
      "A conjunção introduz uma concessão, isto é, uma ressalva que não impede o fato principal.",
      "A conjunção estabelece uma conclusão.",
      "O termo funciona como pronome relativo.",
      "A conjunção introduz uma explicação causal.",
    ],
    "B",
    true,
    "“Embora” é uma conjunção subordinativa concessiva. A publicação do edital não impediu que a equipe continuasse revisando o cronograma.",
    "A banca costuma aproximar concessão de causa ou condição. Aqui, a relação é de contraste com expectativa, não de causa nem de requisito."
  ),
  makeQuestion(
    "pt-interpretacao-1",
    "Língua Portuguesa",
    "Coesão e coerência",
    "FCC",
    "Fácil",
    1,
    0,
    "Em “A comissão publicou o aviso; esse documento também informa o prazo”, a expressão “esse documento” retoma o aviso mencionado anteriormente.",
    [
      "Retoma a comissão.",
      "Retoma o prazo.",
      "Retoma o aviso.",
      "Introduz um referente novo.",
      "Retoma uma informação implícita.",
    ],
    "C",
    true,
    "O demonstrativo “esse” retoma anaforicamente o substantivo “aviso”, apresentado na oração anterior.",
    "O distrator mais provável é “prazo”, por ser um substantivo próximo. A retomada, porém, recai sobre o documento publicado."
  ),
  makeQuestion(
    "pt-gramatica-1",
    "Língua Portuguesa",
    "Concordância verbal",
    "Cebraspe",
    "Médio",
    1,
    0,
    "A frase “Fazem três meses que o curso começou” está de acordo com a norma-padrão, pois o verbo concorda com “três meses”.",
    [
      "A forma “fazem” é obrigatória em qualquer referência temporal.",
      "O verbo “fazer”, indicando tempo decorrido, fica no singular.",
      "O sujeito da oração é “três meses”.",
      "A concordância é facultativa nesse caso.",
      "A frase está correta porque o verbo é auxiliar.",
    ],
    "B",
    false,
    "Na indicação de tempo decorrido, “fazer” é impessoal e permanece na terceira pessoa do singular: “Faz três meses”.",
    "A expressão plural de tempo induz à concordância no plural. O verbo impessoal não concorda com essa expressão."
  ),

  // Trilha 1 · Língua Portuguesa · nível 2 (questões inéditas em relação ao nível 1)
  makeQuestion(
    "pt-n2-0-1",
    "Língua Portuguesa",
    "Regência e crase",
    "FGV",
    "Difícil",
    2,
    0,
    "No trecho “A servidora assistiu à sessão e, depois, aspirou ao cargo”, os dois empregos da preposição estão adequados à regência dos verbos no sentido apresentado.",
    [
      "“Assistir” não admite preposição nesse sentido.",
      "“Aspirar” significa respirar e, portanto, rege objeto direto.",
      "“Assistir a” (presenciar) e “aspirar a” (almejar) regem preposição.",
      "Só o primeiro emprego está correto.",
      "Só o segundo emprego está correto.",
    ],
    "C",
    true,
    "“Assistir”, no sentido de presenciar, rege a preposição “a”; “aspirar”, no sentido de almejar, também rege “a”. A crase ocorre diante de “sessão” com artigo feminino.",
    "A armadilha é trocar o sentido do verbo: “aspirar” pode significar respirar (sem preposição) ou almejar (com preposição)."
  ),
  makeQuestion(
    "pt-n2-0-2",
    "Língua Portuguesa",
    "Pontuação",
    "Vunesp",
    "Difícil",
    2,
    0,
    "Em “Os candidatos que entregaram os documentos no prazo foram convocados”, as vírgulas são obrigatórias por se tratar de oração adjetiva explicativa.",
    [
      "A oração é explicativa e as vírgulas são obrigatórias.",
      "A oração é restritiva; sem vírgulas, delimita quais candidatos foram convocados.",
      "O período contém oração coordenada sindética.",
      "A vírgula é obrigatória apenas depois de “prazo”.",
      "A oração é subordinada adverbial causal.",
    ],
    "B",
    false,
    "Sem vírgulas, a oração adjetiva “que entregaram os documentos no prazo” é restritiva: identifica o subconjunto de candidatos convocados.",
    "Uma única vírgula alteraria o sentido para explicativo. Observe a diferença semântica, não apenas o tamanho da oração."
  ),
  makeQuestion(
    "pt-n2-0-3",
    "Língua Portuguesa",
    "Pronomes e colocação",
    "Cebraspe",
    "Difícil",
    2,
    0,
    "Em “Não se divulgaram os resultados antes da homologação”, a palavra negativa “não” atrai o pronome átono para antes do verbo.",
    [
      "A próclise ocorre por causa da palavra negativa.",
      "A ênclise é obrigatória após qualquer advérbio.",
      "O pronome deveria ser colocado depois de “resultados”.",
      "Não há verbo acompanhado de pronome.",
      "A mesóclise é obrigatória no presente do indicativo.",
    ],
    "A",
    true,
    "A palavra negativa “não” é fator de próclise. A construção “Não se divulgaram...” está de acordo com a colocação pronominal padrão.",
    "A banca pode sugerir que o sujeito plural exige ênclise. A concordância verbal não elimina a atração exercida pela palavra negativa."
  ),

  // Trilha 2 · Direito Administrativo · nível 1
  makeQuestion(
    "demo-admin-1",
    "Direito Administrativo",
    "Atos administrativos",
    "Cebraspe",
    "Médio",
    1,
    1,
    "A Administração pode revogar um ato administrativo ilegal por razões de conveniência e oportunidade.",
    [
      "A revogação corrige ilegalidade e tem efeitos retroativos.",
      "A Administração anula atos ilegais e revoga atos válidos por conveniência e oportunidade.",
      "A revogação depende sempre de decisão judicial.",
      "Atos vinculados podem ser livremente revogados por mérito.",
      "Anulação e revogação são sinônimos.",
    ],
    "B",
    false,
    "A proposição está errada: a ilegalidade leva à anulação; a revogação incide sobre ato válido, por razões de mérito administrativo, respeitados direitos adquiridos.",
    "A troca entre “anular” e “revogar” é uma pegadinha recorrente. Lembre-se: legalidade → anulação; conveniência e oportunidade → revogação."
  ),
  makeQuestion(
    "adm-atos-1",
    "Direito Administrativo",
    "Poderes administrativos",
    "Quadrix",
    "Fácil",
    1,
    1,
    "O poder de polícia permite à Administração condicionar ou restringir o exercício de direitos individuais em benefício do interesse público, nos limites legais.",
    [
      "Permite restrições sem previsão ou limite legal.",
      "É exercido exclusivamente pelo Poder Judiciário.",
      "Pode condicionar direitos nos limites da lei e do interesse público.",
      "Só alcança servidores públicos.",
      "É sinônimo de poder disciplinar.",
    ],
    "C",
    true,
    "O poder de polícia limita ou disciplina direitos, interesses ou liberdades em razão de interesse público, sempre com fundamento e limites legais.",
    "A banca pode transformar a finalidade pública em autorização ilimitada. A atuação continua sujeita à lei, proporcionalidade e controle."
  ),
  makeQuestion(
    "adm-poderes-1",
    "Direito Administrativo",
    "Responsabilidade civil do Estado",
    "Cebraspe",
    "Médio",
    1,
    1,
    "Em regra, a responsabilidade civil objetiva do Estado por danos causados por seus agentes exige a demonstração de dolo do agente público.",
    [
      "A responsabilidade objetiva exige prova de dolo.",
      "A responsabilidade objetiva, em regra, dispensa a prova de dolo ou culpa do agente.",
      "A vítima deve provar apenas a culpa exclusiva do Estado.",
      "A responsabilidade é sempre subjetiva.",
      "O nexo causal é irrelevante.",
    ],
    "B",
    false,
    "A responsabilidade objetiva prevista no art. 37, § 6º, da Constituição exige conduta estatal, dano e nexo causal; não depende da prova de dolo ou culpa do agente.",
    "Não confunda o dever de indenizar da pessoa jurídica com eventual ação regressiva, na qual se apura dolo ou culpa do agente."
  ),

  // Trilha 2 · Direito Administrativo · nível 2
  makeQuestion(
    "adm-n2-1-1",
    "Direito Administrativo",
    "Atos administrativos",
    "FGV",
    "Difícil",
    2,
    1,
    "A convalidação pode corrigir determinados vícios sanáveis de competência ou forma, desde que não haja lesão ao interesse público nem prejuízo a terceiros.",
    [
      "Qualquer vício, inclusive de finalidade, é convalidável.",
      "A convalidação é possível para certos vícios sanáveis, observados os limites legais.",
      "A convalidação sempre depende de sentença judicial.",
      "O ato convalidado passa a ser discricionário.",
      "A convalidação é vedada para qualquer ato administrativo.",
    ],
    "B",
    true,
    "A convalidação pode sanar vícios sanáveis, em especial de competência não exclusiva e forma não essencial, desde que preservados o interesse público e terceiros.",
    "“Qualquer vício” é uma generalização indevida. Competência exclusiva, finalidade e objeto ilícito não se tornam válidos pela convalidação."
  ),
  makeQuestion(
    "adm-n2-1-2",
    "Direito Administrativo",
    "Processo administrativo",
    "FCC",
    "Difícil",
    2,
    1,
    "Na Lei nº 9.784/1999, a motivação deve ser explícita, clara e congruente nos atos que neguem ou afetem direitos ou interesses.",
    [
      "A motivação é dispensada sempre que houver discricionariedade.",
      "A lei prevê motivação explícita, clara e congruente para atos que afetem direitos ou interesses.",
      "A motivação pode ser substituída por silêncio administrativo em qualquer hipótese.",
      "A motivação é exigida apenas em atos normativos.",
      "A motivação precisa indicar somente a autoridade competente.",
    ],
    "B",
    true,
    "A Lei nº 9.784/1999 exige motivação, com indicação dos fatos e fundamentos jurídicos, em hipóteses como a afetação de direitos ou interesses.",
    "Discricionariedade não significa ausência de motivação. O mérito pode ser discricionário, mas a decisão deve expor seus fundamentos."
  ),
  makeQuestion(
    "adm-n2-1-3",
    "Direito Administrativo",
    "Licitações",
    "IBFC",
    "Difícil",
    2,
    1,
    "Na Lei nº 14.133/2021, o diálogo competitivo é modalidade de licitação destinada a objetos em que a Administração precise dialogar para desenvolver alternativas capazes de atender à necessidade pública.",
    [
      "É modalidade destinada exclusivamente à compra de bens comuns.",
      "Prevê diálogo com licitantes pré-selecionados para desenvolver soluções e posterior apresentação de propostas.",
      "Dispensa a fase competitiva em qualquer caso.",
      "É sinônimo de concurso para trabalho técnico.",
      "Não integra as modalidades previstas na Lei nº 14.133/2021.",
    ],
    "B",
    true,
    "O diálogo competitivo é modalidade da Lei nº 14.133/2021 para contratações complexas, em que o diálogo com licitantes pré-selecionados auxilia a identificar soluções.",
    "Não confunda modalidade com critério de julgamento, nem conclua que o diálogo elimina a competição: há fase posterior de propostas."
  ),

  // Trilha 3 · Direito Constitucional · nível 1
  makeQuestion(
    "const-org-1",
    "Direito Constitucional",
    "Organização do Estado",
    "Quadrix",
    "Fácil",
    1,
    2,
    "A República Federativa do Brasil é formada pela união indissolúvel dos Estados, Municípios e do Distrito Federal.",
    [
      "A União pode dissolver unilateralmente um Estado.",
      "Os Municípios não integram a Federação.",
      "A federação brasileira compreende Estados, Municípios e Distrito Federal, em união indissolúvel.",
      "O Distrito Federal pode ser dividido em Municípios.",
      "A forma de Estado brasileira é unitária.",
    ],
    "C",
    true,
    "O art. 1º da Constituição define a República Federativa do Brasil como união indissolúvel dos Estados, Municípios e Distrito Federal.",
    "Não confunda forma de Estado (federação) com forma de governo (república); são classificações diferentes."
  ),
  makeQuestion(
    "const-direitos-1",
    "Direito Constitucional",
    "Direitos e garantias fundamentais",
    "Cebraspe",
    "Médio",
    1,
    2,
    "O habeas data pode ser utilizado para assegurar conhecimento de informações relativas à pessoa do impetrante, constantes de registros de entidades governamentais ou de caráter público.",
    [
      "Protege exclusivamente a liberdade de locomoção.",
      "Permite conhecer informações pessoais em registros governamentais ou de caráter público.",
      "Serve para substituir qualquer recurso administrativo.",
      "Só pode ser impetrado por pessoa jurídica.",
      "Exige prova de ameaça à liberdade física.",
    ],
    "B",
    true,
    "O habeas data protege o acesso a informações pessoais em bancos de dados governamentais ou de caráter público e também admite retificação, nos termos constitucionais.",
    "A associação usual “locomoção = habeas corpus” não deve ser confundida com “dados pessoais = habeas data”."
  ),
  makeQuestion(
    "const-remedios-1",
    "Direito Constitucional",
    "Remédios constitucionais",
    "Cebraspe",
    "Médio",
    1,
    2,
    "O mandado de segurança protege direito líquido e certo não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade for autoridade pública ou agente no exercício de atribuições públicas.",
    [
      "Protege qualquer direito que dependa de dilação probatória.",
      "É cabível para proteger liberdade de locomoção.",
      "Pode proteger direito líquido e certo nos termos da Constituição.",
      "Substitui habeas data para acesso a dados pessoais.",
      "Só é cabível contra particulares sem função pública.",
    ],
    "C",
    true,
    "O mandado de segurança tutela direito líquido e certo, comprovável de plano, quando não houver cabimento de habeas corpus ou habeas data.",
    "A exigência de prova pré-constituída não significa que o direito não possa ser reconhecido; significa que a prova não é produzida em dilação no rito."
  ),

  // Trilha 3 · Direito Constitucional · nível 2
  makeQuestion(
    "const-n2-2-1",
    "Direito Constitucional",
    "Controle de constitucionalidade",
    "FGV",
    "Difícil",
    2,
    2,
    "No controle concentrado abstrato perante o STF, a ação direta de inconstitucionalidade pode ter por objeto lei ou ato normativo federal ou estadual em face da Constituição Federal.",
    [
      "A ADI no STF tem por objeto lei municipal em face da Constituição Federal.",
      "A ADI pode impugnar lei ou ato normativo federal ou estadual perante a Constituição Federal.",
      "A ADI só pode ser ajuizada pelo Presidente da República.",
      "O controle concentrado não produz decisões abstratas.",
      "A ADI é recurso contra sentença de primeiro grau.",
    ],
    "B",
    true,
    "A Constituição atribui ao STF o julgamento da ADI de lei ou ato normativo federal ou estadual em face da Constituição Federal.",
    "A lei municipal não é objeto de ADI no STF em face da Constituição Federal, embora existam outras vias de controle."
  ),
  makeQuestion(
    "const-n2-2-2",
    "Direito Constitucional",
    "Poder Legislativo",
    "FCC",
    "Difícil",
    2,
    2,
    "As comissões parlamentares de inquérito possuem poderes de investigação próprios das autoridades judiciais, além de outros previstos nos regimentos das respectivas Casas.",
    [
      "Podem decretar condenação criminal definitiva.",
      "Possuem poderes investigatórios constitucionais, mas não substituem o julgamento judicial.",
      "Podem impor qualquer medida sujeita à reserva de jurisdição.",
      "Não podem investigar fato determinado.",
      "São órgãos do Poder Judiciário.",
    ],
    "B",
    true,
    "A Constituição confere às CPIs poderes de investigação próprios das autoridades judiciais, mas elas não proferem condenação nem exercem jurisdição.",
    "A expressão “poderes próprios” não equivale a todos os poderes judiciais; medidas sujeitas à reserva de jurisdição têm limites."
  ),
  makeQuestion(
    "const-n2-2-3",
    "Direito Constitucional",
    "Direitos fundamentais",
    "Cebraspe",
    "Difícil",
    2,
    2,
    "A Constituição admite que direitos fundamentais sejam exercidos sem qualquer possibilidade de restrição legal ou ponderação em caso de colisão.",
    [
      "Direitos fundamentais são absolutos e nunca admitem colisão.",
      "A colisão entre direitos pode exigir harmonização, observados os parâmetros constitucionais.",
      "A ponderação autoriza abolir cláusulas pétreas.",
      "Somente lei ordinária define o conteúdo da Constituição.",
      "Direitos fundamentais não têm aplicabilidade.",
    ],
    "B",
    false,
    "Direitos fundamentais não são, em regra, absolutos. Colisões podem exigir concordância prática e análise proporcional, sem abolir o núcleo constitucional.",
    "Palavras como “qualquer” e “sem possibilidade” costumam tornar a afirmação absoluta demais."
  ),

  // Trilha 4 · Seguridade Social · nível 1
  makeQuestion(
    "prev-seguridade-1",
    "Seguridade Social",
    "Conceito de seguridade",
    "Cebraspe",
    "Fácil",
    1,
    3,
    "A seguridade social compreende um conjunto integrado de ações relativas à saúde, à previdência social e à assistência social.",
    [
      "Compreende apenas previdência e assistência.",
      "Inclui saúde, previdência social e assistência social.",
      "É sinônimo exclusivo de seguro-desemprego.",
      "A saúde é excluída da seguridade social.",
      "Abrange apenas benefícios contributivos.",
    ],
    "B",
    true,
    "Nos termos do art. 194 da Constituição, a seguridade social compreende saúde, previdência e assistência social.",
    "A previdência tem caráter contributivo, mas isso não torna contributivas todas as áreas da seguridade."
  ),
  makeQuestion(
    "prev-assistencia-1",
    "Seguridade Social",
    "Assistência social",
    "IBFC",
    "Médio",
    1,
    3,
    "A assistência social será prestada a quem dela necessitar, independentemente de contribuição à seguridade social.",
    [
      "Depende de contribuições mensais prévias.",
      "É direito restrito a segurados empregados.",
      "Independe de contribuição, conforme previsão constitucional.",
      "É prestada somente a aposentados.",
      "Substitui integralmente a previdência social.",
    ],
    "C",
    true,
    "A Constituição prevê que a assistência social será prestada a quem dela necessitar, independentemente de contribuição.",
    "Não generalize essa característica para a previdência social, que possui caráter contributivo."
  ),
  makeQuestion(
    "prev-rgps-1",
    "Seguridade Social",
    "Regime Geral de Previdência Social",
    "Quadrix",
    "Médio",
    1,
    3,
    "A previdência social, no Regime Geral, possui caráter contributivo e filiação obrigatória para as pessoas abrangidas pelo regime.",
    [
      "O RGPS é não contributivo e facultativo para todos.",
      "A previdência social tem caráter contributivo e filiação obrigatória nos termos legais.",
      "A filiação obrigatória depende de autorização judicial.",
      "O RGPS integra o Poder Judiciário.",
      "O caráter contributivo impede a cobertura de riscos sociais.",
    ],
    "B",
    true,
    "O art. 201 da Constituição caracteriza a previdência social como contributiva, observados critérios que preservem o equilíbrio financeiro e atuarial.",
    "“Filiação obrigatória” não significa que toda pessoa esteja automaticamente vinculada: depende do enquadramento legal."
  ),

  // Trilha 4 · Seguridade Social · nível 2
  makeQuestion(
    "prev-n2-3-1",
    "Seguridade Social",
    "Benefícios previdenciários",
    "FCC",
    "Difícil",
    2,
    3,
    "O reconhecimento de tempo de contribuição fictício para concessão de benefícios do Regime Geral de Previdência Social é admitido sempre que beneficiar o segurado.",
    [
      "O tempo fictício é sempre admitido por favorecer o segurado.",
      "A Constituição veda contagem de tempo de contribuição fictício para concessão de benefícios previdenciários.",
      "A vedação aplica-se somente à assistência social.",
      "O tema não possui previsão constitucional.",
      "O tempo fictício é exigido para aposentadoria.",
    ],
    "B",
    false,
    "O art. 201, § 14, da Constituição veda a contagem de tempo de contribuição fictício para efeito de concessão de benefícios previdenciários.",
    "O apelo à proteção do segurado não afasta uma vedação constitucional expressa."
  ),
  makeQuestion(
    "prev-n2-3-2",
    "Seguridade Social",
    "Custeio da seguridade",
    "Cebraspe",
    "Difícil",
    2,
    3,
    "A seguridade social será financiada por toda a sociedade, de forma direta e indireta, nos termos da lei e mediante recursos dos orçamentos e contribuições sociais.",
    [
      "O custeio cabe exclusivamente aos empregados.",
      "A Constituição prevê financiamento por toda a sociedade, direto e indireto.",
      "Apenas a União pode financiar a seguridade.",
      "Contribuições sociais não podem integrar o custeio.",
      "O orçamento fiscal é vedado para essa finalidade.",
    ],
    "B",
    true,
    "O art. 195 da Constituição prevê que a seguridade social será financiada por toda a sociedade, de forma direta e indireta.",
    "A banca pode reduzir o custeio a uma única fonte. A Constituição distribui o financiamento entre diversas fontes previstas em lei."
  ),
  makeQuestion(
    "prev-n2-3-3",
    "Seguridade Social",
    "Princípios da seguridade",
    "IBFC",
    "Difícil",
    2,
    3,
    "O princípio da equidade na forma de participação no custeio permite considerar a capacidade econômica dos contribuintes na distribuição do financiamento.",
    [
      "Equidade exige contribuição idêntica em valor para todos.",
      "A participação no custeio pode considerar a capacidade econômica, nos termos constitucionais.",
      "O princípio dispensa previsão legal.",
      "O custeio é exclusivo dos beneficiários da previdência.",
      "Equidade significa ausência de financiamento público.",
    ],
    "B",
    true,
    "A equidade na forma de participação no custeio é objetivo constitucional e orienta a distribuição do financiamento segundo critérios legais.",
    "Equidade não é sinônimo de igualdade aritmética. A forma de participação pode considerar diferenças relevantes definidas em lei."
  ),

  // Trilha 5 · Raciocínio Lógico · nível 1
  makeQuestion(
    "logica-proporcao-1",
    "Raciocínio Lógico",
    "Porcentagem",
    "Cesgranrio",
    "Fácil",
    1,
    4,
    "Um material de R$ 80 recebeu desconto de 25%. O preço após o desconto é R$ 60.",
    ["R$ 20", "R$ 55", "R$ 60", "R$ 65", "R$ 75"],
    "C",
    true,
    "25% de R$ 80 equivale a R$ 20. Subtraindo o desconto, o preço final é R$ 80 − R$ 20 = R$ 60.",
    "O valor do desconto é R$ 20, não o preço final. Leia com atenção se a pergunta pede o abatimento ou o total."
  ),
  makeQuestion(
    "logica-conjuntos-1",
    "Raciocínio Lógico",
    "Conjuntos",
    "Quadrix",
    "Médio",
    1,
    4,
    "Em uma turma de 30 pessoas, 18 estudam Português, 14 estudam Direito e 6 estudam ambas as matérias. Então 26 estudam ao menos uma das duas.",
    ["12 pessoas.", "18 pessoas.", "20 pessoas.", "26 pessoas.", "32 pessoas."],
    "D",
    true,
    "Pelo princípio da inclusão-exclusão: 18 + 14 − 6 = 26 pessoas estudam ao menos uma das matérias.",
    "Somar 18 e 14 sem subtrair as 6 pessoas contadas duas vezes levaria ao resultado incorreto de 32."
  ),
  makeQuestion(
    "logica-sequencias-1",
    "Raciocínio Lógico",
    "Sequências",
    "Cebraspe",
    "Médio",
    1,
    4,
    "Na sequência 3, 7, 11, 15, ... cada termo, a partir do segundo, é obtido somando-se 4 ao termo anterior.",
    [
      "A razão entre termos é 4.",
      "A sequência é uma progressão aritmética de razão 4.",
      "A sequência é geométrica de razão 4.",
      "O próximo termo é 18.",
      "A diferença entre termos varia.",
    ],
    "B",
    true,
    "A diferença entre termos consecutivos é constante e igual a 4; portanto, trata-se de uma progressão aritmética com razão 4.",
    "A razão de uma PA é a diferença, não o quociente entre termos."
  ),

  // Trilha 5 · Raciocínio Lógico · nível 2
  makeQuestion(
    "logica-n2-4-1",
    "Raciocínio Lógico",
    "Probabilidade",
    "FGV",
    "Difícil",
    2,
    4,
    "Ao lançar um dado honesto de seis faces, a probabilidade de obter um número par ou maior que 4 é 2/3.",
    ["1/6", "1/3", "1/2", "2/3", "5/6"],
    "D",
    true,
    "Os resultados pares são {2, 4, 6}; os maiores que 4 são {5, 6}. A união é {2, 4, 5, 6}: 4 de 6 resultados, ou 2/3.",
    "“Ou” inclusivo inclui o 6, que satisfaz as duas condições; não conte esse resultado duas vezes."
  ),
  makeQuestion(
    "logica-n2-4-2",
    "Raciocínio Lógico",
    "Proposições",
    "Cebraspe",
    "Difícil",
    2,
    4,
    "A negação de “Todos os candidatos entregaram o documento” é “Nenhum candidato entregou o documento”.",
    [
      "A negação é “Nenhum candidato entregou o documento”.",
      "A negação é “Pelo menos um candidato não entregou o documento”.",
      "A negação é “Todos não entregaram”.",
      "A negação é “Alguns entregaram e alguns não”.",
      "A frase não admite negação lógica.",
    ],
    "B",
    false,
    "A negação de uma proposição universal “todos P” é existencial: “existe ao menos um que não P”.",
    "Trocar “todos” por “nenhum” é incorreto; a negação não afirma o comportamento de todos, apenas a existência de uma exceção."
  ),
  makeQuestion(
    "logica-n2-4-3",
    "Raciocínio Lógico",
    "Equivalências lógicas",
    "FCC",
    "Difícil",
    2,
    4,
    "A proposição condicional “Se estudo, então sou aprovado” é logicamente equivalente a “Se não sou aprovado, então não estudo”.",
    [
      "É equivalente à sua recíproca.",
      "É equivalente à contrapositiva apresentada.",
      "É equivalente à negação da antecedente.",
      "É equivalente à conjunção das proposições.",
      "Não há equivalência entre as duas frases.",
    ],
    "B",
    true,
    "Uma condicional P → Q é equivalente à sua contrapositiva ¬Q → ¬P. A frase apresentada segue essa equivalência.",
    "A recíproca Q → P não é equivalente em geral. Inverta e negue as duas partes para obter a contrapositiva."
  ),

  // Trilha 6 · Ética e Informática · nível 1
  makeQuestion(
    "etica-publica-1",
    "Ética e Informática",
    "Ética no serviço público",
    "Cebraspe",
    "Fácil",
    1,
    5,
    "A atuação ética no serviço público envolve tratar o cidadão com respeito e observar os princípios que regem a Administração Pública.",
    [
      "A ética pública se limita à vida privada do agente.",
      "O respeito ao cidadão e os princípios administrativos orientam a atuação pública.",
      "A legalidade pode ser afastada por preferência pessoal.",
      "A eficiência autoriza violar direitos.",
      "A ética é incompatível com transparência.",
    ],
    "B",
    true,
    "A ética pública orienta a conduta no exercício da função e deve ser compatível com os princípios constitucionais da Administração Pública.",
    "Eficiência e interesse público não são autorização para afastar legalidade, impessoalidade ou direitos fundamentais."
  ),
  makeQuestion(
    "info-seguranca-1",
    "Ética e Informática",
    "Segurança da informação",
    "Quadrix",
    "Médio",
    1,
    5,
    "Uma senha forte deve ser compartilhada com colegas de confiança para evitar que o trabalho seja interrompido em caso de ausência.",
    [
      "O compartilhamento é recomendado se houver confiança.",
      "Senhas devem ser pessoais e não compartilhadas; use os mecanismos autorizados de acesso.",
      "A senha deve ser anotada em local público.",
      "A mesma senha deve ser usada em todos os serviços.",
      "A autenticação multifator reduz a segurança.",
    ],
    "B",
    false,
    "Credenciais são pessoais e não devem ser compartilhadas. A continuidade do serviço deve usar procedimentos e acessos autorizados.",
    "Confiança pessoal não substitui controle de acesso. Compartilhar senha elimina rastreabilidade e aumenta o risco."
  ),
  makeQuestion(
    "etica-sigilo-1",
    "Ética e Informática",
    "Transparência e sigilo",
    "IBFC",
    "Médio",
    1,
    5,
    "O servidor pode divulgar livremente dados pessoais de cidadãos sempre que acreditar que a divulgação é de interesse público.",
    [
      "A divulgação é livre se a intenção for boa.",
      "Dados pessoais exigem tratamento conforme a lei e não podem ser divulgados sem fundamento.",
      "O interesse público nunca pode ser considerado.",
      "A publicidade elimina qualquer dever de proteção.",
      "A divulgação depende apenas de autorização verbal.",
    ],
    "B",
    false,
    "A publicidade administrativa convive com a proteção de dados pessoais e outras hipóteses legais de sigilo. É necessário fundamento e tratamento adequado.",
    "Não confunda publicidade dos atos com exposição irrestrita de dados pessoais."
  ),

  // Trilha 6 · Ética e Informática · nível 2
  makeQuestion(
    "etica-n2-5-1",
    "Ética e Informática",
    "Proteção de dados",
    "FGV",
    "Difícil",
    2,
    5,
    "O princípio da necessidade, na proteção de dados pessoais, orienta a limitação do tratamento ao mínimo necessário para a finalidade informada.",
    [
      "Permite coletar qualquer dado que possa ser útil no futuro.",
      "Limita o tratamento ao mínimo necessário para a finalidade.",
      "Dispensa a definição de finalidade.",
      "Aplica-se somente a dados anonimizados.",
      "Impede todo tratamento de dados pessoais.",
    ],
    "B",
    true,
    "O princípio da necessidade limita o tratamento ao mínimo necessário para cumprir suas finalidades, abrangendo dados pertinentes, proporcionais e não excessivos.",
    "Não confunda necessidade com proibição total. O tratamento pode ocorrer, mas deve respeitar adequação e minimização."
  ),
  makeQuestion(
    "etica-n2-5-2",
    "Ética e Informática",
    "Segurança digital",
    "Cesgranrio",
    "Difícil",
    2,
    5,
    "Uma mensagem que solicita senha por e-mail e exige resposta imediata apresenta sinais compatíveis com tentativa de phishing.",
    [
      "A mensagem é segura porque usa e-mail corporativo.",
      "Urgência e pedido de credenciais são sinais de alerta; confirme por canal oficial.",
      "O phishing ocorre apenas por ligações telefônicas.",
      "Basta abrir o link para verificar sua autenticidade.",
      "A senha pode ser enviada se o remetente for conhecido.",
    ],
    "B",
    true,
    "Solicitações inesperadas de credenciais, pressão por urgência e links suspeitos são sinais comuns de phishing. Confirme a solicitação por canal oficial.",
    "Nome ou endereço aparente do remetente pode ser falsificado; não confie apenas na identidade exibida."
  ),
  makeQuestion(
    "etica-n2-5-3",
    "Ética e Informática",
    "Conduta e conflito de interesses",
    "Cebraspe",
    "Difícil",
    2,
    5,
    "A transparência e a prestação de contas no setor público são incompatíveis com a proteção de informações legalmente sigilosas.",
    [
      "Transparência obriga divulgar até informação legalmente sigilosa.",
      "Transparência e proteção de sigilo legal coexistem, com divulgação nos limites da lei.",
      "A prestação de contas é facultativa.",
      "O sigilo depende apenas da decisão informal do agente.",
      "A informação pública não pode ser acessada por cidadãos.",
    ],
    "B",
    false,
    "Transparência e accountability convivem com exceções legais de acesso e com a proteção de informações pessoais e sigilosas.",
    "A afirmação transforma dois princípios complementares em uma oposição absoluta."
  ),
];

export function formatForBoard(board: string | undefined): ExamFormat {
  if (!board) return "CE";
  const normalized = board.trim().toLocaleLowerCase("pt-BR");
  const match = Object.entries(BOARD_FORMATS).find(
    ([name]) => name.toLocaleLowerCase("pt-BR") === normalized
  );
  return match?.[1] ?? "CE";
}

export function getQuestionChoices(
  question: DemoQuestion,
  format: ExamFormat
): AnswerChoice[] {
  if (format === "CE") {
    return [
      { value: "Certo", label: "Certo", text: "A afirmação está correta." },
      { value: "Errado", label: "Errado", text: "A afirmação está incorreta." },
    ];
  }
  const count = format === "AD" ? 4 : 5;
  return question.choices.slice(0, count).map((text, index) => {
    const letter = String.fromCharCode(65 + index);
    return { value: letter, label: letter, text };
  });
}

export function getCorrectAnswer(
  question: DemoQuestion,
  format: ExamFormat
): string {
  return format === "CE"
    ? question.statementIsTrue
      ? "Certo"
      : "Errado"
    : question.correctOption;
}

export function getQuestionById(id: string): DemoQuestion | undefined {
  return DEMO_QUESTIONS.find(question => question.id === id);
}

export function getLessonQuestions(
  level: 1 | 2,
  lessonIndex: number
): DemoQuestion[] {
  return DEMO_QUESTIONS.filter(
    question => question.level === level && question.lessonIndex === lessonIndex
  );
}

export interface AnswerRationale extends AnswerChoice {
  correct: boolean;
  rationale: string;
}

const CHOICE_RATIONALES: Record<
  string,
  readonly [string, string, string, string, string]
> = {
  "demo-portugues-2": [
    "Condição apresenta requisito; ‘embora’ introduz concessão.",
    "É a definição correta de concessão no período.",
    "Não há conclusão: a oração ressalva uma expectativa.",
    "‘Embora’ é conjunção, não pronome relativo.",
    "A oração não explica a causa da revisão do cronograma.",
  ],
  "pt-interpretacao-1": [
    "A comissão é quem publicou o aviso, não o referente do demonstrativo.",
    "O prazo é uma informação do documento, não o documento retomado.",
    "Correto: ‘esse documento’ retoma ‘o aviso’.",
    "O referente já apareceu no período anterior.",
    "Não há referente implícito: ‘aviso’ está expresso.",
  ],
  "pt-gramatica-1": [
    "Em tempo decorrido, ‘fazer’ é impessoal e fica no singular.",
    "Correto: a forma normativa é ‘Faz três meses’.",
    "‘Três meses’ indica tempo decorrido; não é sujeito do verbo impessoal.",
    "A concordância não é facultativa nesse emprego impessoal.",
    "‘Fazer’ não é auxiliar de outro verbo na frase.",
  ],
  "pt-n2-0-1": [
    "No sentido de presenciar, ‘assistir’ rege a preposição ‘a’.",
    "‘Aspirar’, no sentido de almejar, rege ‘a’; respirar é outro sentido.",
    "Correto: os dois verbos regem ‘a’ nos sentidos apresentados.",
    "Os dois empregos de preposição estão adequados, não só o primeiro.",
    "Os dois empregos de preposição estão adequados, não só o segundo.",
  ],
  "pt-n2-0-2": [
    "Sem vírgulas, a oração é restritiva, não explicativa.",
    "Correto: a oração delimita quais candidatos foram convocados.",
    "O trecho introduz oração subordinada adjetiva, não coordenada.",
    "A pontuação não se resolve com uma vírgula isolada após ‘prazo’.",
    "A oração caracteriza ‘candidatos’; não expressa causa.",
  ],
  "pt-n2-0-3": [
    "Correto: ‘não’ atrai o pronome e exige próclise.",
    "A palavra negativa impede a ênclise nessa construção.",
    "O pronome está ligado ao verbo ‘divulgaram’, não a ‘resultados’.",
    "‘Se’ é pronome átono associado ao verbo ‘divulgaram’.",
    "No presente do indicativo não há exigência de mesóclise.",
  ],
  "demo-admin-1": [
    "A revogação não corrige ilegalidade; esse é o papel da anulação.",
    "Correto: anulação por ilegalidade; revogação por mérito.",
    "A Administração pode exercer autotutela sem decisão judicial prévia.",
    "Ato vinculado não é livremente revogado por conveniência e oportunidade.",
    "Anulação e revogação têm pressupostos e efeitos distintos.",
  ],
  "adm-atos-1": [
    "O poder de polícia permanece submetido à lei e aos limites legais.",
    "É atribuição administrativa, sem exclusividade do Judiciário.",
    "Correto: limita direitos por interesse público dentro da lei.",
    "Pode alcançar direitos e atividades de particulares, não só servidores.",
    "Poder de polícia e poder disciplinar têm objetos diferentes.",
  ],
  "adm-poderes-1": [
    "A responsabilidade objetiva dispensa prova de dolo ou culpa do agente.",
    "Correto: exigem-se conduta estatal, dano e nexo causal.",
    "Culpa exclusiva pode excluir o nexo; não é requisito da vítima.",
    "A regra constitucional é objetiva para a pessoa jurídica estatal.",
    "O nexo causal é elemento necessário para relacionar conduta e dano.",
  ],
  "adm-n2-1-1": [
    "Vícios de finalidade e objeto ilícito não são sanados por convalidação.",
    "Correto: vícios sanáveis admitem convalidação dentro dos limites legais.",
    "A convalidação é administrativa; não exige sempre sentença judicial.",
    "Sanar um vício não transforma a natureza discricionária do ato.",
    "A lei admite convalidação de certos vícios sanáveis.",
  ],
  "adm-n2-1-2": [
    "A discricionariedade não dispensa motivação quando exigida por lei.",
    "Correto: a motivação deve ser explícita, clara e congruente.",
    "O silêncio não substitui automaticamente a motivação devida.",
    "A exigência alcança também decisões que afetem direitos e interesses.",
    "A motivação deve expor fatos e fundamentos jurídicos, não só autoria.",
  ],
  "adm-n2-1-3": [
    "O diálogo competitivo é voltado a necessidades complexas, não apenas bens comuns.",
    "Correto: há diálogo com pré-selecionados e etapa posterior de propostas.",
    "A modalidade não elimina a etapa competitiva de propostas.",
    "Concurso e diálogo competitivo são modalidades diferentes.",
    "O diálogo competitivo integra as modalidades da Lei nº 14.133/2021.",
  ],
  "const-org-1": [
    "Não há direito de dissolução unilateral de Estado pela União.",
    "Municípios são entes integrantes da Federação brasileira.",
    "Correto: os três entes são enumerados no art. 1º da Constituição.",
    "O Distrito Federal não pode ser dividido em Municípios.",
    "A forma de Estado brasileira é federativa, não unitária.",
  ],
  "const-direitos-1": [
    "Liberdade de locomoção é protegida pelo habeas corpus.",
    "Correto: habeas data alcança informações pessoais em registros públicos.",
    "O remédio tem finalidade específica e não substitui qualquer recurso.",
    "A garantia é destinada à pessoa a quem os dados se referem.",
    "Ameaça à liberdade física é tema de habeas corpus, não habeas data.",
  ],
  "const-remedios-1": [
    "O mandado de segurança exige direito líquido e certo comprovável de plano.",
    "Liberdade de locomoção é protegida pelo habeas corpus.",
    "Correto: essa é a função constitucional do mandado de segurança.",
    "Acesso ou retificação de dados pessoais é objeto de habeas data.",
    "Também pode alcançar agente de pessoa jurídica no exercício de função pública.",
  ],
  "const-n2-2-1": [
    "Lei municipal não é objeto de ADI no STF em face da Constituição Federal.",
    "Correto: a Constituição prevê lei ou ato normativo federal ou estadual.",
    "Há outros legitimados previstos no art. 103 da Constituição.",
    "A ADI integra o controle concentrado e abstrato.",
    "ADI é ação de controle, não recurso contra sentença.",
  ],
  "const-n2-2-2": [
    "CPI investiga; condenação criminal definitiva cabe ao Judiciário.",
    "Correto: poderes de investigação não conferem função de julgamento.",
    "Medidas sujeitas à reserva de jurisdição continuam limitadas.",
    "A Constituição exige fato determinado e prazo certo.",
    "CPI é comissão parlamentar, não órgão do Poder Judiciário.",
  ],
  "const-n2-2-3": [
    "Direitos fundamentais podem colidir e não são sempre absolutos.",
    "Correto: colisões podem exigir harmonização proporcional.",
    "A ponderação não autoriza abolir cláusulas pétreas.",
    "O conteúdo constitucional decorre da própria Constituição, não só de lei ordinária.",
    "Direitos fundamentais têm aplicação imediata, conforme a Constituição.",
  ],
  "prev-seguridade-1": [
    "A saúde também integra a seguridade social.",
    "Correto: são três áreas — saúde, previdência e assistência.",
    "Seguridade social é conceito mais amplo que seguro-desemprego.",
    "A saúde está expressamente incluída no art. 194 da Constituição.",
    "Saúde e assistência não se restringem a benefícios contributivos.",
  ],
  "prev-assistencia-1": [
    "Assistência social independe de contribuição prévia.",
    "Não se limita a empregados segurados; atende a quem dela necessitar.",
    "Correto: a Constituição dispensa contribuição para assistência social.",
    "A proteção não se restringe a aposentados.",
    "Assistência e previdência são políticas distintas e complementares.",
  ],
  "prev-rgps-1": [
    "O RGPS tem caráter contributivo e filiação obrigatória para os enquadrados.",
    "Correto: essa é a característica constitucional do regime geral.",
    "O vínculo decorre do enquadramento legal, não de autorização judicial.",
    "O RGPS pertence à estrutura de previdência, não ao Judiciário.",
    "A contribuição financia a cobertura; não a impede.",
  ],
  "prev-n2-3-1": [
    "A vedação constitucional não é afastada por benefício individual.",
    "Correto: a Constituição veda tempo de contribuição fictício.",
    "A regra trata de benefícios previdenciários, não apenas assistência.",
    "A vedação está expressa no art. 201, § 14, da Constituição.",
    "Tempo fictício não é requisito constitucional para aposentadoria.",
  ],
  "prev-n2-3-2": [
    "O custeio não cabe exclusivamente aos empregados.",
    "Correto: o art. 195 prevê financiamento por toda a sociedade.",
    "Há diversas fontes de custeio além da União.",
    "Contribuições sociais são fontes constitucionais de financiamento.",
    "Recursos dos orçamentos também podem financiar a seguridade.",
  ],
  "prev-n2-3-3": [
    "Equidade não exige valor idêntico para todos os contribuintes.",
    "Correto: a participação pode considerar capacidade contributiva nos termos legais.",
    "A aplicação do princípio respeita a lei e os critérios constitucionais.",
    "O financiamento da seguridade não é exclusivo dos beneficiários previdenciários.",
    "Equidade não exclui financiamento público nem outras fontes.",
  ],
  "logica-proporcao-1": [
    "R$ 20 é o valor do desconto; a pergunta pede o preço final.",
    "R$ 55 não corresponde a subtrair 25% de R$ 80.",
    "Correto: R$ 80 menos R$ 20 de desconto resulta em R$ 60.",
    "R$ 65 não resulta do desconto de um quarto do preço.",
    "R$ 75 corresponde a retirar apenas R$ 5, não 25%.",
  ],
  "logica-conjuntos-1": [
    "12 é uma diferença entre quantidades, não a união dos conjuntos.",
    "18 conta apenas quem estuda Português, sem somar o outro grupo.",
    "20 não resulta da inclusão-exclusão com os dados fornecidos.",
    "Correto: 18 + 14 − 6 = 26 pessoas.",
    "32 conta seis pessoas duas vezes, sem descontar a interseção.",
  ],
  "logica-sequencias-1": [
    "A razão de uma PA é a diferença entre termos, não o quociente.",
    "Correto: a diferença constante é 4, logo a razão da PA é 4.",
    "Não há multiplicação por uma razão geométrica constante.",
    "O próximo termo é 19, somando 4 a 15.",
    "As diferenças são constantes, não variáveis.",
  ],
  "logica-n2-4-1": [
    "1/6 corresponde a apenas um resultado, não à união pedida.",
    "Dois resultados favoráveis dariam 1/3; há quatro na união.",
    "Metade do espaço amostral não corresponde aos quatro resultados favoráveis.",
    "Correto: {2, 4, 5, 6} são quatro dos seis resultados.",
    "5/6 contaria cinco resultados, mas há quatro na união.",
  ],
  "logica-n2-4-2": [
    "‘Nenhum’ é mais forte que negar ‘todos’; basta uma exceção.",
    "Correto: existe ao menos um candidato que não entregou.",
    "‘Todos não entregaram’ afirma que ninguém entregou, não apenas uma exceção.",
    "A negação não exige que alguns entreguem e outros não.",
    "Toda proposição admite uma negação lógica.",
  ],
  "logica-n2-4-3": [
    "A recíproca não é logicamente equivalente em geral.",
    "Correto: inverter e negar antecedente e consequente forma a contrapositiva.",
    "A equivalência não é apenas negar a antecedente.",
    "Uma condicional não equivale à conjunção das proposições.",
    "As duas frases são equivalentes pela contraposição lógica.",
  ],
  "etica-publica-1": [
    "A ética pública orienta a conduta no exercício da função.",
    "Correto: respeito e princípios administrativos orientam o serviço público.",
    "Preferência pessoal não afasta o princípio da legalidade.",
    "Eficiência não autoriza violar direitos ou outros princípios.",
    "Transparência é compatível com atuação ética e responsável.",
  ],
  "info-seguranca-1": [
    "Confiança não autoriza compartilhar credenciais pessoais.",
    "Correto: acessos devem ser individuais e concedidos por meios autorizados.",
    "Anotar senha em local público expõe a credencial.",
    "Reutilizar senha aumenta o impacto de uma violação.",
    "Autenticação multifator acrescenta uma camada de segurança.",
  ],
  "etica-sigilo-1": [
    "Boa intenção não substitui base legal e proteção de dados.",
    "Correto: divulgação requer fundamento e tratamento adequado.",
    "O interesse público pode ser considerado conforme a lei.",
    "Publicidade não elimina deveres de proteção e sigilo legal.",
    "Autorização verbal, por si só, não basta para legitimar divulgação.",
  ],
  "etica-n2-5-1": [
    "Utilidade futura, isoladamente, não justifica coleta excessiva.",
    "Correto: o tratamento se limita ao mínimo necessário para a finalidade.",
    "O princípio da necessidade pressupõe finalidade definida e legítima.",
    "O princípio aplica-se ao tratamento de dados pessoais, não só anônimos.",
    "A LGPD não proíbe todo tratamento; exige limites e fundamento.",
  ],
  "etica-n2-5-2": [
    "O domínio ou nome exibido pode ser falsificado.",
    "Correto: urgência e solicitação de senha são sinais de phishing.",
    "Phishing pode ocorrer por e-mail, mensagens, páginas e outros canais.",
    "Abrir o link pode expor dados; verifique por canal independente.",
    "Conhecer o remetente não torna seguro compartilhar senha.",
  ],
  "etica-n2-5-3": [
    "Transparência tem limites legais e não exige publicar informação sigilosa.",
    "Correto: transparência convive com proteção de sigilo previsto em lei.",
    "Prestação de contas integra a transparência e a responsabilidade públicas.",
    "O sigilo precisa de fundamento legal, não de decisão informal.",
    "O cidadão pode acessar informações públicas observadas as exceções legais.",
  ],
};

export function getQuestionRationales(
  question: DemoQuestion,
  format: ExamFormat
): AnswerRationale[] {
  const correctValue = getCorrectAnswer(question, format);
  return getQuestionChoices(question, format).map(choice => {
    const correct = choice.value === correctValue;
    let rationale: string;
    if (format === "CE") {
      rationale = correct
        ? question.explanation
        : `A afirmação está ${question.statementIsTrue ? "correta" : "incorreta"}; por isso, o gabarito é ${correctValue}. ${question.explanation}`;
    } else {
      const index = choice.value.charCodeAt(0) - 65;
      rationale = correct
        ? question.explanation
        : (CHOICE_RATIONALES[question.id]?.[index] ?? question.trap);
    }
    return { ...choice, correct, rationale };
  });
}
