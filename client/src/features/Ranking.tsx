import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Award, Crown, Flame, Medal, ShieldCheck, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { Card, DemoNote, MechButton, SectionHeading, Tabs, Tag } from '@/components/ultra/UI';
import { useProgress } from '@/lib/progress';
import './journey.css';

type Scope = 'nacional' | 'concurso';
type Period = 'semana' | 'sempre';
type Learner = { id: string; name: string; xp: number; initials?: string; current?: boolean };

const demos: Record<Scope, Record<Period, Learner[]>> = {
  nacional: {
    semana: [
      { id: 'ana', name: 'Ana Beatriz', xp: 2680 }, { id: 'rafael', name: 'Rafael M.', xp: 2310 },
      { id: 'luiza', name: 'Luiza Costa', xp: 1980 }, { id: 'marcos', name: 'Marcos A.', xp: 1720 },
      { id: 'julia', name: 'Júlia Martins', xp: 1490 }, { id: 'pedro', name: 'Pedro Lima', xp: 1110 },
      { id: 'bia', name: 'Beatriz R.', xp: 960 }, { id: 'leo', name: 'Leonardo S.', xp: 780 },
    ],
    sempre: [
      { id: 'rafael', name: 'Rafael M.', xp: 12840 }, { id: 'ana', name: 'Ana Beatriz', xp: 11760 },
      { id: 'luiza', name: 'Luiza Costa', xp: 10420 }, { id: 'marcos', name: 'Marcos A.', xp: 9660 },
      { id: 'julia', name: 'Júlia Martins', xp: 8440 }, { id: 'pedro', name: 'Pedro Lima', xp: 7280 },
      { id: 'bia', name: 'Beatriz R.', xp: 6150 }, { id: 'leo', name: 'Leonardo S.', xp: 4920 },
    ],
  },
  concurso: {
    semana: [
      { id: 'nina', name: 'Nina Oliveira', xp: 1840 }, { id: 'caio', name: 'Caio Ferreira', xp: 1560 },
      { id: 'isa', name: 'Isabela Nunes', xp: 1390 }, { id: 'luiz', name: 'Luiz Felipe', xp: 1080 },
      { id: 'bia', name: 'Bianca Souza', xp: 890 }, { id: 'joao', name: 'João V.', xp: 710 },
      { id: 'maira', name: 'Maíra Costa', xp: 590 }, { id: 'davi', name: 'Davi Rocha', xp: 430 },
    ],
    sempre: [
      { id: 'caio', name: 'Caio Ferreira', xp: 6240 }, { id: 'nina', name: 'Nina Oliveira', xp: 5890 },
      { id: 'isa', name: 'Isabela Nunes', xp: 5360 }, { id: 'luiz', name: 'Luiz Felipe', xp: 4780 },
      { id: 'bia', name: 'Bianca Souza', xp: 4190 }, { id: 'joao', name: 'João V.', xp: 3670 },
      { id: 'maira', name: 'Maíra Costa', xp: 2980 }, { id: 'davi', name: 'Davi Rocha', xp: 2310 },
    ],
  },
};

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function Podium({ learners }: { learners: Learner[] }) {
  const order = [learners[1], learners[0], learners[2]].filter(Boolean);
  return <div className="ranking-podium" aria-label="Pódio demonstrativo">
    {order.map(learner => {
      const rank = learners.findIndex(item => item.id === learner.id) + 1;
      return <div className={`ranking-podium-place podium-place-${rank} ${learner.current ? 'is-current' : ''}`} key={learner.id}>
        <div className="ranking-podium-crown">{rank === 1 ? <Crown size={21} fill="currentColor" /> : rank === 2 ? <Medal size={20} /> : <Award size={20} />}</div>
        <div className="ranking-avatar">{initials(learner.name)}</div>
        <strong className="ranking-podium-name">{learner.current ? 'Você' : learner.name}</strong>
        {learner.current && <span className="ranking-you-chip">sua posição</span>}
        <span className="ranking-podium-xp"><Zap size={13} fill="currentColor" /> {learner.xp.toLocaleString('pt-BR')} XP</span>
        <div className="ranking-podium-base"><span>{rank}</span></div>
      </div>;
    })}
  </div>;
}

export default function Ranking() {
  const { state } = useProgress();
  const [, navigate] = useLocation();
  const [scope, setScope] = useState<Scope>('nacional');
  const [period, setPeriod] = useState<Period>('semana');
  const participants = useMemo(() => {
    const current: Learner = { id: 'current-user', name: state.profile.name || 'Você', xp: state.xp, current: true };
    return [...demos[scope][period], current].sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
  }, [scope, period, state.profile.name, state.xp]);
  const currentRank = participants.findIndex(person => person.current) + 1;
  const remaining = participants.slice(3);
  const contestName = state.profile.concurso || 'seu concurso';

  return (
    <main className="journey-page ranking-page">
      <SectionHeading
        eyebrow="Aprender também é celebrar"
        title="Ranking da comunidade"
        description="Uma brincadeira saudável para acompanhar a jornada — sem competição real."
        action={<Tag tone="coral"><Sparkles size={13} /> DEMONSTRAÇÃO</Tag>}
      />

      <div className="ranking-controls-row">
        <div className="ranking-scope-control">
          <span className="ranking-control-label"><Users size={15} /> Classificação</span>
          <Tabs items={[{ id: 'nacional', label: 'Nacional' }, { id: 'concurso', label: contestName }]} value={scope} onChange={value => setScope(value as Scope)} />
        </div>
        <div className="ranking-period-control">
          <span className="ranking-control-label"><Flame size={15} /> Período</span>
          <Tabs items={[{ id: 'semana', label: 'Esta semana' }, { id: 'sempre', label: 'Todo o tempo' }]} value={period} onChange={value => setPeriod(value as Period)} />
        </div>
      </div>

      <Card className="ranking-summary-card">
        <div className="ranking-summary-copy">
          <div className="ranking-summary-icon"><Trophy size={23} /></div>
          <div><Tag tone="purple">{scope === 'nacional' ? 'BRASIL' : contestName.toUpperCase()}</Tag><h2>Seu lugar na jornada</h2><p>{period === 'semana' ? 'Placar semanal' : 'Placar acumulado'} · valores fictícios para demonstração</p></div>
        </div>
        <div className="ranking-summary-metrics">
          <div><span>Sua posição</span><strong>#{currentRank}</strong><small>entre {participants.length} estudantes demo</small></div>
          <div><span>Seu XP local</span><strong><Zap size={19} fill="currentColor" /> {state.xp.toLocaleString('pt-BR')}</strong><small>sincronizado com seu progresso</small></div>
        </div>
      </Card>

      <Card className="ranking-leaderboard-card">
        <div className="ranking-board-heading">
          <div><div className="eyebrow">PLACAR FICTÍCIO</div><h2>Em destaque</h2><p>{scope === 'nacional' ? 'Estudantes de todo o Brasil' : `Estudantes de ${contestName}`} · {period === 'semana' ? 'esta semana' : 'todo o tempo'}</p></div>
          <Tag tone="muted"><ShieldCheck size={14} /> Dados de demonstração</Tag>
        </div>
        <Podium learners={participants.slice(0, 3)} />
        <div className="ranking-table-wrap">
          <div className="ranking-table-header"><span>POSIÇÃO</span><span>ESTUDANTE</span><span>EXPERIÊNCIA</span></div>
          {remaining.length ? remaining.map((learner, index) => {
            const rank = index + 4;
            return <div className={`ranking-table-row ${learner.current ? 'ranking-current-row' : ''}`} key={learner.id}>
              <span className="ranking-table-rank">{String(rank).padStart(2, '0')}</span>
              <div className="ranking-table-student"><span className="ranking-table-avatar">{initials(learner.name)}</span><span><strong>{learner.current ? 'Você' : learner.name}</strong>{learner.current && <small>seu perfil</small>}</span>{learner.current && <Tag tone="green">VOCÊ</Tag>}</div>
              <span className="ranking-table-xp"><Zap size={14} fill="currentColor" /> {learner.xp.toLocaleString('pt-BR')} XP</span>
            </div>;
          }) : <div className="ranking-no-rows">Você está no pódio desta classificação.</div>}
        </div>
        <div className="ranking-board-footer"><Medal size={15} /><span>Os nomes e pontos dos demais participantes são fictícios. Sua posição é recalculada usando seu XP salvo localmente.</span></div>
      </Card>

      <Card className="ranking-encourage-card">
        <div className="ranking-encourage-icon"><Sparkles size={21} /></div>
        <div><strong>Seu melhor ritmo é o seu.</strong><span>Uma questão por vez já faz diferença na preparação.</span></div>
        <MechButton color="green" small onClick={() => navigate('/app/questoes?lesson=0&level=1')}>Estudar agora <ArrowRight size={16} /></MechButton>
      </Card>
      <DemoNote>Este placar é inteiramente fictício: não há ranking real nem outros usuários conectados.</DemoNote>
    </main>
  );
}
