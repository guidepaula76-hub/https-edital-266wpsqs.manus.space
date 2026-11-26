import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Card,
  DemoNote,
  Frog,
  MechButton,
  SectionHeading,
  Tag,
  Tabs,
} from "@/components/ultra/UI";
import { useProgress } from "@/lib/progress";
import { useWritingLines } from "@/lib/useWritingLines";
import "./contents.css";

type TabId = "guia" | "fixacao" | "cronograma" | "redacao";
type SubjectId = "portugues" | "constitucional" | "administrativo";
type MindNode = {
  id: string;
  title: string;
  summary: string;
  children: MindNode[];
};
type StudySubject = {
  label: string;
  shortLabel: string;
  subtitle: string;
  summary: string[];
  mindSummary: string;
  mind: MindNode[];
  content: { heading: string; paragraphs: string[] }[];
  cards: { question: string; answer: string; mnemonic: string }[];
};

const tabs: { id: TabId; label: string }[] = [
  { id: "guia", label: "Guia" },
  { id: "fixacao", label: "Fixação" },
  { id: "cronograma", label: "Cronograma" },
  { id: "redacao", label: "Redação" },
];

const subjects: Record<SubjectId, StudySubject> = {
  portugues: {
    label: "Língua Portuguesa",
    shortLabel: "Português",
    subtitle: "Concordância verbal: haver e fazer",
    summary: [
      "Haver com sentido de existir ou ocorrer é impessoal: fica na 3ª pessoa do singular.",
      "Existir concorda com o sujeito: existem dúvidas; existiam provas.",
      "Fazer indicando tempo decorrido ou fenômeno natural também é impessoal.",
      "Quando haver é auxiliar, ele concorda normalmente: eles haviam estudado.",
    ],
    mindSummary:
      "O ponto central é identificar o sentido do verbo: haver/existir e fazer/tempo são casos diferentes de concordância.",
    mind: [
      {
        id: "pt-haver",
        title: "Verbo haver",
        summary:
          "No sentido de existir, acontecer ou tempo decorrido, haver é impessoal e permanece no singular.",
        children: [
          {
            id: "pt-haver-existir",
            title: "Existir / ocorrer",
            summary:
              "Houve recursos; havia dúvidas; haverá mudanças. O verbo não concorda com o termo que vem depois.",
            children: [],
          },
          {
            id: "pt-haver-auxiliar",
            title: "Verbo auxiliar",
            summary:
              "Com outro verbo, haver pode variar: eles haviam estudado; elas haverão de chegar.",
            children: [],
          },
        ],
      },
      {
        id: "pt-fazer",
        title: "Verbo fazer",
        summary:
          "Fazer que indica tempo ou fenômeno meteorológico é impessoal; em outros sentidos, pode concordar com o sujeito.",
        children: [
          {
            id: "pt-fazer-tempo",
            title: "Tempo decorrido",
            summary:
              "Faz dois anos; fazia meses. Mesmo com expressão plural, o verbo fica no singular.",
            children: [],
          },
          {
            id: "pt-fazer-outros",
            title: "Outros sentidos",
            summary:
              "Em “os técnicos fizeram a revisão”, há sujeito e o verbo concorda com ele.",
            children: [],
          },
        ],
      },
      {
        id: "pt-checagem",
        title: "Como resolver",
        summary:
          "Substitua haver por existir e pergunte se o sentido mudou; depois confirme se há sujeito para o verbo.",
        children: [
          {
            id: "pt-teste",
            title: "Teste de sentido",
            summary:
              "“Existiram problemas” está no plural; por isso, no mesmo sentido, “houve problemas” fica no singular.",
            children: [],
          },
          {
            id: "pt-pegadinha",
            title: "Pegadinha comum",
            summary:
              "O plural do complemento (“muitos candidatos”) não torna plural o haver impessoal: houve muitos candidatos.",
            children: [],
          },
        ],
      },
    ],
    content: [
      {
        heading: "1. Haver impessoal: o sentido decide",
        paragraphs: [
          "Quando haver significa existir ou acontecer, não há sujeito com o qual ele possa concordar. Por isso, usa-se a terceira pessoa do singular: “Houve dúvidas na prova”, “Havia pessoas na sala” e “Haverá novas etapas”. O termo que vem depois do verbo não altera essa regra.",
          "Uma forma útil de conferir é trocar haver por existir. “Existiam dúvidas” fica no plural porque dúvidas é sujeito de existir; ao voltar ao verbo haver, a forma correta é “Havia dúvidas”. A substituição ajuda a revelar a diferença entre os dois verbos.",
        ],
      },
      {
        heading: "2. Haver como auxiliar",
        paragraphs: [
          "A impessoalidade não se aplica a todos os usos de haver. Quando ele auxilia outro verbo e tem sujeito, concorda com esse sujeito: “Os candidatos haviam concluído a etapa”. O contexto e o sentido, portanto, precisam ser observados antes de escolher a forma verbal.",
        ],
      },
      {
        heading: "3. Fazer indicando tempo",
        paragraphs: [
          "Fazer também fica na terceira pessoa do singular quando indica tempo decorrido: “Faz três meses que comecei a estudar” e “Fazia semanas que o edital era aguardado”. A expressão plural de tempo não funciona como sujeito.",
          "Em outros sentidos, o verbo concorda normalmente: “As equipes fizeram a revisão”. Em questões de prova, procure a ideia de tempo e verifique se existe um sujeito explícito para o verbo.",
        ],
      },
    ],
    cards: [
      {
        question:
          "Qual forma é adequada no sentido de “existir”: “Houveram recursos” ou “Houve recursos”?",
        answer:
          "Houve recursos. Haver, nesse sentido, é impessoal e permanece na 3ª pessoa do singular.",
        mnemonic:
          "“HÁ e HOUVE não procuram sujeito”: no sentido de existir, ficam no singular.",
      },
      {
        question: "Complete: “_____ dois anos que a equipe revisa o material.”",
        answer: "Faz dois anos. Fazer indicando tempo decorrido é impessoal.",
        mnemonic: "Relógio não vira sujeito: “faz” tempo fica no singular.",
      },
      {
        question:
          "Em “Os candidatos haviam estudado”, por que “haviam” está no plural?",
        answer:
          "Haver funciona como auxiliar e concorda com o sujeito “os candidatos”.",
        mnemonic: "Haver + particípio pode variar quando acompanha um sujeito.",
      },
    ],
  },
  constitucional: {
    label: "Direito Constitucional",
    shortLabel: "Constitucional",
    subtitle: "Direitos e garantias fundamentais",
    summary: [
      "O artigo 5º reúne direitos e garantias fundamentais, como vida, liberdade, igualdade, segurança e propriedade.",
      "Direitos são bens ou posições protegidas; garantias são instrumentos que ajudam a protegê-los.",
      "A Constituição prevê aplicação imediata às normas definidoras de direitos e garantias fundamentais.",
      "Em questões, diferencie o direito protegido do mecanismo usado para defendê-lo.",
    ],
    mindSummary:
      "Organize o estudo em texto constitucional, direito protegido, instrumento de garantia e atenção ao alcance de cada norma.",
    mind: [
      {
        id: "cf-base",
        title: "Base constitucional",
        summary:
          "O artigo 5º declara direitos individuais e coletivos e estabelece garantias fundamentais.",
        children: [
          {
            id: "cf-caput",
            title: "Caput do art. 5º",
            summary:
              "Enumera vida, liberdade, igualdade, segurança e propriedade como direitos invioláveis, nos termos constitucionais.",
            children: [],
          },
          {
            id: "cf-aplicacao",
            title: "Aplicação",
            summary:
              "O § 1º do artigo 5º prevê aplicação imediata das normas definidoras de direitos e garantias fundamentais.",
            children: [],
          },
        ],
      },
      {
        id: "cf-direitos",
        title: "Direitos protegidos",
        summary:
          "Direitos descrevem bens e posições jurídicas reconhecidos pela Constituição.",
        children: [
          {
            id: "cf-liberdade",
            title: "Liberdade e igualdade",
            summary:
              "A leitura deve considerar o texto constitucional e as condições que ele próprio estabelece.",
            children: [],
          },
          {
            id: "cf-seguranca",
            title: "Segurança e propriedade",
            summary:
              "São direitos mencionados expressamente no caput do artigo 5º.",
            children: [],
          },
        ],
      },
      {
        id: "cf-garantias",
        title: "Garantias",
        summary:
          "Garantias são instrumentos constitucionais de proteção de direitos, como remédios constitucionais.",
        children: [
          {
            id: "cf-hc",
            title: "Habeas corpus",
            summary:
              "Protege a liberdade de locomoção diante de ilegalidade ou abuso de poder, conforme os requisitos constitucionais.",
            children: [],
          },
          {
            id: "cf-ms",
            title: "Mandado de segurança",
            summary:
              "Protege direito líquido e certo nos limites e hipóteses previstos na Constituição e na lei.",
            children: [],
          },
        ],
      },
    ],
    content: [
      {
        heading: "1. Onde estudar o tema",
        paragraphs: [
          "O artigo 5º da Constituição Federal apresenta direitos e deveres individuais e coletivos. Seu caput menciona vida, liberdade, igualdade, segurança e propriedade, observados os termos constitucionais. A leitura literal ajuda a reconhecer o núcleo do dispositivo, mas não dispensa atenção às condições e exceções previstas no próprio texto.",
          "O § 1º estabelece que as normas definidoras dos direitos e garantias fundamentais têm aplicação imediata. Em questões, evite transformar essa formulação em uma afirmação absoluta sobre efeitos concretos de qualquer norma: a aplicação depende do conteúdo e do contexto da regra examinada.",
        ],
      },
      {
        heading: "2. Direito não é a mesma coisa que garantia",
        paragraphs: [
          "Direito é a posição ou bem jurídico protegido; garantia é um meio de defesa ou proteção. A liberdade de locomoção, por exemplo, é um direito. O habeas corpus é uma garantia constitucional relacionada à proteção dessa liberdade, dentro das hipóteses previstas.",
          "Essa distinção é especialmente útil em itens que pedem a natureza de um instituto. O mandado de segurança, o habeas corpus e outros remédios têm requisitos próprios; não os trate como mecanismos intercambiáveis.",
        ],
      },
      {
        heading: "3. Método de revisão",
        paragraphs: [
          "Ao estudar um dispositivo, registre: (a) o direito protegido; (b) a garantia ou instrumento relacionado; (c) o texto constitucional que define seu alcance; e (d) eventuais condições e exceções expressas. Em seguida, refaça questões identificando exatamente qual dessas camadas o enunciado está cobrando.",
        ],
      },
    ],
    cards: [
      {
        question: "Quais direitos são mencionados no caput do artigo 5º?",
        answer:
          "Vida, liberdade, igualdade, segurança e propriedade, nos termos da Constituição.",
        mnemonic:
          "V-L-I-S-P: Vida, Liberdade, Igualdade, Segurança e Propriedade.",
      },
      {
        question: "Qual é a diferença entre direito e garantia?",
        answer:
          "Direito é o bem ou posição protegida; garantia é um instrumento ou meio de proteção.",
        mnemonic: "Direito = o que se protege; garantia = como se protege.",
      },
      {
        question: "O que prevê o § 1º do artigo 5º?",
        answer:
          "As normas definidoras dos direitos e garantias fundamentais têm aplicação imediata.",
        mnemonic:
          "§ 1º: aplicação imediata — memorize a redação antes de ampliar o alcance.",
      },
    ],
  },
  administrativo: {
    label: "Direito Administrativo",
    shortLabel: "Administrativo",
    subtitle: "Princípios da Administração Pública",
    summary: [
      "O caput do artigo 37 da Constituição traz os princípios expressos LIMPE.",
      "Legalidade, impessoalidade, moralidade, publicidade e eficiência orientam a Administração direta e indireta.",
      "Princípios implícitos também podem ser cobrados, mas não fazem parte do acrônimo do caput.",
      "Eficiência exige boa prestação e resultados, sem afastar a legalidade.",
    ],
    mindSummary:
      "Use LIMPE para lembrar os princípios expressos e mantenha separados os princípios reconhecidos pela doutrina e jurisprudência.",
    mind: [
      {
        id: "adm-limpe",
        title: "Princípios expressos",
        summary:
          "O artigo 37, caput, apresenta legalidade, impessoalidade, moralidade, publicidade e eficiência.",
        children: [
          {
            id: "adm-legalidade",
            title: "Legalidade",
            summary:
              "A atuação administrativa deve respeitar o ordenamento e as competências que autorizam a ação.",
            children: [],
          },
          {
            id: "adm-impessoalidade",
            title: "Impessoalidade",
            summary:
              "A atuação deve buscar finalidade pública e tratamento isonômico, sem favorecimento ou promoção pessoal.",
            children: [],
          },
          {
            id: "adm-moralidade",
            title: "Moralidade",
            summary:
              "A conduta deve observar padrões de probidade e boa-fé na atuação administrativa.",
            children: [],
          },
          {
            id: "adm-publicidade",
            title: "Publicidade",
            summary:
              "Transparência é a regra constitucional, ressalvadas hipóteses legítimas de sigilo.",
            children: [],
          },
          {
            id: "adm-eficiencia",
            title: "Eficiência",
            summary:
              "Busca qualidade e bons resultados na prestação pública, respeitando os demais princípios.",
            children: [],
          },
        ],
      },
      {
        id: "adm-alcance",
        title: "Alcance",
        summary:
          "O caput do artigo 37 se refere à Administração Pública direta e indireta de todos os Poderes e entes federativos.",
        children: [
          {
            id: "adm-direta",
            title: "Direta e indireta",
            summary:
              "A literalidade constitucional inclui as duas formas de organização administrativa.",
            children: [],
          },
          {
            id: "adm-entes",
            title: "Entes e Poderes",
            summary:
              "O dispositivo menciona União, Estados, Distrito Federal e Municípios, e os Poderes correspondentes.",
            children: [],
          },
        ],
      },
      {
        id: "adm-implicitos",
        title: "Princípios implícitos",
        summary:
          "Outros princípios, como razoabilidade e proporcionalidade, são estudados sem confundi-los com o rol literal do caput.",
        children: [
          {
            id: "adm-razoabilidade",
            title: "Razoabilidade",
            summary:
              "Parâmetro de coerência e adequação da atuação, conforme o contexto jurídico aplicável.",
            children: [],
          },
          {
            id: "adm-proporcionalidade",
            title: "Proporcionalidade",
            summary:
              "Auxilia a avaliar adequação, necessidade e equilíbrio da medida, conforme o caso.",
            children: [],
          },
        ],
      },
    ],
    content: [
      {
        heading: "1. O núcleo do artigo 37",
        paragraphs: [
          "O caput do artigo 37 da Constituição determina que a Administração Pública direta e indireta de qualquer dos Poderes da União, dos Estados, do Distrito Federal e dos Municípios obedeça aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência. O acrônimo LIMPE é um recurso para recordar esse rol expresso.",
          "A memorização do acrônimo não substitui a compreensão de cada princípio. Também não confunda o rol literal do caput com outros princípios administrativos reconhecidos em normas, na doutrina e na jurisprudência.",
        ],
      },
      {
        heading: "2. Como diferenciar os princípios",
        paragraphs: [
          "Legalidade orienta a atuação conforme o ordenamento; impessoalidade exige finalidade pública e afasta favorecimento ou promoção pessoal; moralidade demanda probidade; publicidade favorece transparência, ressalvado sigilo legítimo; eficiência busca qualidade e resultados na prestação pública.",
          "Esses princípios devem ser lidos em conjunto. Eficiência, por exemplo, não autoriza ignorar a legalidade. A busca por resultado continua submetida às competências, aos procedimentos e às garantias aplicáveis.",
        ],
      },
      {
        heading: "3. Princípios além do acrônimo",
        paragraphs: [
          "Razoabilidade e proporcionalidade são frequentemente estudadas como princípios implícitos ou parâmetros de controle da atuação administrativa. Ao responder uma questão, observe se ela pergunta pelo rol expresso do artigo 37 ou por princípios administrativos em sentido amplo.",
          "Uma estratégia prática é classificar cada princípio em duas colunas: “texto expresso do caput” e “outros princípios estudados”. Essa separação evita que um item de literalidade seja respondido com uma lista ampliada.",
        ],
      },
    ],
    cards: [
      {
        question: "Quais são os princípios expressos no caput do artigo 37?",
        answer:
          "Legalidade, impessoalidade, moralidade, publicidade e eficiência.",
        mnemonic:
          "LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiência.",
      },
      {
        question:
          "Eficiência permite afastar a legalidade para alcançar resultados?",
        answer:
          "Não. A busca por resultados continua submetida à Constituição, à lei e às competências administrativas.",
        mnemonic: "Eficiência não é atalho: LIMPE funciona em conjunto.",
      },
      {
        question: "Razoabilidade está escrita no rol do caput do artigo 37?",
        answer:
          "Não. O caput lista LIMPE; razoabilidade é estudada entre outros princípios administrativos.",
        mnemonic:
          "LIMPE é o rol literal; mantenha os demais em uma coluna separada.",
      },
    ],
  },
};

const banks = ["Cebraspe", "FGV", "FCC", "Vunesp"];
const bankWeights: Record<
  string,
  { structure: number; grammar: number; content: number }
> = {
  Cebraspe: { structure: 30, grammar: 30, content: 40 },
  FGV: { structure: 35, grammar: 30, content: 35 },
  FCC: { structure: 30, grammar: 35, content: 35 },
  Vunesp: { structure: 30, grammar: 30, content: 40 },
};
const weeklyTopics = [
  {
    theory: "Português · concordância verbal",
    questions: "Constitucional · direitos fundamentais",
  },
  {
    theory: "Administrativo · princípios LIMPE",
    questions: "Português · haver e fazer",
  },
  {
    theory: "Constitucional · garantias",
    questions: "Administrativo · princípios expressos",
  },
  {
    theory: "Português · revisão de concordância",
    questions: "Constitucional · questões do art. 5º",
  },
  {
    theory: "Administrativo · legalidade e eficiência",
    questions: "Português · itens de concordância",
  },
  {
    theory: "Constitucional · aplicação imediata",
    questions: "Administrativo · questões de princípios",
  },
  {
    theory: "Revisão semanal · pontos fracos",
    questions: "Mini-simulado · 10 questões",
  },
];
const spacedIntervals = [
  { days: 1, label: "24h", detail: "Revisão de curto prazo" },
  { days: 7, label: "7 dias", detail: "Revisão de consolidação" },
  { days: 15, label: "15 dias", detail: "Revisão de retenção" },
  { days: 30, label: "30 dias", detail: "Revisão de manutenção" },
] as const;
const lineLimit = 30;
const lineWidth = 68;
const minimumWords = 80;
const scheduleStorageKey = "ultraconcursos-contents-completed-v1";

function isTabId(value: string | null): value is TabId {
  return (
    value === "guia" ||
    value === "fixacao" ||
    value === "cronograma" ||
    value === "redacao"
  );
}

function tabFromLocation(location: string): TabId {
  const query = location.includes("?")
    ? location.slice(location.indexOf("?") + 1).split("#")[0]
    : typeof window === "undefined"
      ? ""
      : window.location.search.slice(1);
  const tab = new URLSearchParams(query).get("tab");
  return isTabId(tab) ? tab : "guia";
}

function findMindNode(nodes: MindNode[], id: string): MindNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findMindNode(node.children, id);
    if (child) return child;
  }
  return undefined;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, count: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function mondayOf(date: Date) {
  const monday = startOfDay(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
) {
  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

function visualLineCount(text: string, width = lineWidth) {
  if (!text) return 0;
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .reduce((total, paragraph) => {
      if (paragraph.trim().length === 0) return total + 1;
      let lines = 1;
      let column = 0;
      const words = paragraph.trim().split(/\s+/);
      for (const word of words) {
        const wordLength = Array.from(word).length;
        if (column > 0 && column + 1 + wordLength > width) {
          lines += 1;
          column = 0;
        }
        if (wordLength > width) {
          if (column > 0) {
            lines += 1;
            column = 0;
          }
          lines += Math.floor((wordLength - 1) / width);
          column = ((wordLength - 1) % width) + 1;
        } else if (column === 0) {
          column = wordLength;
        } else {
          column += wordLength + 1;
        }
      }
      return total + lines;
    }, 0);
}

function wordCount(text: string) {
  const clean = text.trim();
  return clean ? clean.split(/\s+/).length : 0;
}

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

type EssayScores = {
  structure: number;
  grammar: number;
  content: number;
  total: number;
  notes: { criterion: string; note: string; score: number }[];
  suggestions: string[];
};

function evaluateEssay(text: string, bank: string): EssayScores {
  const weight = bankWeights[bank] ?? bankWeights.Cebraspe;
  const clean = text.trim();
  const paragraphs = clean
    .split(/\n\s*\n/)
    .filter(part => part.trim().length > 0);
  const normalized = normalizeText(clean);
  const hasOpening =
    /\b(este texto|nesse contexto|atualmente|a sociedade|a administracao publica|em primeiro lugar)\b/.test(
      normalized
    );
  const hasConclusion =
    /\b(portanto|assim|dessa forma|em sintese|por fim|conclui-se)\b/.test(
      normalized
    );
  const structure = Math.min(
    10,
    4 +
      Math.min(3, Math.max(0, paragraphs.length - 1)) +
      (hasOpening ? 1 : 0) +
      (hasConclusion ? 2 : 0)
  );
  const spacingIssues = (clean.match(/ {2,}/g) ?? []).length;
  const punctuationIssues = (clean.match(/\s+[,.!?;:]/g) ?? []).length;
  const repeatedPunctuation = (clean.match(/[,.!?;:]{2,}/g) ?? []).length;
  const mechanicalIssues =
    spacingIssues + punctuationIssues + repeatedPunctuation;
  const grammar = Math.max(0, 10 - Math.min(10, mechanicalIssues * 2));
  const keywords = ["administracao", "eficiencia", "servico", "publico"];
  const matched = keywords.filter(keyword =>
    normalized.includes(keyword)
  ).length;
  const content = Math.min(10, 3 + Math.round((matched / keywords.length) * 7));
  const total =
    (structure * weight.structure +
      grammar * weight.grammar +
      content * weight.content) /
    10;
  const suggestions: string[] = [];
  if (structure < 8)
    suggestions.push(
      "Separe a tese, o desenvolvimento e o fechamento em parágrafos com funções distintas."
    );
  if (grammar < 9)
    suggestions.push(
      "Revise espaços duplicados e espaços antes de sinais de pontuação; são os padrões mecânicos considerados neste exemplo."
    );
  if (content < 8)
    suggestions.push(
      "Relacione explicitamente administração pública, eficiência, serviços e interesse público ao tema proposto."
    );
  if (suggestions.length === 0)
    suggestions.push(
      "A estrutura e as palavras-chave foram reconhecidas pelas regras simples da demonstração; faça também uma revisão humana completa."
    );
  return {
    structure,
    grammar,
    content,
    total,
    notes: [
      {
        criterion: "Estrutura",
        score: structure,
        note: `${paragraphs.length} parágrafo(s); a regra considera organização em blocos e marcadores de abertura/fechamento.`,
      },
      {
        criterion: "Gramática",
        score: grammar,
        note: `${mechanicalIssues} ocorrência(s) de espaçamento ou pontuação verificável por padrão; não é correção gramatical completa.`,
      },
      {
        criterion: "Conteúdo",
        score: content,
        note: `${matched} de 4 termos do tema apareceram: administração, eficiência, serviço e público.`,
      },
    ],
    suggestions,
  };
}

type ScheduleTask = {
  id: string;
  title: string;
  kind: "Teoria" | "Questões" | "Revisão";
  dueDate: string;
  interval?: string;
};

function readCompletedTasks() {
  try {
    const saved = localStorage.getItem(scheduleStorageKey);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function SelectField({
  label,
  value,
  onChange,
  children,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`contents-select-field ${className}`}>
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function Contents() {
  const { state, setWriting, recalculateSchedule, updateProfile } =
    useProgress();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromLocation(location)
  );
  const [subjectId, setSubjectId] = useState<SubjectId>("portugues");
  const [fixationView, setFixationView] = useState<"mapa" | "flashcards">(
    "mapa"
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set(["pt-haver"])
  );
  const [selectedMindNode, setSelectedMindNode] = useState("root");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] =
    useState<string[]>(readCompletedTasks);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [selectedBank, setSelectedBank] = useState(
    state.profile.banca || "Cebraspe"
  );
  const essayRef = useRef<HTMLTextAreaElement>(null);
  const essayMetrics = useWritingLines(
    essayRef,
    state.writing,
    activeTab === "redacao"
  );
  const [essayResult, setEssayResult] = useState<EssayScores | null>(null);
  const subject = subjects[subjectId];
  const [today] = useState(() => startOfDay(new Date()));
  const todayKey = dateKey(today);
  const monday = useMemo(() => mondayOf(today), [today]);
  const mondayKey = dateKey(monday);
  const todayIndex = Math.max(
    0,
    Math.min(6, Math.round((today.getTime() - monday.getTime()) / 86400000))
  );
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(monday, index);
        const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
          .format(date)
          .replace(".", "");
        return {
          date,
          dateKey: dateKey(date),
          index,
          weekday:
            weekday.charAt(0).toLocaleUpperCase("pt-BR") + weekday.slice(1),
        };
      }),
    [monday]
  );
  const weeklyTasks = useMemo<ScheduleTask[]>(() => {
    const templates = days.flatMap(day => {
      const topic = weeklyTopics[day.index];
      return [
        {
          id: `week-${mondayKey}-${day.index}-theory`,
          title: topic.theory,
          kind: "Teoria" as const,
          dueDate: day.dateKey,
          dayIndex: day.index,
        },
        {
          id: `week-${mondayKey}-${day.index}-questions`,
          title: topic.questions,
          kind: "Questões" as const,
          dueDate: day.dateKey,
          dayIndex: day.index,
        },
      ];
    });
    let pendingIndex = 0;
    const remainingDays = Math.max(1, 7 - todayIndex);
    return templates.map(task => {
      if (state.scheduleRevision > 0 && !completedTaskIds.includes(task.id)) {
        const redistributedDay =
          todayIndex +
          ((pendingIndex + state.scheduleRevision - 1) % remainingDays);
        pendingIndex += 1;
        return {
          id: task.id,
          title: task.title,
          kind: task.kind,
          dueDate: days[redistributedDay].dateKey,
        };
      }
      return {
        id: task.id,
        title: task.title,
        kind: task.kind,
        dueDate: task.dueDate,
      };
    });
  }, [completedTaskIds, days, mondayKey, state.scheduleRevision, todayIndex]);
  const spacedTasks = useMemo<ScheduleTask[]>(
    () =>
      spacedIntervals.map(item => ({
        id: `review-${todayKey}-${item.days}`,
        title: `${item.detail} · revisar pontos-chave`,
        kind: "Revisão",
        dueDate: dateKey(addDays(today, item.days)),
        interval: item.label,
      })),
    [today, todayKey]
  );
  const taskDatesInWeek = new Set(days.map(day => day.dateKey));
  const calendarTasks = [
    ...weeklyTasks,
    ...spacedTasks.filter(task => taskDatesInWeek.has(task.dueDate)),
  ];
  const overdueCount = weeklyTasks.filter(
    task => task.dueDate < todayKey && !completedTaskIds.includes(task.id)
  ).length;
  const pendingWeeklyCount = weeklyTasks.filter(
    task => !completedTaskIds.includes(task.id)
  ).length;
  const currentFlashcard = subject.cards[cardIndex % subject.cards.length];
  const mindSelection =
    selectedMindNode === "root"
      ? undefined
      : findMindNode(subject.mind, selectedMindNode);
  const essayWords = wordCount(state.writing);
  const essayLines = essayMetrics.lines;
  const isEssayOverLimit = essayLines > lineLimit;

  useEffect(() => {
    const queryTab = tabFromLocation(location);
    setActiveTab(queryTab);
  }, [location]);

  useEffect(() => {
    try {
      localStorage.setItem(
        scheduleStorageKey,
        JSON.stringify(completedTaskIds)
      );
    } catch {
      // O cronograma continua utilizável mesmo quando o navegador bloqueia armazenamento local.
    }
  }, [completedTaskIds]);

  function changeTab(value: string) {
    if (!isTabId(value)) return;
    setActiveTab(value);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.pathname = "/app/conteudos";
      url.searchParams.set("tab", value);
      navigate(`${url.pathname}${url.search}${url.hash}`);
    } else {
      navigate(`/app/conteudos?tab=${value}`);
    }
  }

  function changeSubject(value: string) {
    if (
      value !== "portugues" &&
      value !== "constitucional" &&
      value !== "administrativo"
    )
      return;
    setSubjectId(value);
    setExpandedNodes(new Set([subjects[value].mind[0].id]));
    setSelectedMindNode("root");
    setCardIndex(0);
    setFlipped(false);
  }

  function toggleTask(taskId: string) {
    setCompletedTaskIds(previous =>
      previous.includes(taskId)
        ? previous.filter(id => id !== taskId)
        : [...previous, taskId]
    );
  }

  function recalculateRoute() {
    const delayed = overdueCount;
    const pending = pendingWeeklyCount;
    recalculateSchedule();
    if (pending === 0) {
      setScheduleMessage(
        "Não há tarefas semanais pendentes. Os marcos de revisão continuam distribuídos em 24h, 7 dias, 15 dias e 30 dias."
      );
    } else {
      setScheduleMessage(
        `${pending} tarefa(s) semanal(is) pendente(s) redistribuída(s) entre hoje e domingo; ${delayed} estava(m) atrasada(s). As revisões futuras mantêm os marcos de 24h, 7, 15 e 30 dias.`
      );
    }
  }

  function moveFlashcard(direction: -1 | 1) {
    setFlipped(false);
    setCardIndex(
      index => (index + direction + subject.cards.length) % subject.cards.length
    );
  }

  function changeBank(value: string) {
    setSelectedBank(value);
    updateProfile({ banca: value });
    setEssayResult(null);
  }

  function evaluateWriting() {
    if (essayWords < minimumWords) {
      toast.error(
        `Escreva pelo menos ${minimumWords} palavras para ver a avaliação demonstrativa.`
      );
      return;
    }
    if (isEssayOverLimit) {
      toast.error(
        `O limite desta proposta é ${lineLimit} linhas. Reduza o texto antes de avaliar.`
      );
      return;
    }
    setEssayResult(evaluateEssay(state.writing, selectedBank));
  }

  const taskButton = (task: ScheduleTask) => {
    const done = completedTaskIds.includes(task.id);
    const overdue = !done && task.dueDate < todayKey;
    return (
      <div
        key={task.id}
        className={`contents-task ${done ? "is-done" : ""} ${overdue ? "is-overdue" : ""}`}
      >
        <div className="contents-task-mark" aria-hidden="true">
          {task.kind === "Teoria" ? (
            <BookOpen size={15} />
          ) : task.kind === "Questões" ? (
            <CircleHelp size={15} />
          ) : (
            <RotateCcw size={15} />
          )}
        </div>
        <div className="contents-task-copy">
          <span className="contents-task-kind">
            {task.interval ? `Revisão ${task.interval}` : task.kind}
          </span>
          <strong>{task.title}</strong>
          {overdue && <span className="contents-task-status">Atrasada</span>}
        </div>
        <button
          type="button"
          className="contents-task-toggle"
          aria-label={`${done ? "Reabrir" : "Concluir"}: ${task.title}`}
          aria-pressed={done}
          onClick={() => toggleTask(task.id)}
        >
          {done ? <Check size={15} /> : <span />}
        </button>
      </div>
    );
  };

  const mindBranch = (node: MindNode) => {
    const expanded = expandedNodes.has(node.id);
    const selected = selectedMindNode === node.id;
    return (
      <li
        className={`contents-mind-branch ${expanded ? "is-expanded" : ""}`}
        key={node.id}
      >
        <button
          type="button"
          className={`contents-mind-node ${selected ? "is-selected" : ""}`}
          aria-expanded={expanded}
          onClick={() => {
            setSelectedMindNode(node.id);
            setExpandedNodes(previous => {
              const next = new Set(previous);
              if (next.has(node.id)) next.delete(node.id);
              else next.add(node.id);
              return next;
            });
          }}
        >
          <span>{node.title}</span>
          <ChevronDown size={15} className={expanded ? "is-rotated" : ""} />
        </button>
        {expanded && node.children.length > 0 && (
          <ul className="contents-mind-leaves">
            {node.children.map(child => (
              <li key={child.id}>
                <button
                  type="button"
                  className={`contents-mind-leaf ${selectedMindNode === child.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedMindNode(child.id)}
                >
                  {child.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <main className="contents-page">
      <header className="contents-masthead">
        <div className="contents-masthead-copy">
          <div className="contents-eyebrow">
            <span className="contents-eyebrow-dot" /> Estudo guiado · ambiente
            demo
          </div>
          <SectionHeading
            eyebrow="CONTEÚDOS"
            title="Aprenda um bloco de cada vez."
            description="Teoria clara, prática ativa e uma rota de estudo que você pode ajustar no caminho."
          />
        </div>
        <div className="contents-masthead-side">
          <div className="contents-focus-badge">
            <Target size={17} />
            <span>
              <strong>{state.profile.concurso || "Seu concurso"}</strong>
              <small>Seu foco atual</small>
            </span>
          </div>
          <Frog pose="support" className="contents-frog" decorative />
        </div>
      </header>

      <div className="contents-selector-row">
        <SelectField
          label="Disciplina em foco"
          value={subjectId}
          onChange={changeSubject}
          className="contents-subject-select"
        >
          <option value="portugues">Língua Portuguesa</option>
          <option value="constitucional">Direito Constitucional</option>
          <option value="administrativo">Direito Administrativo</option>
        </SelectField>
        <div className="contents-selector-note">
          <BookOpen size={15} />
          <span>Material original para estudo demonstrativo</span>
        </div>
      </div>

      <Tabs items={tabs} value={activeTab} onChange={changeTab} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={activeTab}
          className="contents-tab-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "guia" && (
            <div className="contents-guide-layout">
              <div className="contents-guide-main">
                <Card className="contents-guide-intro">
                  <div className="contents-card-topline">
                    <Tag tone="purple">GUIA TEÓRICO</Tag>
                    <span className="contents-read-time">
                      <Clock3 size={14} /> Leitura rápida
                    </span>
                  </div>
                  <h2>{subject.subtitle}</h2>
                  <p>
                    {subject.label} · explicação resumida com exemplos e pontos
                    de atenção para prova.
                  </p>
                  <div className="contents-structured-summary">
                    <div className="contents-summary-heading">
                      <Lightbulb size={17} />
                      <strong>Resumo esquematizado</strong>
                    </div>
                    <ol>
                      {subject.summary.map((item, index) => (
                        <li key={item}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <p>{item}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </Card>
                <Card className="contents-theory-card">
                  <div className="contents-theory-header">
                    <div>
                      <span className="contents-small-label">
                        CONTEÚDO ORIGINAL
                      </span>
                      <h3>Entenda a regra</h3>
                    </div>
                    <Tag tone="green">Material de estudo</Tag>
                  </div>
                  <div className="contents-theory-body">
                    {subject.content.map(section => (
                      <section key={section.heading}>
                        <h4>{section.heading}</h4>
                        {section.paragraphs.map(paragraph => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </section>
                    ))}
                  </div>
                  <div className="contents-guide-callout">
                    <Sparkles size={16} />
                    <span>
                      Depois da leitura, abra <strong>Fixação</strong> para
                      revisar o mesmo assunto com mapa mental e cartões.
                    </span>
                  </div>
                </Card>
              </div>
              <aside className="contents-guide-rail">
                <Card className="contents-guide-side-card">
                  <div className="contents-side-icon">
                    <Target size={19} />
                  </div>
                  <span className="contents-small-label">
                    SEU PRÓXIMO PASSO
                  </span>
                  <h3>Leia, recupere, revise.</h3>
                  <p>
                    Estude a explicação e tente lembrar os pontos antes de
                    consultar o resumo.
                  </p>
                  <MechButton
                    small
                    color="purple"
                    onClick={() => changeTab("fixacao")}
                  >
                    Ir para Fixação <ArrowRight size={15} />
                  </MechButton>
                </Card>
                <Card className="contents-guide-side-card contents-stats-card">
                  <span className="contents-small-label">RITMO DE ESTUDO</span>
                  <div className="contents-stat">
                    <strong>{state.completedNodes.length}</strong>
                    <span>etapas concluídas na trilha</span>
                  </div>
                  <div className="contents-stat">
                    <strong>{state.xp.toLocaleString("pt-BR")}</strong>
                    <span>pontos de experiência</span>
                  </div>
                  <DemoNote>
                    Progresso e conteúdo ilustrativos, salvos localmente.
                  </DemoNote>
                </Card>
              </aside>
            </div>
          )}

          {activeTab === "fixacao" && (
            <div className="contents-fixation-layout">
              <div className="contents-section-heading-row">
                <div>
                  <span className="contents-small-label">
                    LEMBRAR É PRATICAR
                  </span>
                  <h2>Fixe o que acabou de estudar.</h2>
                  <p>
                    Escolha um mapa expansível ou recupere a resposta antes de
                    virar o cartão.
                  </p>
                </div>
                <div className="contents-fixation-tabs">
                  <Tabs
                    items={[
                      { id: "mapa", label: "Mapa mental" },
                      { id: "flashcards", label: "Flashcards" },
                    ]}
                    value={fixationView}
                    onChange={value => {
                      if (value === "mapa" || value === "flashcards")
                        setFixationView(value);
                    }}
                  />
                </div>
              </div>
              {fixationView === "mapa" ? (
                <div className="contents-mind-layout">
                  <Card className="contents-mind-card">
                    <div className="contents-mind-heading">
                      <div>
                        <span className="contents-small-label">
                          MAPA MENTAL ·{" "}
                          {subject.shortLabel.toLocaleUpperCase("pt-BR")}
                        </span>
                        <h3>{subject.subtitle}</h3>
                      </div>
                      <span className="contents-node-hint">
                        Toque nos nós para expandir
                      </span>
                    </div>
                    <div
                      className="contents-mindchart"
                      aria-label={`Mapa mental de ${subject.label}`}
                    >
                      <button
                        type="button"
                        className={`contents-mind-root ${selectedMindNode === "root" ? "is-selected" : ""}`}
                        onClick={() => setSelectedMindNode("root")}
                      >
                        {subject.shortLabel}
                        <small>tema central</small>
                      </button>
                      <span
                        className="contents-mind-trunk"
                        aria-hidden="true"
                      />
                      <ul className="contents-mind-branches">
                        {subject.mind.map(mindBranch)}
                      </ul>
                    </div>
                  </Card>
                  <Card className="contents-mind-summary-card">
                    <span className="contents-small-label">RESUMO DO NÓ</span>
                    <h3>{mindSelection?.title ?? subject.shortLabel}</h3>
                    <p>{mindSelection?.summary ?? subject.mindSummary}</p>
                    <div className="contents-mind-hint">
                      <Lightbulb size={16} />
                      <span>
                        Explique este ponto sem olhar. Depois confira o verso de
                        um flashcard.
                      </span>
                    </div>
                    <MechButton
                      small
                      color="purple"
                      onClick={() => {
                        setFixationView("flashcards");
                        setFlipped(false);
                      }}
                    >
                      Praticar com cartões <ArrowRight size={15} />
                    </MechButton>
                  </Card>
                </div>
              ) : (
                <div className="contents-flash-layout">
                  <Card className="contents-flashcard-panel">
                    <div className="contents-flash-meta">
                      <Tag tone="purple">
                        CARTÃO {cardIndex + 1} DE {subject.cards.length}
                      </Tag>
                      <span>{subject.shortLabel}</span>
                    </div>
                    <div
                      className="contents-flash-stage"
                      onClick={() => setFlipped(value => !value)}
                      role="button"
                      tabIndex={0}
                      aria-label={
                        flipped
                          ? "Cartão virado; ativar para mostrar pergunta"
                          : "Mostrar resposta do cartão"
                      }
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setFlipped(value => !value);
                        }
                      }}
                    >
                      <motion.div
                        className="contents-flash-inner"
                        animate={{ rotateY: flipped ? 180 : 0 }}
                        transition={{
                          duration: 0.52,
                          type: "spring",
                          stiffness: 100,
                          damping: 17,
                        }}
                      >
                        <div className="contents-flash-face contents-flash-front">
                          <span className="contents-small-label">PERGUNTA</span>
                          <h3>{currentFlashcard.question}</h3>
                          <span className="contents-flip-hint">
                            Toque ou pressione Enter para revelar
                          </span>
                        </div>
                        <div className="contents-flash-face contents-flash-back">
                          <span className="contents-small-label">RESPOSTA</span>
                          <h3>{currentFlashcard.answer}</h3>
                          <div className="contents-mnemonic">
                            <Lightbulb size={16} />
                            <span>
                              <strong>Mnemônico</strong>
                              {currentFlashcard.mnemonic}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    <div className="contents-flash-controls">
                      <MechButton
                        small
                        color="white"
                        onClick={() => moveFlashcard(-1)}
                      >
                        <ArrowLeft size={15} /> Anterior
                      </MechButton>
                      <MechButton
                        small
                        color={flipped ? "green" : "purple"}
                        onClick={() => setFlipped(value => !value)}
                      >
                        {flipped ? "Ver pergunta" : "Revelar resposta"}
                      </MechButton>
                      <MechButton
                        small
                        color="white"
                        onClick={() => moveFlashcard(1)}
                      >
                        Próximo <ArrowRight size={15} />
                      </MechButton>
                    </div>
                  </Card>
                  <Card className="contents-flash-tip">
                    <div className="contents-side-icon">
                      <Lightbulb size={19} />
                    </div>
                    <span className="contents-small-label">
                      RECUPERAÇÃO ATIVA
                    </span>
                    <h3>Tente responder antes de virar.</h3>
                    <p>
                      Faça uma pausa, formule a resposta em voz alta e só então
                      confira o verso e o mnemônico.
                    </p>
                    <DemoNote>Cartões demonstrativos para revisão.</DemoNote>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "cronograma" && (
            <div className="contents-schedule-layout">
              <div className="contents-section-heading-row contents-schedule-heading">
                <div>
                  <span className="contents-small-label">
                    UMA SEMANA DE CADA VEZ
                  </span>
                  <h2>Sua rota de estudo.</h2>
                  <p>
                    Alterne teoria e questões; conclua as tarefas para registrar
                    seu ritmo neste dispositivo.
                  </p>
                </div>
                <MechButton color="purple" onClick={recalculateRoute}>
                  <RotateCcw size={16} /> Recalcular rota
                </MechButton>
              </div>
              <div
                className={`contents-schedule-status ${overdueCount > 0 ? "has-late" : "is-on-track"}`}
              >
                <span className="contents-status-icon">
                  {overdueCount > 0 ? (
                    <Clock3 size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                </span>
                <div>
                  <strong>
                    {overdueCount > 0
                      ? `${overdueCount} tarefa(s) semanal(is) em atraso`
                      : "Sua semana está em dia"}
                  </strong>
                  <p>
                    {overdueCount > 0
                      ? "Pendências anteriores a hoje aparecem destacadas. Recalcule para distribuí-las pelos próximos dias."
                      : "As tarefas pendentes de hoje e dos próximos dias continuam na sua rota."}
                  </p>
                </div>
                <Tag tone={overdueCount > 0 ? "coral" : "green"}>
                  {state.scheduleRevision === 0
                    ? "Rota original"
                    : `Rota ${state.scheduleRevision}`}
                </Tag>
              </div>
              {scheduleMessage && (
                <div className="contents-schedule-message" role="status">
                  <Check size={16} />
                  <span>{scheduleMessage}</span>
                </div>
              )}
              <div
                className="contents-week-grid"
                aria-label="Cronograma da semana"
              >
                {days.map(day => {
                  const dayTasks = calendarTasks.filter(
                    task => task.dueDate === day.dateKey
                  );
                  const isToday = day.dateKey === todayKey;
                  return (
                    <article
                      className={`contents-day-card ${isToday ? "is-today" : ""}`}
                      key={day.dateKey}
                    >
                      <header>
                        <span>{day.weekday}</span>
                        <strong>
                          {formatDate(day.date, {
                            day: "2-digit",
                            month: "short",
                          })}
                        </strong>
                        {isToday && <small>Hoje</small>}
                      </header>
                      <div className="contents-day-tasks">
                        {dayTasks.length ? (
                          dayTasks.map(taskButton)
                        ) : (
                          <div className="contents-empty-day">
                            Sem tarefa marcada
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="contents-spaced-section">
                <div className="contents-spaced-heading">
                  <div>
                    <span className="contents-small-label">
                      REVISÃO ESPAÇADA
                    </span>
                    <h3>Volte ao conteúdo nos intervalos certos.</h3>
                  </div>
                  <p>Marcos demonstrativos a partir de hoje.</p>
                </div>
                <div className="contents-spaced-grid">
                  {spacedIntervals.map(interval => {
                    const task = spacedTasks.find(
                      item => item.interval === interval.label
                    )!;
                    const done = completedTaskIds.includes(task.id);
                    return (
                      <Card
                        className={`contents-spaced-card ${done ? "is-done" : ""}`}
                        key={interval.label}
                      >
                        <div className="contents-spaced-card-top">
                          <Tag
                            tone={
                              interval.days === 1
                                ? "purple"
                                : interval.days === 7
                                  ? "green"
                                  : "muted"
                            }
                          >
                            {interval.label}
                          </Tag>
                          <span>
                            {formatDate(addDays(today, interval.days), {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <strong>{interval.detail}</strong>
                        <p>{task.title}</p>
                        <button
                          type="button"
                          className="contents-review-toggle"
                          aria-pressed={done}
                          onClick={() => toggleTask(task.id)}
                        >
                          {done ? (
                            <>
                              <Check size={14} /> Concluída
                            </>
                          ) : (
                            "Marcar como concluída"
                          )}
                        </button>
                      </Card>
                    );
                  })}
                </div>
              </div>
              <DemoNote>
                As tarefas concluídas ficam salvas localmente. Recalcular
                reorganiza as pendências da semana sem alterar os marcos
                espaçados.
              </DemoNote>
            </div>
          )}

          {activeTab === "redacao" && (
            <div className="contents-essay-layout">
              <div className="contents-section-heading-row contents-essay-heading">
                <div>
                  <span className="contents-small-label">
                    TREINO DE REDAÇÃO
                  </span>
                  <h2>Escreva, conte e revise.</h2>
                  <p>
                    Editor local com limite de linhas e uma régua demonstrativa
                    de correção.
                  </p>
                </div>
                <Tag tone="coral">Sem avaliação por IA</Tag>
              </div>
              <div className="contents-essay-grid">
                <Card className="contents-essay-editor-card">
                  <div className="contents-essay-prompt">
                    <div className="contents-prompt-icon">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="contents-small-label">
                        TEMA DE TREINO · DEMONSTRATIVO
                      </span>
                      <h3>
                        A eficiência da Administração Pública na prestação de
                        serviços à sociedade
                      </h3>
                    </div>
                  </div>
                  <div className="contents-essay-controls">
                    <SelectField
                      label="Banca de referência"
                      value={selectedBank}
                      onChange={changeBank}
                      className="contents-bank-select"
                    >
                      {banks.map(bank => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </SelectField>
                    <div
                      className={`contents-line-meter ${isEssayOverLimit ? "is-over" : ""}`}
                      aria-live="polite"
                    >
                      <strong>{essayLines}</strong>
                      <span>/{lineLimit} linhas</span>
                      <small>
                        Largura atual: ~{essayMetrics.columns} caracteres ·
                        contagem visual
                      </small>
                    </div>
                  </div>
                  <label
                    className="contents-essay-label"
                    htmlFor="contents-essay-text"
                  >
                    Seu texto
                  </label>
                  <textarea
                    id="contents-essay-text"
                    ref={essayRef}
                    maxLength={15000}
                    className={`contents-essay-textarea ${isEssayOverLimit ? "is-over-limit" : ""}`}
                    value={state.writing}
                    onChange={event => {
                      setWriting(event.target.value);
                      setEssayResult(null);
                    }}
                    placeholder="Comece pela sua tese. Separe os parágrafos com uma linha em branco e desenvolva uma proposta para o tema..."
                    spellCheck
                    aria-describedby="contents-essay-limit-help"
                  />
                  <div className="contents-essay-helper-row">
                    <span>
                      {essayWords} palavras · mínimo {minimumWords}
                    </span>
                    <span
                      id="contents-essay-limit-help"
                      className={isEssayOverLimit ? "is-error" : ""}
                    >
                      {isEssayOverLimit
                        ? `Limite excedido: reduza para ${lineLimit} linhas.`
                        : `Limite claro: até ${lineLimit} linhas, incluindo quebras e linhas preenchidas.`}
                    </span>
                  </div>
                  <div className="contents-essay-actions">
                    <MechButton color="purple" onClick={evaluateWriting}>
                      <Sparkles size={16} /> Avaliação demonstrativa
                    </MechButton>
                    <span>
                      Regras locais ilustrativas · não é correção oficial
                    </span>
                  </div>
                  <div className="contents-essay-rule-note">
                    <strong>O que a demonstração verifica:</strong> separação de
                    parágrafos e alguns marcadores de fechamento; espaços duplos
                    e pontuação; quatro termos do tema. Não analisa repertório,
                    coesão ou gramática de forma completa.
                  </div>
                </Card>
                <aside className="contents-essay-aside">
                  <Card className="contents-essay-criteria-card">
                    <div className="contents-criteria-title">
                      <div>
                        <span className="contents-small-label">
                          RÉGUA ILUSTRATIVA
                        </span>
                        <h3>Critérios de referência</h3>
                      </div>
                      <Tag tone="purple">{selectedBank}</Tag>
                    </div>
                    <div className="contents-criteria-list">
                      {[
                        {
                          title: "Estrutura",
                          detail: `Peso ${bankWeights[selectedBank]?.structure ?? 30}%`,
                          icon: <BookOpen size={16} />,
                        },
                        {
                          title: "Gramática",
                          detail: `Peso ${bankWeights[selectedBank]?.grammar ?? 30}%`,
                          icon: <Check size={16} />,
                        },
                        {
                          title: "Conteúdo",
                          detail: `Peso ${bankWeights[selectedBank]?.content ?? 40}%`,
                          icon: <Target size={16} />,
                        },
                      ].map(item => (
                        <div className="contents-criterion" key={item.title}>
                          <span className="contents-criterion-icon">
                            {item.icon}
                          </span>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                        </div>
                      ))}
                    </div>
                    {essayResult ? (
                      <div
                        className="contents-evaluation-result"
                        aria-live="polite"
                      >
                        <div className="contents-total-score">
                          <span>Nota total ilustrativa</span>
                          <strong>
                            {essayResult.total}
                            <small>/100</small>
                          </strong>
                        </div>
                        {essayResult.notes.map(note => (
                          <div
                            className="contents-score-row"
                            key={note.criterion}
                          >
                            <div>
                              <strong>{note.criterion}</strong>
                              <b>{note.score}/10</b>
                            </div>
                            <p>{note.note}</p>
                          </div>
                        ))}
                        <div className="contents-rewrite-suggestions">
                          <h4>Sugestões de reescrita</h4>
                          <ul>
                            {essayResult.suggestions.map(suggestion => (
                              <li key={suggestion}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="contents-rewrite-example">
                          <span className="contents-small-label">
                            EXEMPLO DE DESENVOLVIMENTO
                          </span>
                          <p>
                            Para que a Administração Pública transforme direitos
                            em serviços de qualidade, é preciso combinar
                            planejamento, transparência e avaliação. Eficiência
                            não significa apenas fazer mais: significa entregar
                            resultados com responsabilidade e respeito à
                            legalidade. Metas claras, formação das equipes e
                            acompanhamento de indicadores ajudam a aproximar a
                            gestão das necessidades da população.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="contents-criteria-empty">
                        <div className="contents-score-placeholder">
                          —<small>/100</small>
                        </div>
                        <p>
                          Escreva ao menos {minimumWords} palavras e solicite a
                          demonstração para ver notas por critério, sugestões e
                          exemplo.
                        </p>
                      </div>
                    )}
                  </Card>
                  <Card className="contents-frog-note">
                    <Frog
                      pose="support"
                      className="contents-frog-small"
                      decorative
                    />
                    <div>
                      <strong>Um rascunho é um começo.</strong>
                      <p>
                        Esta ferramenta não usa IA e não substitui a correção da
                        banca ou de uma pessoa especialista.
                      </p>
                    </div>
                  </Card>
                </aside>
              </div>
            </div>
          )}
        </motion.section>
      </AnimatePresence>
      <DemoNote>
        UltraConcursos IA em modo demonstrativo. Conteúdos, notas e recursos não
        são gerados nem avaliados por IA.
      </DemoNote>
    </main>
  );
}

export default Contents;
