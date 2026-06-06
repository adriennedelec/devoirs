import { useEffect, useState } from 'react';
import { Bell, BookOpen, Gift, Home, Map, Sparkles, UserRound } from 'lucide-react';
import type { ApiState, ChildDashboard } from './types/api';
import type { MultiplicationAnswerResult, MultiplicationSession } from './types/multiplication';
import { getChildDashboard, getMultiplicationSession, submitMultiplicationAnswer } from './services/childService';
import './styles/tokens.css';
import './styles/base.css';
import './styles/child-app.css';

type ChildPage = 'home' | 'path' | 'rewards' | 'reading' | 'multiplication' | 'profile';

type NavItem = {
  id: ChildPage;
  label: string;
  icon: typeof Home;
};

const navItems: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'path', label: 'Parcours', icon: Map },
  { id: 'rewards', label: 'Récompenses', icon: Gift },
  { id: 'reading', label: 'Lecture', icon: BookOpen },
  { id: 'profile', label: 'Profil', icon: UserRound },
];

const learningPathSteps = [
  { title: 'Additions niveau 1', status: 'Complété', icon: '✅', progress: 100 },
  { title: 'Tables de multiplication 2 à 5', status: 'En cours', icon: '✖️', progress: 68 },
  { title: 'Dictée magique', status: 'Disponible', icon: '✍️', progress: 28 },
  { title: 'Poésie à réciter', status: 'À débloquer', icon: '🎙️', progress: 0 },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar" aria-label={`Progression ${Math.round(value)}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function ChildTopBar({ dashboard, title }: { dashboard: ChildDashboard; title?: string }) {
  return (
    <header className="child-topbar">
      <div className="avatar-bubble" aria-hidden="true">{dashboard.child.avatarEmoji}</div>
      <div>
        <p className="eyebrow">Niveau {dashboard.child.level} · {dashboard.child.title}</p>
        <h1>{title ?? `Bonjour ${dashboard.child.firstName} ! 👋`}</h1>
      </div>
      <div className="topbar-actions">
        <div className="star-pill"><Sparkles size={18} /> {dashboard.child.stars} étoiles</div>
        <button className="icon-button" aria-label="Notifications"><Bell size={20} /><span>3</span></button>
      </div>
    </header>
  );
}

function HomeView({ dashboard, onNavigate }: { dashboard: ChildDashboard; onNavigate: (page: ChildPage) => void }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} />

      <section className="hero-card">
        <div>
          <p className="eyebrow">Ma progression</p>
          <h2>{dashboard.progress.percent}% de ton aventure</h2>
          <p>Prête à apprendre et à progresser ? Choisis une activité et amuse-toi !</p>
        </div>
        <div className="hero-stats">
          <strong>{dashboard.progress.objectivesCompleted}</strong>
          <span>objectifs atteints</span>
        </div>
      </section>

      <section className="daily-goal-card" aria-labelledby="daily-goal-title">
        <div>
          <p className="eyebrow">{dashboard.dailyGoal.title}</p>
          <h2 id="daily-goal-title">{dashboard.dailyGoal.description}</h2>
          <ProgressBar value={(dashboard.dailyGoal.currentCount / dashboard.dailyGoal.targetCount) * 100} />
          <p>{dashboard.dailyGoal.currentCount} / {dashboard.dailyGoal.targetCount} activités · +{dashboard.dailyGoal.rewardStars} étoiles</p>
        </div>
        <div className="mascot-tip">🦉<span>Encore une mission et ton objectif est réussi !</span></div>
      </section>

      <section>
        <div className="section-heading">
          <p className="eyebrow">Mes activités</p>
          <h2>Choisis ta prochaine mission</h2>
        </div>
        <div className="activity-grid">
          {dashboard.activities.map((activity) => (
            <article className="activity-card" key={activity.id}>
              <div className="activity-icon" aria-hidden="true">{activity.icon}</div>
              <div>
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                <ProgressBar value={activity.progressPercent} />
                <span className="activity-meta">{activity.progressPercent}% · +{activity.rewardStars} étoiles</span>
              </div>
              <button onClick={() => {
                if (activity.subject === 'reading') onNavigate('reading');
                else if (activity.subject === 'multiplication') onNavigate('multiplication');
                else onNavigate('path');
              }}>Continuer</button>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-columns">
        <div className="card-panel">
          <p className="eyebrow">Badges récents</p>
          <div className="badge-row">
            {dashboard.recentBadges.map((badge) => (
              <div className="badge" key={badge.id}><span>{badge.icon}</span>{badge.title}</div>
            ))}
          </div>
        </div>
        {dashboard.activeChallenge ? (
          <div className="card-panel challenge-card">
            <p className="eyebrow">Défi en cours</p>
            <h3>{dashboard.activeChallenge.title}</h3>
            <p>{dashboard.activeChallenge.description}</p>
            <ProgressBar value={(dashboard.activeChallenge.currentCount / dashboard.activeChallenge.targetCount) * 100} />
            <span>{dashboard.activeChallenge.currentCount} / {dashboard.activeChallenge.targetCount} défis</span>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function LearningPathView({ dashboard }: { dashboard: ChildDashboard }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Mon parcours" />
      <section className="page-card path-hero">
        <p className="eyebrow">Aventure pédagogique</p>
        <h2>Chaque étape te rapproche de la réussite !</h2>
        <p>Avance mission après mission. Les étapes complétées débloquent de nouveaux défis adaptés à ton niveau.</p>
        <ProgressBar value={dashboard.progress.percent} />
      </section>
      <section className="path-grid" aria-label="Étapes du parcours">
        {learningPathSteps.map((step, index) => (
          <article className="path-step" key={step.title}>
            <span className="step-number">{index + 1}</span>
            <span className="step-icon" aria-hidden="true">{step.icon}</span>
            <h3>{step.title}</h3>
            <p>{step.status}</p>
            <ProgressBar value={step.progress} />
          </article>
        ))}
      </section>
    </main>
  );
}

function RewardsView({ dashboard }: { dashboard: ChildDashboard }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Mes récompenses" />
      <section className="page-card rewards-hero">
        <p className="eyebrow">Niveau {dashboard.child.level}</p>
        <h2>{dashboard.child.title}</h2>
        <p>Continue tes missions pour débloquer des badges, accessoires et surprises.</p>
        <ProgressBar value={68} />
      </section>
      <section className="reward-grid" aria-label="Badges débloqués">
        {dashboard.recentBadges.map((badge) => (
          <article className="reward-card" key={badge.id}>
            <span aria-hidden="true">{badge.icon}</span>
            <h3>{badge.title}</h3>
            <p>{badge.description}</p>
          </article>
        ))}
        <article className="reward-card locked">
          <span aria-hidden="true">🏰</span>
          <h3>Château des mots</h3>
          <p>À débloquer avec 200 étoiles.</p>
        </article>
      </section>
    </main>
  );
}

function ReadingView({ dashboard }: { dashboard: ChildDashboard }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Lecture" />
      <section className="page-card">
        <p className="eyebrow">Bientôt</p>
        <h2>Lecture à voix haute</h2>
        <p>Cette page préparera les exercices de lecture orale avec consigne, texte, micro et feedback bienveillant.</p>
      </section>
    </main>
  );
}

function MultiplicationView({ dashboard }: { dashboard: ChildDashboard }) {
  const [sessionState, setSessionState] = useState<ApiState<MultiplicationSession>>({ status: 'loading' });
  const [answerState, setAnswerState] = useState<ApiState<MultiplicationAnswerResult> | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMultiplicationSession(dashboard.child.id)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Impossible de charger les tables.';
          setSessionState({ status: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dashboard.child.id]);

  async function answerQuestion(selectedAnswer: number) {
    if (sessionState.status !== 'success') return;
    setAnswerState({ status: 'loading' });

    try {
      const result = await submitMultiplicationAnswer(dashboard.child.id, {
        questionId: sessionState.data.currentQuestion.id,
        selectedAnswer,
      });
      setAnswerState({ status: 'success', data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Réponse impossible à envoyer.';
      setAnswerState({ status: 'error', message });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Tables de multiplication" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation des tables…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' ? (
        <>
          <section className="page-card multiplication-hero">
            <p className="eyebrow">Mission calcul magique</p>
            <h2>Choisis une table, puis trouve la bonne réponse.</h2>
            <p>{sessionState.data.mascotTip}</p>
          </section>

          <section className="table-picker" aria-label="Choisis une table">
            <div className="section-heading">
              <p className="eyebrow">Choisis une table</p>
              <h2>Ton terrain d’entraînement</h2>
            </div>
            <div className="table-chip-grid">
              {sessionState.data.availableTables.map((table) => (
                <button
                  aria-pressed={sessionState.data.selectedTable === table.value}
                  className={sessionState.data.selectedTable === table.value ? 'active' : ''}
                  key={table.value}
                >
                  <strong>{table.label}</strong>
                  <span>{table.progressPercent}% · +{table.rewardStars} ⭐</span>
                </button>
              ))}
            </div>
          </section>

          <section className="question-card" aria-labelledby="multiplication-question">
            <div className="question-mascot" aria-hidden="true">🦉</div>
            <div>
              <p className="eyebrow">Question QCM</p>
              <h2 id="multiplication-question">{sessionState.data.currentQuestion.prompt}</h2>
              <div className="answer-grid">
                {sessionState.data.currentQuestion.options.map((option) => (
                  <button key={option} onClick={() => answerQuestion(option)} disabled={answerState?.status === 'loading'}>
                    {option}
                  </button>
                ))}
              </div>
              {answerState?.status === 'loading' ? <p className="feedback-card">Le hibou vérifie…</p> : null}
              {answerState?.status === 'error' ? <p className="feedback-card error">{answerState.message}</p> : null}
              {answerState?.status === 'success' ? (
                <div className={answerState.data.isCorrect ? 'feedback-card success' : 'feedback-card retry'}>
                  <h3>{answerState.data.feedbackTitle}</h3>
                  <p>{answerState.data.feedbackMessage}</p>
                  <button>Question suivante</button>
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function ProfileView({ dashboard }: { dashboard: ChildDashboard }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title={`Profil d'${dashboard.child.firstName}`} />
      <section className="page-card profile-card">
        <div className="profile-avatar" aria-hidden="true">{dashboard.child.avatarEmoji}</div>
        <div>
          <p className="eyebrow">Mode enfant sécurisé</p>
          <h2>{dashboard.child.firstName}, niveau {dashboard.child.level}</h2>
          <p>{dashboard.child.stars} étoiles · {dashboard.child.streakDays} jours de suite · profil pensé pour rester simple et rassurant.</p>
        </div>
      </section>
    </main>
  );
}

function ChildBottomNav({ activePage, onNavigate }: { activePage: ChildPage; onNavigate: (page: ChildPage) => void }) {
  return (
    <nav className="child-bottom-nav" aria-label="Navigation enfant">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          aria-current={activePage === id ? 'page' : undefined}
          className={activePage === id ? 'active' : ''}
          key={id}
          onClick={() => onNavigate(id)}
        >
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ActivePage({ page, dashboard, onNavigate }: { page: ChildPage; dashboard: ChildDashboard; onNavigate: (page: ChildPage) => void }) {
  switch (page) {
    case 'path':
      return <LearningPathView dashboard={dashboard} />;
    case 'rewards':
      return <RewardsView dashboard={dashboard} />;
    case 'reading':
      return <ReadingView dashboard={dashboard} />;
    case 'multiplication':
      return <MultiplicationView dashboard={dashboard} />;
    case 'profile':
      return <ProfileView dashboard={dashboard} />;
    case 'home':
    default:
      return <HomeView dashboard={dashboard} onNavigate={onNavigate} />;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<ChildPage>('home');
  const [dashboardState, setDashboardState] = useState<ApiState<ChildDashboard>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    getChildDashboard('emma-demo')
      .then((dashboard) => {
        if (!cancelled) setDashboardState({ status: 'success', data: dashboard });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.';
          setDashboardState({ status: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="child-app-shell">
      {dashboardState.status === 'loading' ? <div className="state-card">Chargement de ton aventure…</div> : null}
      {dashboardState.status === 'error' ? <div className="state-card error">{dashboardState.message}</div> : null}
      {dashboardState.status === 'empty' ? <div className="state-card">Aucune mission pour le moment.</div> : null}
      {dashboardState.status === 'success' ? <ActivePage page={activePage} dashboard={dashboardState.data} onNavigate={setActivePage} /> : null}
      <ChildBottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
}
