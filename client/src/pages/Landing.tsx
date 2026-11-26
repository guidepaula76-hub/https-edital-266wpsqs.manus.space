import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Check,
  Sparkles,
  Flame,
  Star,
  Route,
  BookOpen,
  Brain,
  Target,
  ChevronDown,
  ShieldCheck,
  Heart,
  LockKeyhole,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import {
  Brand,
  Frog,
  MechButton,
  ProgressBar,
  Tag,
} from "@/components/ultra/UI";
import "./landing.css";
const faqs = [
  [
    "Posso estudar para qualquer concurso?",
    "Sim. A estrutura permite escolher concurso, cargo, nível e banca, além de organizar os tópicos do edital. Nesta etapa, o banco de questões e os planos são exemplos demonstrativos.",
  ],
  [
    "Como funciona a trilha de estudos?",
    "Você avança por unidades curtas. Cada sessão concluída soma XP e libera o próximo tópico. Depois de concluir o Nível 1, o Nível 2 é liberado com os mesmos temas e questões mais difíceis.",
  ],
  [
    "É possível instalar no celular?",
    "O UltraConcursos IA é um PWA. Em um navegador compatível e no site publicado em HTTPS, você pode adicioná-lo à tela inicial. No iPhone, use Compartilhar → Adicionar à Tela de Início no Safari.",
  ],
  [
    "Os recursos de IA já estão conectados?",
    "Esta é a Etapa 1: um protótipo completo de frontend. Tutor, correção, login e ranking usam demonstrações locais, sem IA real, autenticação ou dados de outros usuários.",
  ],
];
export default function Landing() {
  const [, navigate] = useLocation();
  const [faq, setFaq] = useState<number | null>(0);
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-nav">
          <Brand />
          <nav aria-label="Menu do site">
            <a href="#como-funciona">Como funciona</a>
            <a href="#sua-trilha">Sua trilha</a>
            <a href="#por-que-ultra">Por que Ultra?</a>
          </nav>
          <MechButton color="white" small onClick={() => navigate("/login")}>
            Já tenho conta <ArrowRight size={15} />
          </MechButton>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <motion.div
              className="hero-pill"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span>
                <Sparkles size={13} />
              </span>
              SEU FUTURO, UM PASSO DE CADA VEZ
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Sua aprovação
              <br />
              começa com um
              <br />
              <span>
                estudo mais leve.
                <i />
              </span>
            </motion.h1>
            <motion.p
              className="hero-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Transforme o edital em uma jornada que dá vontade de continuar.
              Trilhas inteligentes, questões da sua banca e pequenas conquistas
              todos os dias.
            </motion.p>
            <div className="hero-actions">
              <MechButton onClick={() => navigate("/cadastro")}>
                Começar Agora <ArrowRight size={18} />
              </MechButton>
              <MechButton color="white" onClick={() => navigate("/app")}>
                Explorar a plataforma
              </MechButton>
            </div>
            <div className="hero-confidence">
              <span>
                <Check size={13} /> No seu ritmo
              </span>
              <span>
                <Check size={13} /> Para a sua banca
              </span>
              <span>
                <Check size={13} /> Sem complicação
              </span>
            </div>
            <div className="hero-mini-social">
              <div className="social-avatars">
                <b>G</b>
                <b>A</b>
                <b>M</b>
              </div>
              <div>
                <div className="star-row">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star size={11} fill="currentColor" key={i} />
                  ))}
                  <span>Aprender. Evoluir. Conquistar.</span>
                </div>
                <p>Uma nova experiência para quem sonha grande.</p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit">
              <div className="orbit-line one" />
              <div className="orbit-line two" />
              <span className="orbit-spark spark-one">✦</span>
              <span className="orbit-spark spark-two">✦</span>
              <span className="orbit-dot" />
            </div>
            <div className="hero-steps" aria-hidden="true">
              <div className="mini-step done">
                <Check size={21} />
              </div>
              <div className="mini-step done two">
                <Check size={21} />
              </div>
              <div className="mini-step active">
                <Star size={24} fill="currentColor" />
              </div>
              <div className="mini-step locked">
                <LockKeyhole size={20} />
              </div>
            </div>
            <Frog pose="cheer" className="hero-frog" />
            <motion.div
              className="floating-xp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <span className="float-icon">
                <Sparkles size={22} />
              </span>
              <div>
                <strong>+50 XP</strong>
                <small>Um passo mais perto!</small>
              </div>
            </motion.div>
            <div className="floating-streak">
              <Flame size={28} />
              <div>
                <strong>7 dias</strong>
                <small>Constância é superpoder.</small>
              </div>
            </div>
            <div className="hero-unit">
              <span className="unit-check">
                <Check size={18} />
              </span>
              <div>
                <strong>Pequenas metas. Grandes vitórias.</strong>
                <p>Um tópico de cada vez, até a aprovação.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="board-strip">
          <div className="board-strip-inner">
            <span>
              PREPARE-SE PARA
              <br />
              <strong>A SUA BANCA.</strong>
            </span>
            <div className="board-names">
              <b>CEBRASPE</b>
              <b className="fgv-brand">FGV</b>
              <b>FCC</b>
              <b>VUNESP</b>
              <b className="ces-brand">Cesgranrio</b>
              <b>IBFC</b>
              <span>e muitas outras</span>
            </div>
          </div>
        </section>
        <section id="como-funciona" className="landing-section how-section">
          <div className="landing-section-title">
            <div className="eyebrow">MENOS PRESSÃO. MAIS DIREÇÃO.</div>
            <h2>O seu edital virou uma jornada.</h2>
            <p>
              Você cuida do sonho. A gente ajuda a organizar o próximo passo.
            </p>
          </div>
          <div className="how-grid">
            {[
              {
                n: "01",
                icon: Target,
                title: "Escolha seu objetivo",
                text: "Seu concurso, seu cargo e sua banca. Um ponto de partida feito para você.",
                color: "green",
              },
              {
                n: "02",
                icon: Route,
                title: "Siga a sua trilha",
                text: "Teoria, prática e revisão em sessões curtas. Cada etapa leva você adiante.",
                color: "purple",
              },
              {
                n: "03",
                icon: Trophy,
                title: "Veja sua evolução",
                text: "Acumule XP, mantenha a ofensiva e transforme constância em conquista.",
                color: "coral",
              },
            ].map(item => (
              <motion.div
                key={item.n}
                className={`how-card how-${item.color}`}
                whileHover={{ y: -4 }}
              >
                <div className="row-between">
                  <span className="how-icon">
                    <item.icon size={24} />
                  </span>
                  <span className="how-number">{item.n}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
        <section id="sua-trilha" className="landing-section product-section">
          <div className="product-preview">
            <div className="preview-unit-heading">
              <div>
                <small>SEÇÃO 1 · LÍNGUA PORTUGUESA</small>
                <strong>Seu próximo passo está aqui.</strong>
              </div>
              <BookOpen size={21} />
            </div>
            <div className="preview-path">
              <span className="preview-dotted" />
              <button
                className="preview-node complete"
                onClick={() => navigate("/app/trilha")}
                aria-label="Explorar unidade concluída"
              >
                <Check size={25} />
              </button>
              <button
                className="preview-node current"
                onClick={() => navigate("/app/trilha")}
                aria-label="Explorar unidade ativa"
              >
                <Star size={27} fill="currentColor" />
              </button>
              <button
                className="preview-node lock"
                onClick={() => navigate("/app/trilha")}
                aria-label="Explorar a trilha"
              >
                <LockKeyhole size={23} />
              </button>
              <div className="preview-bubble">Bora dar mais um salto?</div>
              <Frog pose="support" decorative className="preview-frog" />
            </div>
            <div className="preview-progress">
              <span>Seu progresso no edital</span>
              <strong>32%</strong>
              <ProgressBar value={32} color="purple" />
            </div>
          </div>
          <div className="product-copy">
            <Tag tone="purple">
              <Route size={12} /> UMA JORNADA QUE EVOLUI COM VOCÊ
            </Tag>
            <h2>
              Disciplina não precisa
              <br />
              ser um peso.
            </h2>
            <p>
              Uma trilha clara, um companheiro de estudos e a sensação boa de
              avançar. O próximo nível chega quando você está pronto.
            </p>
            <div className="product-benefits">
              <div>
                <span>
                  <Check size={16} />
                </span>
                <div>
                  <strong>Etapas pequenas, objetivos reais</strong>
                  <p>Estude o que importa, sem se perder no edital.</p>
                </div>
              </div>
              <div>
                <span>
                  <Check size={16} />
                </span>
                <div>
                  <strong>Questões no estilo da sua banca</strong>
                  <p>Certo ou errado, quatro ou cinco alternativas.</p>
                </div>
              </div>
              <div>
                <span>
                  <Check size={16} />
                </span>
                <div>
                  <strong>Um novo desafio a cada nível</strong>
                  <p>Os mesmos temas, com mais profundidade.</p>
                </div>
              </div>
            </div>
            <MechButton color="purple" onClick={() => navigate("/app/trilha")}>
              Conhecer minha trilha <ArrowRight size={17} />
            </MechButton>
          </div>
        </section>
        <section id="por-que-ultra" className="landing-section tools-section">
          <div className="landing-section-title">
            <div className="eyebrow">TODO O SEU ESTUDO. UM SÓ LUGAR.</div>
            <h2>Ferramentas sérias. Experiência leve.</h2>
            <p>
              Do primeiro tópico à última revisão, uma rotina com mais clareza.
            </p>
          </div>
          <div className="tools-grid">
            {[
              {
                icon: Brain,
                title: "Fixação que fica",
                text: "Mapas mentais, resumos e flashcards para revisar com menos esforço.",
                path: "/app/conteudos?tab=fixacao",
              },
              {
                icon: ListChecksIcon,
                title: "Prática com propósito",
                text: "Gabaritos comentados e pegadinhas da banca. Entenda, não só decore.",
                path: "/app/questoes",
              },
              {
                icon: Flame,
                title: "Constância que motiva",
                text: "XP, ofensiva e metas possíveis. Celebre cada dia de evolução.",
                path: "/app",
              },
              {
                icon: ShieldCheck,
                title: "Sua prova, sem sustos",
                text: "Simulados em modo foco e um caderno de erros para aprender de verdade.",
                path: "/app/questoes?mode=simulado",
              },
            ].map((item, i) => (
              <button
                className="tool-card"
                key={item.title}
                onClick={() => navigate(item.path)}
              >
                <span className={`tool-icon tool-${i}`}>
                  <item.icon size={25} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="tool-link">
                  Explorar recurso <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="landing-section stories-section">
          <div className="landing-section-title">
            <div className="eyebrow">CADA PESSOA, UM NOVO CAPÍTULO.</div>
            <h2>O que uma rotina mais leve pode mudar.</h2>
          </div>
          <div className="stories-grid">
            {[
              {
                name: "Ana Martins",
                role: "Área administrativa",
                letter: "A",
                quote:
                  "“A trilha ajuda a enxergar o próximo passo. O edital deixa de parecer uma lista infinita.”",
              },
              {
                name: "Gabriel Costa",
                role: "Carreira policial",
                letter: "G",
                quote:
                  "“O comentário depois da questão faz a diferença. Dá para entender o erro e seguir em frente.”",
              },
              {
                name: "Marina Lima",
                role: "Tribunais",
                letter: "M",
                quote:
                  "“Metas pequenas tornam o estudo mais possível. Gosto de ver cada unidade ficando completa.”",
              },
            ].map((s, i) => (
              <article className="story-card" key={s.name}>
                <div className="story-stars">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star size={12} fill="currentColor" key={j} />
                  ))}
                </div>
                <p>{s.quote}</p>
                <div className="story-person">
                  <b className={`story-avatar avatar-${i}`}>{s.letter}</b>
                  <div>
                    <strong>{s.name}</strong>
                    <small>{s.role}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="stories-disclaimer">
            Depoimentos e pessoas fictícios, usados para apresentar a
            experiência do protótipo.
          </p>
        </section>
        <section className="landing-section faq-section">
          <div>
            <div className="eyebrow">UM SALTO DE CADA VEZ.</div>
            <h2>Ainda tem alguma dúvida?</h2>
            <p>O caminho fica melhor quando tudo é claro.</p>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a], i) => (
              <div className={`faq-item ${faq === i ? "open" : ""}`} key={q}>
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  aria-expanded={faq === i}
                >
                  {q}
                  <ChevronDown size={18} />
                </button>
                {faq === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </section>
        <section className="landing-final-cta">
          <div>
            <Tag tone="green">
              <Heart size={12} /> SEU SONHO MERECE ESSA CHANCE
            </Tag>
            <h2>
              O primeiro passo
              <br />
              pode ser hoje.
            </h2>
            <p>
              Comece uma jornada de estudos mais leve.
              <br />
              Seu futuro vai gostar dessa ideia.
            </p>
            <MechButton onClick={() => navigate("/cadastro")}>
              Começar Agora <ArrowRight size={18} />
            </MechButton>
          </div>
          <Frog pose="study" className="final-frog" />
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <span>Pequenos passos. Grandes conquistas.</span>
        <small>© 2026 UltraConcursos IA · Protótipo demonstrativo</small>
        <button onClick={() => navigate("/app/perfil")}>
          Preferências e instalação
        </button>
      </footer>
    </div>
  );
}
function ListChecksIcon(props: { size?: number }) {
  return <BookOpen {...props} />;
}
