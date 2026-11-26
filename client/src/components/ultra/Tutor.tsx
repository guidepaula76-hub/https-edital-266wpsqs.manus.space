import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, MessageCircle } from "lucide-react";
import { Frog, MechButton } from "./UI";
interface Message {
  who: "tutor" | "student";
  text: string;
}
function responseFor(text: string) {
  const q = text.toLowerCase();
  if (/crase|portugu|gramática/.test(q))
    return "Vamos por partes: a crase combina a preposição “a” com o artigo “a”. Experimente trocar a palavra feminina por uma masculina: se aparecer “ao”, é um bom indício de crase. Exemplo: fui à escola → fui ao colégio. Quer praticar? Abra Questões e escolha Língua Portuguesa. Esta é uma resposta demonstrativa preparada para a interface.";
  if (/edital|plano|cronograma|atras/.test(q))
    return "Um plano leve começa com um objetivo possível: alterne teoria, questões e revisões. Em Conteúdos → Cronograma, você pode reorganizar as tarefas com “Recalcular rota”. No seu edital, marque um tópico pequeno de cada vez. Esta orientação é demonstrativa, não uma análise de IA do seu edital.";
  if (/constit|direito|princípio|limpe/.test(q))
    return "Lembre de LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência. São princípios expressos da administração pública no art. 37 da Constituição. Uma pegadinha comum é trocar eficiência por eficácia. O Guia e os flashcards em Conteúdos ajudam a revisar. Resposta demonstrativa pré-definida.";
  if (/erro|err|difícil|cansa|desanim/.test(q))
    return "Errar faz parte do caminho. Releia o comentário, identifique o detalhe que confundiu você e refaça a questão no Caderno de Erros, dentro do Perfil. Uma sessão curta e consistente vale mais que tentar fazer tudo de uma vez. Estou aqui como tutor demonstrativo nesta etapa.";
  return "Vamos transformar a dúvida em um pequeno passo: selecione uma disciplina em Questões, resolva um item e leia o gabarito comentado. Também posso mostrar dicas pré-definidas de crase, princípios administrativos, edital e rotina de revisão. Neste protótipo, minhas respostas são demonstrativas — ainda não há IA conectada.";
}
export default function Tutor() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      who: "tutor",
      text: "Oi! Eu sou o seu companheiro de estudos. Quer revisar um conceito ou organizar seu próximo passo? Nesta etapa, o chat tem respostas demonstrativas.",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typing]);
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    []
  );
  const send = (value = text) => {
    if (!value.trim() || typing) return;
    setMessages(m => [...m, { who: "student", text: value.trim() }]);
    setText("");
    setTyping(true);
    timeout.current = setTimeout(() => {
      setMessages(m => [...m, { who: "tutor", text: responseFor(value) }]);
      setTyping(false);
    }, 650);
  };
  return (
    <div className="tutor-widget">
      <AnimatePresence>
        {open && (
          <motion.aside
            className="tutor-panel"
            role="dialog"
            aria-label="Tutor IA 24h demonstrativo"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
          >
            <header>
              <div className="inline-row">
                <span className="tutor-icon">
                  <Sparkles size={20} />
                </span>
                <div>
                  <strong>Tutor IA 24h</strong>
                  <small>Seu companheiro de estudos · Demo</small>
                </div>
              </div>
              <button
                className="icon-button"
                onClick={() => setOpen(false)}
                aria-label="Fechar tutor"
              >
                <X size={18} />
              </button>
            </header>
            <div className="tutor-messages" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`tutor-message ${m.who}`}>
                  {m.text}
                </div>
              ))}
              {typing && (
                <div className="tutor-typing">Preparando uma dica…</div>
              )}
              <div ref={bottom} />
            </div>
            {messages.length < 3 && (
              <div className="tutor-suggestions">
                {["Como revisar crase?", "Organizar meu edital"].map(s => (
                  <button key={s} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              className="tutor-input"
              onSubmit={e => {
                e.preventDefault();
                send();
              }}
            >
              <input
                aria-label="Mensagem para o tutor"
                placeholder="Qual é a sua dúvida?"
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={1200}
              />
              <MechButton
                small
                color="purple"
                type="submit"
                aria-label="Enviar mensagem"
                disabled={!text.trim() || typing}
              >
                <Send size={17} />
              </MechButton>
            </form>
            <div className="tutor-disclaimer">
              Respostas locais de exemplo. IA não conectada.
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <MechButton
        className="tutor-trigger"
        small
        color="purple"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Fechar tutor" : "Abrir Tutor IA 24h"}
      >
        <MessageCircle size={19} />
        <span>Tutor IA</span>
        <i />
      </MechButton>
    </div>
  );
}
