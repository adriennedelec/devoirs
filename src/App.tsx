import { useEffect, useState } from 'react';
import { Bell, BookOpen, Gift, Home, Map, Sparkles, UserRound } from 'lucide-react';
import type { ApiState, ChildDashboard } from './types/api';
import { getChildDashboard } from './services/childService';
import './styles/tokens.css';
import './styles/base.css';
import './styles/child-app.css';

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar" aria-label={`Progression ${value}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function ChildTopBar({ dashboard }: { dashboard: ChildDashboard }) {
  return (
    <header className="child-topbar">
      <div className="avatar-bubble" aria-hidden="true">{dashboard.child.avatarEmoji}</div>
      <div>
        <p className="eyebrow">Niveau {dashboard.child.level} · {dashboard.child.title}</p>
        <h1>Bonjour {dashboard.child.firstName} ! 👋</h1>
      </div>
      <div className="topbar-actions">
        <div className="star-pill"><Sparkles size={18} /> {dashboard.child.stars} étoiles</div>
        <button className="icon-button" aria-label="Notifications"><Bell size={20} /><span>3</span></button>
      </div>
    </header>
  );
}

function DashboardView({ dashboard }: { dashboard: ChildDashboard }) {
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
              <button>Continuer</button>
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

function ChildBottomNav() {
  const items = [
    ['Accueil', Home],
    ['Parcours', Map],
    ['Récompenses', Gift],
    ['Lecture', BookOpen],
    ['Profil', UserRound],
  ] as const;

  return (
    <nav className="child-bottom-nav" aria-label="Navigation enfant">
      {items.map(([label, Icon], index) => (
        <button className={index === 0 ? 'active' : ''} key={label}>
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
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
      {dashboardState.status === 'success' ? <DashboardView dashboard={dashboardState.data} /> : null}
      <ChildBottomNav />
    </div>
  );
}
