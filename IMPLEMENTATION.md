# Contrato de implementação

Projeto React TypeScript Vite. Código importado com `@/`. Estilos comuns em `client/src/index.css`; cada feature importa seu próprio CSS. Não editar os arquivos compartilhados ao delegar.

`@/components/ultra/UI` exporta MechButton (`color`: green/purple/white/coral/navy, `small`, props motion.button incl onClick/disabled/type), Card (children/className), Frog (`pose`: study/cheer/support), Tag (tone purple/green/coral/muted), ProgressBar(value 0..100, color), SectionHeading(eyebrow/title/description/action), Tabs(items [{id,label}],value,onChange), Modal(title,onClose,children), DemoNote.

`@/lib/progress` exporta `useProgress()` -> {state,updateProfile,recordAnswer,completeLesson,setSound,setWriting,recalculateSchedule,resetProgress}. state.profile = name,concurso,cargo,nivel,banca,format 'CE'|'AD'|'AE',hours,examDate,editalTopics; state.xp,streak,completedNodes ('l1-0' etc),answers [{id,correct,blank?}],errorIds,sound,dailyGoal,lastStudyDay,scheduleRevision,writing.
recordAnswer({id,correct,blank?}) actualiza respostas e erros, XP +15 por acerto novo. completeLesson(level,index) inclui `l{level}-{index}` e soma 50 XP. Seis nós em cada nível; início com l1-0/l1-1 concluídos. Nível 2 desbloqueia ao concluir os 6 nós N1. Guia/conteúdo pode navegar `/app/conteudos?tab=guia`. Sessão de trilha `/app/questoes?lesson=2&level=1` (índice de nó 0..5). Modo erro `/app/questoes?error=ID`. Modo simulado `/app/questoes?mode=simulado`.

Wouter useLocation navegar. A aplicação proverá Shell, ProgressProvider, ThemeProvider (useTheme theme,toggleTheme) e MotionConfig reducedMotion=user. `toast` de sonner disponível.

Rotas finais landing /, /login, /cadastro, /onboarding, /app, /app/trilha, /app/questoes, /app/conteudos, /app/ranking, /app/perfil. Dados e recursos IA demonstrativos claramente rotulados.

Paleta CSS: --background, --foreground, --card, --line, --muted, --soft, --green, --green-dark, --purple, --purple-dark, --coral, --coral-dark, --mint-bg, --purple-bg, --coral-bg. Modo escuro por `.dark` e variáveis. Tipografia Nunito Sans / DM Sans. Layout mobile-first sem overflow horizontal. Todos CTAs e respostas MechButton.
