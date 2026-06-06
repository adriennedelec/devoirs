import { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpen, Gift, Home, Map, Sparkles, UserRound } from 'lucide-react';
import type { ApiState, ChildDashboard } from './types/api';
import type {
  DictationAnswerResult,
  DictationSession,
  PoetryRecitalResult,
  PoetrySession,
} from './types/language';
import type {
  MultiplicationAnswerResult,
  MultiplicationAttemptRecord,
  MultiplicationSession,
  MultiplicationTableReviewFact,
} from './types/multiplication';
import type { ReadingAnswerResult, ReadingSession } from './types/reading';
import {
  getChildDashboard,
  getDictationSession,
  getMultiplicationSession,
  getPoetrySession,
  getReadingSession,
  submitDictationAnswer,
  submitMultiplicationAnswer,
  submitPoetryRecital,
  submitReadingAnswers,
} from './services/childService';
import './styles/tokens.css';
import './styles/base.css';
import './styles/child-app.css';

type ChildPage = 'home' | 'path' | 'rewards' | 'reading' | 'multiplication' | 'dictation' | 'poetry' | 'profile';

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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar" aria-label={`Progression ${Math.round(value)}%`}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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

function routeForSubject(subject: string): ChildPage {
  if (subject === 'reading') return 'reading';
  if (subject === 'multiplication') return 'multiplication';
  if (subject === 'dictation') return 'dictation';
  if (subject === 'poetry') return 'poetry';
  return 'path';
}

function HomeView({ dashboard, onNavigate }: { dashboard: ChildDashboard; onNavigate: (page: ChildPage) => void }) {
  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} />

      <section className="hero-card cockpit-hero">
        <div>
          <p className="eyebrow">Cockpit du jour</p>
          <h2>{dashboard.welcomeMessage}</h2>
          <p>Prête à apprendre et à progresser ? La mascotte te propose une mission simple et positive.</p>
        </div>
        <div className="hero-stats">
          <strong>{dashboard.progress.objectivesCompleted}</strong>
          <span>objectifs atteints</span>
        </div>
      </section>

      <section className="daily-goal-card primary-mission" aria-labelledby="primary-mission-title">
        <div>
          <p className="eyebrow">Mon objectif du jour</p>
          <p className="eyebrow">{dashboard.primaryMission.title}</p>
          <h2 id="primary-mission-title">{dashboard.primaryMission.description}</h2>
          <ProgressBar value={(dashboard.dailyGoal.currentCount / dashboard.dailyGoal.targetCount) * 100} />
          <p>{dashboard.dailyGoal.currentCount} / {dashboard.dailyGoal.targetCount} activités · +{dashboard.primaryMission.rewardStars} étoiles</p>
          <button className="primary-action" type="button" onClick={() => onNavigate(routeForSubject(dashboard.primaryMission.subject))}>
            {dashboard.primaryMission.ctaLabel}
          </button>
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
              <button onClick={() => onNavigate(routeForSubject(activity.subject))}>Continuer</button>
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
        <p>Avance monde après monde. Les étapes complétées débloquent de nouveaux badges adaptés à ton niveau.</p>
        <ProgressBar value={dashboard.progress.percent} />
      </section>
      <section className="path-grid world-map" aria-label="Mondes du parcours">
        {dashboard.learningWorlds.map((world, index) => (
          <article className={`path-step ${world.status}`} key={world.id}>
            <span className="step-number">{index + 1}</span>
            <span className="step-icon" aria-hidden="true">{world.icon}</span>
            <h3>{world.title}</h3>
            <p>{world.description}</p>
            <strong>{world.status === 'locked' ? 'À débloquer' : `${world.unlockedBadges} badge(s)`}</strong>
            <ProgressBar value={world.progressPercent} />
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
        <p>Boutique magique : continue tes missions pour débloquer badges, accessoires et surprises.</p>
        <ProgressBar value={68} />
      </section>
      <section className="reward-grid" aria-label="Boutique magique">
        {dashboard.rewardShelf.map((reward) => (
          <article className={`reward-card ${reward.status}`} key={reward.id}>
            <span aria-hidden="true">{reward.icon}</span>
            <h3>{reward.title}</h3>
            <p>{reward.description}</p>
            <strong>{reward.status === 'locked' ? 'Verrouillé' : 'Débloqué'} · {reward.costStars} ⭐</strong>
          </article>
        ))}
      </section>
      <section className="card-panel reward-history" aria-label="Historique des étoiles">
        <p className="eyebrow">Historique récent</p>
        {dashboard.rewardHistory.map((event) => (
          <article key={event.id}>
            <strong>{event.title}</strong>
            <p>{event.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function ReadingView({ dashboard }: { dashboard: ChildDashboard }) {
  const [sessionState, setSessionState] = useState<ApiState<ReadingSession>>({ status: 'loading' });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resultState, setResultState] = useState<ApiState<ReadingAnswerResult> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReadingSession(dashboard.child.id)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger la lecture.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  async function validateReading() {
    if (sessionState.status !== 'success') return;
    setResultState({ status: 'loading' });
    try {
      const result = await submitReadingAnswers(dashboard.child.id, {
        sessionId: sessionState.data.id,
        answers: sessionState.data.questions.map((question) => ({ questionId: question.id, selectedOptionId: answers[question.id] ?? '' })),
      });
      setResultState({ status: 'success', data: result });
    } catch (error: unknown) {
      setResultState({ status: 'error', message: error instanceof Error ? error.message : 'Lecture impossible à valider.' });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Lecture" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation de l’histoire…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' ? (
        <>
          <section className="language-card reading-card" aria-labelledby="reading-title">
            <div className="language-mascot" aria-hidden="true">📖</div>
            <div>
              <p className="eyebrow">Mission compréhension</p>
              <h2 id="reading-title">{sessionState.data.title}</h2>
              <p>{sessionState.data.instruction}</p>
              <button className="audio-button" type="button">🔊 {sessionState.data.audioLabel}</button>
              <div className="story-lines">
                {sessionState.data.text.map((line) => <p key={line}>{line}</p>)}
              </div>
            </div>
          </section>
          <section className="quiz-stack" aria-label="Questions de compréhension">
            {sessionState.data.questions.map((question) => (
              <article className="quiz-card" key={question.id}>
                <h3>{question.prompt}</h3>
                <div className="answer-grid compact">
                  {question.options.map((option, index) => (
                    <button
                      className={answers[question.id] === question.optionIds[index] ? 'selected' : ''}
                      key={option}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: question.optionIds[index] }))}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            <button className="primary-action" type="button" onClick={validateReading}>Valider ma compréhension</button>
            {resultState?.status === 'loading' ? <p className="feedback-card">La mascotte relit tes réponses…</p> : null}
            {resultState?.status === 'error' ? <p className="feedback-card error">{resultState.message}</p> : null}
            {resultState?.status === 'success' ? (
              <div className="feedback-card success">
                <h3>{resultState.data.feedbackTitle}</h3>
                <p>{resultState.data.feedbackMessage}</p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}

function MultiplicationView({ dashboard }: { dashboard: ChildDashboard }) {
  const [sessionState, setSessionState] = useState<ApiState<MultiplicationSession>>({ status: 'loading' });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerState, setAnswerState] = useState<ApiState<MultiplicationAnswerResult> | null>(null);
  const [firstTryByQuestion, setFirstTryByQuestion] = useState<Record<string, boolean>>({});
  const [attemptHistory, setAttemptHistory] = useState<MultiplicationAttemptRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    getMultiplicationSession(dashboard.child.id)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger les tables.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  const currentQuestion = sessionState.status === 'success' ? sessionState.data.questions[questionIndex] : null;
  const finalScore = attemptHistory.reduce((score, record) => score + record.scorePoint, 0);

  function getTableFactClass(factor: number) {
    const record = attemptHistory.find((item) => item.rightFactor === factor);
    return record?.scorePoint === 0 ? 'missed' : 'mastered';
  }

  function buildTableFacts(session: MultiplicationSession): MultiplicationTableReviewFact[] {
    return Array.from({ length: 8 }, (_, index) => {
      const rightFactor = index + 2;
      return {
        rightFactor,
        line: `${session.selectedTable} × ${rightFactor} = ${session.selectedTable * rightFactor}`,
        status: getTableFactClass(rightFactor),
      };
    });
  }

  async function answerQuestion(selectedAnswer: number) {
    if (!currentQuestion) return;
    setAnswerState({ status: 'loading' });
    try {
      const result = await submitMultiplicationAnswer(dashboard.child.id, { questionId: currentQuestion.id, selectedAnswer });
      if (!result.isCorrect) {
        setFirstTryByQuestion((current) => ({ ...current, [currentQuestion.id]: false }));
        setAnswerState({ status: 'success', data: result });
        return;
      }

      const scoredFirstTry = firstTryByQuestion[currentQuestion.id] !== false;
      const attemptRecord: MultiplicationAttemptRecord = {
        questionId: currentQuestion.id,
        leftFactor: currentQuestion.leftFactor,
        rightFactor: currentQuestion.rightFactor,
        correctAnswer: result.correctAnswer,
        scorePoint: scoredFirstTry ? 1 : 0,
      };
      const nextHistory = [
        ...attemptHistory.filter((record) => record.questionId !== currentQuestion.id),
        attemptRecord,
      ];
      setAttemptHistory(nextHistory);

      if (!result.sessionSummary) {
        setAnswerState(null);
        setQuestionIndex((index) => index + 1);
        return;
      }
      setAnswerState({ status: 'success', data: result });
    } catch (error: unknown) {
      setAnswerState({ status: 'error', message: error instanceof Error ? error.message : 'Réponse impossible à envoyer.' });
    }
  }

  async function selectTable(table: number) {
    setSessionState({ status: 'loading' });
    setQuestionIndex(0);
    setAnswerState(null);
    setFirstTryByQuestion({});
    setAttemptHistory([]);
    try {
      const session = await getMultiplicationSession(dashboard.child.id, table);
      setSessionState({ status: 'success', data: session });
    } catch (error: unknown) {
      setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger cette table.' });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Tables de multiplication" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation des tables…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' && currentQuestion ? (
        <>
          <section className="page-card multiplication-hero">
            <p className="eyebrow">Mission calcul magique</p>
            <h2>Choisis une table, puis réponds aux 8 calculs mélangés.</h2>
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
                  onClick={() => selectTable(table.value)}
                  type="button"
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
              <p className="eyebrow">Question {questionIndex + 1} sur {sessionState.data.totalQuestions}</p>
              <h2 id="multiplication-question">{currentQuestion.prompt}</h2>
              <ProgressBar value={((questionIndex + 1) / sessionState.data.totalQuestions) * 100} />
              <div className="answer-grid">
                {currentQuestion.options.map((option) => (
                  <button key={option} onClick={() => answerQuestion(option)} disabled={answerState?.status === 'loading'}>{option}</button>
                ))}
              </div>
              {answerState?.status === 'loading' ? <p className="feedback-card">Le hibou vérifie…</p> : null}
              {answerState?.status === 'error' ? <p className="feedback-card error">{answerState.message}</p> : null}
              {answerState?.status === 'success' ? (
                <div className={answerState.data.isCorrect ? 'feedback-card success' : 'feedback-card retry'}>
                  <h3>{answerState.data.feedbackTitle}</h3>
                  <p>{answerState.data.feedbackMessage}</p>
                  {answerState.data.sessionSummary ? (
                    <div className="multiplication-final-summary">
                      <p><strong>{answerState.data.sessionSummary.title}</strong> {answerState.data.sessionSummary.message}</p>
                      <p className="score-pill">Score : {finalScore} / {sessionState.data.totalQuestions}</p>
                      <div className="full-table-review" aria-label="Table complète avec erreurs">
                        <h3>Table complète de {sessionState.data.selectedTable}</h3>
                        <ul>
                          {buildTableFacts(sessionState.data).map((fact) => (
                            <li className={fact.status} key={fact.rightFactor}>{fact.line}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function DictationView({ dashboard }: { dashboard: ChildDashboard }) {
  const [sessionState, setSessionState] = useState<ApiState<DictationSession>>({ status: 'loading' });
  const [answerText, setAnswerText] = useState('');
  const [answerState, setAnswerState] = useState<ApiState<DictationAnswerResult> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDictationSession(dashboard.child.id)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger la dictée.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  async function correctDictation() {
    if (sessionState.status !== 'success') return;
    setAnswerState({ status: 'loading' });
    try {
      const result = await submitDictationAnswer(dashboard.child.id, { sessionId: sessionState.data.id, answerText });
      setAnswerState({ status: 'success', data: result });
    } catch (error: unknown) {
      setAnswerState({ status: 'error', message: error instanceof Error ? error.message : 'Correction impossible.' });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Dictée magique" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation de la dictée…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' ? (
        <section className="language-card dictation-card" aria-labelledby="dictation-title">
          <div className="language-mascot" aria-hidden="true">✍️</div>
          <div>
            <p className="eyebrow">Mission orthographe</p>
            <h2 id="dictation-title">{sessionState.data.title}</h2>
            <p>{sessionState.data.instruction}</p>
            <button className="audio-button" type="button">🔊 {sessionState.data.audioLabel}</button>
            <div className="hint-list" aria-label="Indices de dictée">
              {sessionState.data.hints.map((hint) => <span key={hint}>{hint}</span>)}
            </div>
            <label className="answer-field">
              <span>Ta phrase</span>
              <textarea value={answerText} onChange={(event) => setAnswerText(event.target.value)} rows={4} />
            </label>
            <button className="primary-action" type="button" onClick={correctDictation} disabled={answerState?.status === 'loading'}>Corriger ma dictée</button>
            {answerState?.status === 'loading' ? <p className="feedback-card">La mascotte relit ta phrase…</p> : null}
            {answerState?.status === 'error' ? <p className="feedback-card error">{answerState.message}</p> : null}
            {answerState?.status === 'success' ? (
              <div className={answerState.data.isCorrect ? 'feedback-card success' : 'feedback-card retry'}>
                <h3>{answerState.data.feedbackTitle}</h3>
                <p>{answerState.data.feedbackMessage}</p>
                <p><strong>Correction :</strong> {answerState.data.correctedText}</p>
                <div className="word-feedback" aria-label="Correction mot par mot">
                  {answerState.data.wordFeedback.map((word) => (
                    <span className={word.status} key={`${word.expected}-${word.actual}`}>{word.expected}<small>{word.hint}</small></span>
                  ))}
                </div>
                <button type="button" onClick={() => { setAnswerText(''); setAnswerState(null); }}>{answerState.data.retryLabel}</button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PoetryView({ dashboard }: { dashboard: ChildDashboard }) {
  const [sessionState, setSessionState] = useState<ApiState<PoetrySession>>({ status: 'loading' });
  const [recitalState, setRecitalState] = useState<ApiState<PoetryRecitalResult> | null>(null);
  const [hideWords, setHideWords] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPoetrySession(dashboard.child.id)
      .then((session) => {
        if (!cancelled) setSessionState({ status: 'success', data: session });
      })
      .catch((error: unknown) => {
        if (!cancelled) setSessionState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger la poésie.' });
      });
    return () => { cancelled = true; };
  }, [dashboard.child.id]);

  async function validateRecital() {
    if (sessionState.status !== 'success') return;
    setRecitalState({ status: 'loading' });
    try {
      const result = await submitPoetryRecital(dashboard.child.id, { poemId: sessionState.data.poemId, confidence: 'ready' });
      setRecitalState({ status: 'success', data: result });
    } catch (error: unknown) {
      setRecitalState({ status: 'error', message: error instanceof Error ? error.message : 'Récitation impossible à valider.' });
    }
  }

  return (
    <main className="child-main">
      <ChildTopBar dashboard={dashboard} title="Poésie" />
      {sessionState.status === 'loading' ? <div className="state-card">Préparation de la poésie…</div> : null}
      {sessionState.status === 'error' ? <div className="state-card error">{sessionState.message}</div> : null}
      {sessionState.status === 'success' ? (
        <>
          <section className="language-card poetry-card" aria-labelledby="poetry-title">
            <div className="language-mascot" aria-hidden="true">🎙️</div>
            <div>
              <p className="eyebrow">Mission mémoire</p>
              <h2 id="poetry-title">{sessionState.data.title}</h2>
              <p>{sessionState.data.instruction}</p>
              <div className="poetry-mode-row">
                {sessionState.data.memoryModes.map((mode) => (
                  <button className="audio-button" key={mode} type="button" onClick={() => mode === 'Cacher des mots' && setHideWords((value) => !value)}>{mode}</button>
                ))}
              </div>
              <div className="poem-lines" aria-label="Texte de la poésie">
                {sessionState.data.practiceLines.map((line) => <p key={line.id}><strong>{line.label}</strong> — {hideWords ? line.hiddenText : line.text}</p>)}
              </div>
            </div>
          </section>
          <section className="poetry-steps" aria-label="Étapes de poésie">
            {sessionState.data.steps.map((step) => (
              <article className={`poetry-step ${step.status}`} key={step.id}>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </article>
            ))}
          </section>
          <section className="page-card recital-card">
            <p className="eyebrow">Récitation simulée</p>
            <h2>Quand tu es prête, valide ta récitation.</h2>
            <button className="primary-action" type="button" onClick={validateRecital} disabled={recitalState?.status === 'loading'}>J’ai récité ma poésie</button>
            {recitalState?.status === 'loading' ? <p className="feedback-card">La mascotte écoute ton effort…</p> : null}
            {recitalState?.status === 'error' ? <p className="feedback-card error">{recitalState.message}</p> : null}
            {recitalState?.status === 'success' ? (
              <div className={recitalState.data.status === 'completed' ? 'feedback-card success' : 'feedback-card retry'}>
                <h3>{recitalState.data.feedbackTitle}</h3>
                <p>{recitalState.data.feedbackMessage}</p>
              </div>
            ) : null}
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

function ChildSideNav({ activePage, onNavigate }: { activePage: ChildPage; onNavigate: (page: ChildPage) => void }) {
  return (
    <nav className="child-side-nav" aria-label="Navigation enfant — menu latéral">
      <div className="side-nav-brand" aria-hidden="true">
        <span>🦉</span>
        <strong>Devoirs</strong>
      </div>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button aria-current={activePage === id ? 'page' : undefined} className={activePage === id ? 'active' : ''} key={id} onClick={() => onNavigate(id)}>
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ActivePage({ page, dashboard, onNavigate }: { page: ChildPage; dashboard: ChildDashboard; onNavigate: (page: ChildPage) => void }) {
  switch (page) {
    case 'path': return <LearningPathView dashboard={dashboard} />;
    case 'rewards': return <RewardsView dashboard={dashboard} />;
    case 'reading': return <ReadingView dashboard={dashboard} />;
    case 'multiplication': return <MultiplicationView dashboard={dashboard} />;
    case 'dictation': return <DictationView dashboard={dashboard} />;
    case 'poetry': return <PoetryView dashboard={dashboard} />;
    case 'profile': return <ProfileView dashboard={dashboard} />;
    case 'home':
    default: return <HomeView dashboard={dashboard} onNavigate={onNavigate} />;
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
        if (!cancelled) setDashboardState({ status: 'error', message: error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.' });
      });
    return () => { cancelled = true; };
  }, []);

  const shell = useMemo(() => {
    if (dashboardState.status === 'success') {
      return <ActivePage page={activePage} dashboard={dashboardState.data} onNavigate={setActivePage} />;
    }
    if (dashboardState.status === 'loading') return <div className="state-card">Chargement de ton aventure…</div>;
    if (dashboardState.status === 'empty') return <div className="state-card">Aucune mission pour le moment.</div>;
    return <div className="state-card error">{dashboardState.message}</div>;
  }, [activePage, dashboardState]);

  return (
    <div className={dashboardState.status === 'success' ? 'child-app-layout has-side-nav' : 'child-app-layout'}>
      {dashboardState.status === 'success' ? <ChildSideNav activePage={activePage} onNavigate={setActivePage} /> : null}
      <div className="child-app-shell">
        {shell}
      </div>
    </div>
  );
}
