'use client';
import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Target,
  Sparkles,
  Users,
  BookOpen,
  Trophy,
  Video,
  Settings,
  Mic,
  Send,
  X,
  Menu,
  Flame,
  Clock,
  MoreHorizontal,
  Download,
  Upload,
  ShieldCheck,
  Pause,
  Play,
  Volume2,
  Square,
  RefreshCw,
  Compass,
  Flag,
  CheckCircle2,
  AlertCircle,
  FileText,
  Leaf,
  Mountain,
  Lightbulb,
  Calendar,
  MessageCircle,
  Handshake,
  Mail,
  Wand2,
  Rocket,
  FolderOpen,
  UserRound,
  Images,
  Wrench,
  FolderKanban,
} from 'lucide-react';
import { advisers, dailyDigest, emptyWorkspace, localDay, points, progress, review, type Workspace } from './domain';
import Circles from './circles';
import Customers from './customers';
import Ideas from './ideas';
import Agents from './agents';
import AboutMe from './founder';
import Project from './project';
import MyStuff from './mystuff';
import Sprint from './sprint';
import { FeedbackWidget, Gallery, Toolkit } from './extras';
import type { Ctx, Focus, AiResult } from './ui';
const uid = () => crypto.randomUUID(),
  now = () => new Date().toISOString();
const paths = [
  'Start a business',
  'Find my first customer',
  'Learn a new skill',
  'Grow my career',
  'Launch a product',
  'Build my personal brand',
];
const nav: { id: string; label: string; icon: any; section?: string }[] = [
  { id: 'home', label: 'Overview', icon: LayoutDashboard },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb, section: 'DISCOVER' },
  { id: 'agents', label: 'Agents', icon: Wand2 },
  { id: 'sprint', label: 'Launch Sprint', icon: Rocket },
  { id: 'about', label: 'About me', icon: UserRound },
  { id: 'quests', label: 'My quests', icon: Target, section: 'BUILD' },
  { id: 'customers', label: 'First customers', icon: Handshake },
  { id: 'nova', label: 'Talk to Nova', icon: Sparkles },
  { id: 'board', label: 'Advisory board', icon: Users },
  { id: 'journal', label: 'Progress journal', icon: BookOpen },
  { id: 'challenges', label: 'Challenge studio', icon: Trophy },
  { id: 'circles', label: 'My circles', icon: MessageCircle },
  { id: 'meetings', label: 'Meeting room', icon: Video },
  { id: 'mystuff', label: 'My stuff', icon: FolderOpen, section: 'LIBRARY' },
  { id: 'gallery', label: 'Build gallery', icon: Images },
  { id: 'toolkit', label: 'Builder toolkit', icon: Wrench },
];
const hiddenPages: Record<string, string> = { project: 'Project', settings: 'Settings & privacy' };
const challenges = [
  {
    id: 'first-offer',
    title: 'Your first testable offer',
    tag: 'BUSINESS',
    days: '7 days',
    color: 'peach',
    icon: Lightbulb,
    desc: 'Turn what you know into an offer someone can understand.',
    tasks: [
      'Describe your ideal customer',
      'Speak with three potential customers',
      'Write a one-page offer',
      'Ask one prospect for feedback',
    ],
  },
  {
    id: 'portfolio',
    title: 'Make your work visible',
    tag: 'CAREER',
    days: '5 days',
    color: 'lavender',
    icon: Compass,
    desc: 'Build one piece of work that shows what you can do.',
    tasks: ['Choose a real problem to solve', 'Create a sample project', 'Write a short case study', 'Share your work with one person'],
  },
  {
    id: 'momentum',
    title: 'The small steps challenge',
    tag: 'ACCOUNTABILITY',
    days: '7 days',
    color: 'sage',
    icon: Mountain,
    desc: 'One meaningful action a day. A little less thinking, a little more doing.',
    tasks: [
      'Choose one achievable action',
      'Complete a 20-minute work session',
      'Record what you learned',
      'Review your week and choose the next step',
    ],
  },
];
function Orb({ small = false }: { small?: boolean }) {
  return (
    <div className={'orb ' + (small ? 'small' : '')} aria-hidden="true">
      <div />
      <span />
      <i />
    </div>
  );
}
function Badge({ children, color = 'sage' }: { children: ReactNode; color?: string }) {
  return <span className={'badge ' + color}>{children}</span>;
}
function Empty({ icon: Icon = Target, title, text, action }: { icon?: any; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <Icon size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function Art() {
  return (
    <svg className="hero-art" viewBox="0 0 410 270" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="rise" x1="140" y1="30" x2="340" y2="230">
          <stop stopColor="#f8c895" />
          <stop offset="1" stopColor="#e99462" />
        </linearGradient>
      </defs>
      <circle cx="250" cy="139" r="107" stroke="#526258" strokeDasharray="3 8" />
      <circle cx="250" cy="139" r="77" stroke="#526258" />
      <path d="M90 229L142 190L196 188L235 142L292 138L323 88" stroke="#dacdb1" strokeWidth="3" strokeLinecap="round" />
      <path d="M313 92L324 84L331 99" stroke="#dacdb1" strokeWidth="3" strokeLinecap="round" />
      <rect x="115" y="202" width="45" height="58" rx="5" fill="#526553" />
      <rect x="174" y="176" width="45" height="84" rx="5" fill="#718371" />
      <rect x="233" y="150" width="45" height="110" rx="5" fill="#a3ae8d" />
      <rect x="292" y="120" width="45" height="140" rx="5" fill="url(#rise)" />
      <circle cx="153" cy="63" r="24" fill="#f5ead8" />
      <path d="M146 63L151 68L161 57" stroke="#365242" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="353" cy="183" r="18" fill="#809588" />
      <path d="M345 182H361M353 175V191" stroke="white" strokeWidth="2" />
      <path d="M251 24L254 34L264 37L254 40L251 50L248 40L238 37L248 34L251 24Z" fill="#f4c28a" />
      <circle cx="86" cy="130" r="4" fill="#a7b293" />
    </svg>
  );
}
export default function Platform({ displayName }: { displayName: string }) {
  const [data, setData] = useState<Workspace>(emptyWorkspace()),
    [rev, setRev] = useState(0),
    [loaded, setLoaded] = useState(false),
    [loadError, setLoadError] = useState(''),
    [aiReady, setAiReady] = useState(false),
    [emailReady, setEmailReady] = useState(false),
    [page, setPage] = useState('home'),
    [modal, setModal] = useState(''),
    [saving, setSaving] = useState(false),
    [toast, setToast] = useState(''),
    [mobile, setMobile] = useState(false),
    [selected, setSelected] = useState(['strategy', 'innovation', 'growth']),
    [input, setInput] = useState(''),
    [thinking, setThinking] = useState(false),
    [listening, setListening] = useState(false),
    [speak, setSpeak] = useState(false),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [draftAnalysis, setDraftAnalysis] = useState(''),
    [formError, setFormError] = useState(''),
    [focus, setFocus] = useState<Focus>({}),
    [visit, setVisit] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null),
    lock = useRef(false),
    recognition = useRef<any>(null),
    toastTimer = useRef<any>(null);
  const notify = (text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 5500);
  };
  async function load() {
    try {
      setLoadError('');
      const r = await fetch('/api/workspace');
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      setData(b.state);
      setRev(b.revision);
      setAiReady(b.aiReady);
      setEmailReady(!!b.emailReady);
      setLoaded(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not open workspace.');
    }
  }
  useEffect(() => {
    load();
    return () => {
      clearTimeout(toastTimer.current);
      recognition.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    if (modal) {
      setFormError('');
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setModal('');
        setMobile(false);
        window.speechSynthesis?.cancel();
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  async function save(next: Workspace) {
    if (lock.current) return false;
    lock.current = true;
    setSaving(true);
    try {
      const r = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: next, revision: rev }),
      });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      setData(next);
      setRev(b.revision);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save. Please try again.';
      notify(msg);
      setFormError(msg);
      return false;
    } finally {
      setSaving(false);
      lock.current = false;
    }
  }
  const go = (id: string, f: Focus = {}) => {
    setFocus(f);
    setVisit((v) => v + 1);
    setPage(id);
    window.scrollTo?.({ top: 0 });
    setMobile(false);
    setSearch('');
    setFilter('all');
  };
  const open = (id: string) => {
    setDraftAnalysis('');
    setModal(id);
  };
  const totals = progress(data),
    xp = points(data),
    active = data.goals.filter((g) => !g.paused),
    next = data.tasks
      .filter((t) => t.status === 'planned' && data.goals.some((g) => g.id === t.goalId && !g.paused))
      .sort((a, b) => a.due.localeCompare(b.due))[0],
    weekly = review(data);
  const firstName = data.profile.name || displayName.split(' ')[0] || 'builder';
  const formatDate = (d: string) =>
    d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date set';
  const close = () => {
    if (!saving && !thinking) setModal('');
  };
  function values(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
  }
  async function addGoal(e: FormEvent<HTMLFormElement>) {
    const f = values(e),
      id = uid();
    const goal = { id, title: f.title.trim(), category: f.category, due: f.due, why: f.why || '', created: now(), paused: false };
    const task = f.first?.trim()
      ? { id: uid(), goalId: id, title: f.first.trim(), due: f.firstDue || localDay(), status: 'planned' as const, created: now() }
      : null;
    const ok = await save({ ...data, goals: [...data.goals, goal], tasks: task ? [...data.tasks, task] : data.tasks });
    if (ok) {
      setModal('');
      notify('Quest created. Your next chapter starts here.');
    }
  }
  async function checkIn(e: FormEvent<HTMLFormElement>) {
    const f = values(e);
    const log = {
      id: uid(),
      goalId: f.goalId || '',
      activity: f.activity.trim(),
      learning: f.learning || '',
      blocker: f.blocker || '',
      next: f.next || '',
      created: now(),
      evidence: f.evidence || '',
    };
    const task =
      f.next?.trim() && f.goalId
        ? { id: uid(), goalId: f.goalId, title: f.next.trim(), due: f.due || localDay(), status: 'planned' as const, created: now() }
        : null;
    if (await save({ ...data, logs: [log, ...data.logs], tasks: task ? [...data.tasks, task] : data.tasks })) {
      setModal('');
      notify('Check-in saved. Every honest step counts.');
    }
  }
  async function addTask(e: FormEvent<HTMLFormElement>) {
    const f = values(e);
    if (
      await save({
        ...data,
        tasks: [...data.tasks, { id: uid(), goalId: f.goalId, title: f.title.trim(), due: f.due, status: 'planned', created: now() }],
      })
    ) {
      setModal('');
      notify('Commitment saved.');
    }
  }
  async function toggleTask(id: string, status: 'completed' | 'planned' | 'blocked') {
    if (await save({ ...data, tasks: data.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }))
      notify(status === 'completed' ? 'A step forward. +5 progress points.' : 'Commitment updated.');
  }
  async function startChallenge(ch: (typeof challenges)[number]) {
    if (data.challenges.includes(ch.id)) {
      go('quests');
      return;
    }
    const id = uid();
    const due = new Date();
    due.setDate(due.getDate() + 7);
    if (
      await save({
        ...data,
        challenges: [...data.challenges, ch.id],
        goals: [
          ...data.goals,
          {
            id,
            title: ch.title,
            category: ch.tag === 'CAREER' ? 'Grow my career' : 'Start a business',
            due: localDay(due),
            why: ch.desc,
            created: now(),
            paused: false,
          },
        ],
        tasks: [
          ...data.tasks,
          ...ch.tasks.map((title, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i + 1);
            return { id: uid(), goalId: id, title, due: localDay(d), status: 'planned' as const, created: now() };
          }),
        ],
      })
    ) {
      notify('Challenge started. Your missions are in My quests.');
      go('quests');
    }
  }
  async function ai(mode: string, text: string) {
    setThinking(true);
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text, advisers: selected }),
      });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      return b.text as string;
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Session unavailable.');
      return null;
    } finally {
      setThinking(false);
    }
  }
  async function call(body: Record<string, unknown>): Promise<AiResult | null> {
    setThinking(true);
    try {
      const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      return { text: String(b.text || ''), sources: Array.isArray(b.sources) ? b.sources : [], researched: !!b.researched };
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Session unavailable.');
      return null;
    } finally {
      setThinking(false);
    }
  }
  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim() || thinking || saving) return;
    const text = input.trim();
    const response = await ai('chat', text);
    if (response) {
      const msgs = [
        ...data.messages,
        { id: uid(), role: 'user' as const, text, created: now() },
        { id: uid(), role: 'assistant' as const, text: response, created: now() },
      ].slice(-200);
      if (await save({ ...data, messages: msgs })) {
        setInput('');
        if (speak && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(response);
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      }
    }
  }
  function voice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      notify('Voice input is unavailable in this browser. You can type your message instead.');
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const r = new SR();
    recognition.current = r;
    r.lang = 'en-US';
    r.interimResults = false;
    r.onresult = (e: any) => setInput((prev) => (prev + ' ' + e.results[0][0].transcript).trim());
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      notify('Could not hear you. Check microphone permission or type your message.');
    };
    r.start();
    setListening(true);
  }
  async function boardSubmit(e: FormEvent<HTMLFormElement>) {
    const f = values(e);
    if (!selected.length) {
      setFormError('Select at least one adviser.');
      return;
    }
    const analysis = draftAnalysis;
    const item = {
      id: uid(),
      title: f.title.trim(),
      context: f.context || '',
      advisers: selected,
      analysis,
      decision: f.decision || '',
      action: f.action || '',
      due: f.due || '',
      approved: f.approve === 'on',
      created: now(),
    };
    const goalId = active[0]?.id;
    if (item.approved && item.action && !goalId) {
      setFormError('Create an active quest before adding an approved action.');
      return;
    }
    const task =
      item.approved && item.action && goalId
        ? { id: uid(), goalId, title: item.action, due: item.due || localDay(), status: 'planned' as const, created: now() }
        : null;
    if (await save({ ...data, decisions: [item, ...data.decisions], tasks: task ? [...data.tasks, task] : data.tasks })) {
      setModal('');
      notify(item.approved ? 'Decision approved and recorded.' : 'Board agenda saved for review.');
    }
  }
  async function meetingSubmit(e: FormEvent<HTMLFormElement>) {
    const f = values(e);
    if (f.consent !== 'on') {
      setFormError('Confirm you have permission to save these notes.');
      return;
    }
    if (
      await save({
        ...data,
        meetings: [{ id: uid(), title: f.title, notes: f.notes, summary: draftAnalysis, consent: true, created: now() }, ...data.meetings],
      })
    ) {
      setModal('');
      notify('Meeting record saved.');
    }
  }
  async function upload(file: File) {
    if (saving) return;
    setThinking(true);
    try {
      const f = new FormData();
      f.set('file', file);
      const r = await fetch('/api/files', { method: 'POST', body: f });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      if (await save({ ...data, files: [b, ...data.files] })) notify('Evidence uploaded privately.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setThinking(false);
    }
  }
  async function importData(file: File) {
    if (file.size > 1000000) {
      notify('Use a NextMade JSON export smaller than 1 MB.');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await file.text() });
      const b: any = await r.json();
      if (!r.ok) throw new Error(b.error);
      await load();
      notify('Personal records imported. Upload evidence files separately.');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setSaving(false);
    }
  }
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nextmade-workspace.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Your workspace export is ready.');
  }
  const primary = (text: string, onClick: () => void, icon: ReactNode = <ArrowRight size={16} />) => (
    <button className="btn primary" onClick={onClick} disabled={saving}>
      {text}
      {icon}
    </button>
  );
  const ctx: Ctx = { data, save, saving, thinking, aiReady, notify, formatDate, go, focus, call, firstName };
  const intro = (
    <>
      <div className="eyebrow">
        <span className="live-dot" /> YOUR PERSONAL GROWTH SPACE
      </div>
      <h1>
        A little progress.
        <br />
        <em>A bigger tomorrow.</em>
      </h1>
      <p>
        Bring your ambition. Find your next step.
        <br />
        You don’t have to build it alone.
      </p>
      {primary(
        active.length ? 'Make your daily check-in' : 'Start your first quest',
        () => open(active.length ? 'checkin' : 'goal'),
        active.length ? <Plus size={17} /> : <ArrowRight size={17} />,
      )}
      <Art />
    </>
  );
  if (loadError)
    return (
      <main className="load-screen">
        <Orb />
        <h1>Let’s reconnect.</h1>
        <p>{loadError}</p>
        <button className="btn primary" onClick={load}>
          Try again <RefreshCw size={16} />
        </button>
        <a href="/login">Sign in</a>
      </main>
    );
  if (!loaded)
    return (
      <main className="load-screen">
        <Orb />
        <h1>Making room for your next move.</h1>
        <p>Opening your personal workspace…</p>
      </main>
    );
  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobile ? 'mobile-open' : '')}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go('home');
          }}
        >
          <span className="brand-mark">
            n<span />
          </span>
          nextmade<span className="brand-period">.</span>
        </a>
        <button className="mobile-close icon-btn" aria-label="Close menu" onClick={() => setMobile(false)}>
          <X />
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Workspace">
          {nav.map((n) => (
            <div key={n.id} className="nm-nav-wrap">
              {n.section && <div className="nm-nav-section">{n.section}</div>}
              <button className={page === n.id || (page === 'project' && n.id === 'quests') ? 'nav-item active' : 'nav-item'} onClick={() => go(n.id)}>
                <n.icon size={19} />
                {n.label}
                {n.id === 'nova' && <span className="tiny-new">AI</span>}
                {n.id === 'sprint' && data.sprint && <span className="tiny-new">ON</span>}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={23} />
          <h4>Built one step at a time.</h4>
          <p>
            Your pace. Your possibility.
            <br />
            Keep showing up.
          </p>
          <button onClick={() => open('review')}>
            See your weekly reflection <ArrowUpRight size={14} />
          </button>
        </div>
        <button className={'nav-item settings-nav ' + (page === 'settings' ? 'active' : '')} onClick={() => go('settings')}>
          <Settings size={18} />
          Settings & privacy
        </button>
        <div className="profile">
          <span className="avatar">{firstName.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{firstName}</strong>
            <small>Your personal workspace</small>
          </div>
          <button className="icon-btn" aria-label="Profile settings" onClick={() => go('settings')}>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <div className="crumb">
            <button className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setMobile(true)}>
              <Menu />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{nav.find((n) => n.id === page)?.label || hiddenPages[page] || 'Settings & privacy'}</strong>
          </div>
          <div className="top-right">
            <span className="saved-status">
              <span className="live-dot" />
              {saving ? 'Saving…' : 'Private workspace'}
            </span>
            <button className="btn small" onClick={() => open('goal')}>
              <Plus size={15} />
              New quest
            </button>
            <span className="avatar small-avatar">{firstName[0].toUpperCase()}</span>
          </div>
        </header>
        <main className="content">
          {page === 'home' && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">LET’S MAKE SOMETHING HAPPEN</p>
                  <h2>
                    Welcome back, {firstName}
                    <span className="sun">✳</span>
                  </h2>
                  <p>Your next chapter is built in small, meaningful steps.</p>
                </div>
                <span className="date-label">
                  <Calendar size={15} />
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="hero">{intro}</div>
              {(() => {
                const d = dailyDigest(data, localDay());
                const n = d.followUps.length + d.experiments.length;
                return n ? (
                  <button className="card fc-banner" onClick={() => go('customers')}>
                    <Handshake size={20} />
                    <span>
                      {d.followUps.length ? `${d.followUps.length} customer follow-up${d.followUps.length === 1 ? '' : 's'} due` : ''}
                      {d.followUps.length && d.experiments.length ? ' · ' : ''}
                      {d.experiments.length ? `${d.experiments.length} experiment${d.experiments.length === 1 ? '' : 's'} ready to review` : ''}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ) : null;
              })()}
              <div className="nm-home-strip">
                <button className="card" onClick={() => go('ideas')}>
                  <Lightbulb size={19} />
                  <span>
                    <small>TODAY’S IDEA</small>
                    <strong>{data.feed.day === localDay() && data.feed.items[0] ? data.feed.items[0].title : 'See ideas matched to you'}</strong>
                  </span>
                  <ArrowRight size={15} />
                </button>
                <button className="card" onClick={() => go('sprint')}>
                  <Rocket size={19} />
                  <span>
                    <small>LAUNCH SPRINT</small>
                    <strong>{data.sprint ? `${data.sprint.done.length} of 7 steps done` : 'Idea to business in 7 days'}</strong>
                  </span>
                  <ArrowRight size={15} />
                </button>
                <button className="card" onClick={() => go('about', data.founder.archetype ? {} : { tab: 'quiz' })}>
                  <UserRound size={19} />
                  <span>
                    <small>ABOUT ME</small>
                    <strong>{data.founder.archetype ? 'Builder style set · edit profile' : 'Find your builder style'}</strong>
                  </span>
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="stats-row">
                <div>
                  <span className="stat-icon sage">
                    <Target size={20} />
                  </span>
                  <section>
                    <small>Active quests</small>
                    <strong>
                      {active.length}
                      <span>directions worth exploring</span>
                    </strong>
                  </section>
                </div>
                <div>
                  <span className="stat-icon peach">
                    <CheckCircle2 size={20} />
                  </span>
                  <section>
                    <small>Steps completed</small>
                    <strong>
                      {totals.done}
                      <span>out of {totals.total} commitments</span>
                    </strong>
                  </section>
                </div>
                <div>
                  <span className="stat-icon lavender">
                    <Flame size={20} />
                  </span>
                  <section>
                    <small>Progress points</small>
                    <strong>
                      {xp}
                      <span>{xp < 50 ? 'Explorer' : 'Builder'} · your personal journey</span>
                    </strong>
                  </section>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="card next-card">
                  <div className="card-heading">
                    <h3>Your next meaningful step</h3>
                    <Badge>YOUR FOCUS</Badge>
                  </div>
                  {next ? (
                    <>
                      <p className="goal-kicker">{data.goals.find((g) => g.id === next.goalId)?.title}</p>
                      <h3 className="focus-title">{next.title}</h3>
                      <div className="task-footer">
                        <span>
                          <Clock size={14} />
                          {formatDate(next.due)}
                        </span>
                        <button className="btn primary small" disabled={saving} onClick={() => toggleTask(next.id, 'completed')}>
                          <Check size={15} />
                          Mark complete
                        </button>
                      </div>
                    </>
                  ) : (
                    <Empty
                      title="Every journey starts somewhere."
                      text="Choose a direction and give yourself one clear next step."
                      action={
                        <button className="text-btn" onClick={() => open('goal')}>
                          Create a quest <ArrowRight size={15} />
                        </button>
                      }
                    />
                  )}
                </section>
                <section className="card nova-card">
                  <div className="nova-heading">
                    <Orb small />
                    <div>
                      <h3>Meet Nova</h3>
                      <span>Your AI accountability partner</span>
                    </div>
                    <span className="ai-tag">AI</span>
                  </div>
                  <p>
                    Think it through. Get unstuck.
                    <br />
                    Make your next move a little clearer.
                  </p>
                  <button className="btn" onClick={() => go('nova')}>
                    Let’s talk <ArrowUpRight size={16} />
                  </button>
                </section>
                <section className="card">
                  <div className="card-heading">
                    <h3>Your quests</h3>
                    <button className="text-btn" onClick={() => go('quests')}>
                      View all <ArrowUpRight size={14} />
                    </button>
                  </div>
                  {active.length ? (
                    active.slice(0, 3).map((g) => {
                      const pr = progress(data, g.id);
                      return (
                        <button key={g.id} className="goal-mini" onClick={() => go('quests')}>
                          <span className="mini-icon">
                            <Flag size={18} />
                          </span>
                          <div>
                            <strong>{g.title}</strong>
                            <div className="progress-line">
                              <span style={{ width: (pr.total ? (pr.done / pr.total) * 100 : 0) + '%' }} />
                            </div>
                            <small>
                              {pr.done} of {pr.total} steps completed
                            </small>
                          </div>
                          <ChevronRight size={17} />
                        </button>
                      );
                    })
                  ) : (
                    <p className="muted empty-small">A business, a new skill, a career move. What will you work toward?</p>
                  )}
                </section>
                <section className="card">
                  <div className="card-heading">
                    <h3>A week of showing up</h3>
                    <Badge color="neutral">LAST 7 DAYS</Badge>
                  </div>
                  <div className="week-chart">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - 6 + i);
                      const day = localDay(d),
                        count = data.logs.filter((l) => localDay(new Date(l.created)) === day).length;
                      return (
                        <div key={day} aria-label={`${day}: ${count} check-ins`}>
                          <span style={{ height: Math.max(5, Math.min(count * 25, 85)) + 'px' }} className={count ? 'filled' : ''} />
                          <small>{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</small>
                        </div>
                      );
                    })}
                  </div>
                  <p className="chart-note">
                    {weekly.logs.length
                      ? `${weekly.logs.length} check-ins this week. Keep your own rhythm.`
                      : 'Your first check-in will bring this chart to life.'}
                  </p>
                </section>
              </div>
              <div className="section-title">
                <div>
                  <p className="eyebrow">BETTER WITH A LITTLE STRUCTURE</p>
                  <h3>Find your next spark</h3>
                </div>
                <button className="text-btn" onClick={() => go('challenges')}>
                  Explore challenges <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="challenge-row">
                {challenges.map((ch) => (
                  <button className={'challenge-tile ' + ch.color} key={ch.id} onClick={() => startChallenge(ch)} disabled={saving}>
                    <div>
                      <span className="eyebrow">{ch.tag}</span>
                      <ch.icon size={26} />
                    </div>
                    <h3>{ch.title}</h3>
                    <p>
                      {ch.days} · {data.challenges.includes(ch.id) ? 'In progress' : 'A practical guided challenge'}
                    </p>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              </div>
            </>
          )}
          {page === 'quests' && (
            <>
              <Heading
                eyebrow="GIVE YOUR AMBITION A DIRECTION"
                title="Your quests"
                text="Big goals become possible through small commitments."
                action={primary('New quest', () => open('goal'), <Plus size={16} />)}
              />
              <div className="toolbar">
                <div className="tabs">
                  {['all', 'active', 'paused'].map((f) => (
                    <button className={filter === f ? 'selected' : ''} key={f} onClick={() => setFilter(f)}>
                      {f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <input aria-label="Search quests" placeholder="Find a quest…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="quest-grid">
                {data.goals
                  .filter(
                    (g) =>
                      (filter === 'all' || (filter === 'paused' ? g.paused : !g.paused)) &&
                      g.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((g) => {
                    const pr = progress(data, g.id);
                    return (
                      <section className="card quest-card" key={g.id}>
                        <div className="card-heading">
                          <Badge color={g.paused ? 'neutral' : 'sage'}>{g.paused ? 'PAUSED' : g.category.toUpperCase()}</Badge>
                          <button
                            className="icon-btn"
                            disabled={saving}
                            aria-label={g.paused ? 'Resume quest' : 'Pause quest'}
                            onClick={() =>
                              save({ ...data, goals: data.goals.map((x) => (x.id === g.id ? { ...x, paused: !x.paused } : x)) })
                            }
                          >
                            {g.paused ? <Play size={16} /> : <Pause size={16} />}
                          </button>
                        </div>
                        <h3>
                          <button className="nm-link" onClick={() => go('project', { goalId: g.id })}>
                            {g.title}
                          </button>
                        </h3>
                        {g.why && <p>{g.why}</p>}
                        <div className="progress-meta">
                          <span>
                            {pr.done} / {pr.total} steps
                          </span>
                          <span>{pr.total ? Math.round((pr.done / pr.total) * 100) : 0}%</span>
                        </div>
                        <div className="progress-line">
                          <span style={{ width: (pr.total ? (pr.done / pr.total) * 100 : 0) + '%' }} />
                        </div>
                        <div className="task-list">
                          {data.tasks
                            .filter((t) => t.goalId === g.id)
                            .map((t) => (
                              <div className="task" key={t.id}>
                                <button
                                  className={'task-check ' + (t.status === 'completed' ? 'checked' : '')}
                                  disabled={saving}
                                  aria-label={t.status === 'completed' ? 'Reopen ' + t.title : 'Complete ' + t.title}
                                  onClick={() => toggleTask(t.id, t.status === 'completed' ? 'planned' : 'completed')}
                                >
                                  {t.status === 'completed' && <Check size={13} />}
                                </button>
                                <div>
                                  <span className={t.status === 'completed' ? 'strike' : ''}>{t.title}</span>
                                  <small>
                                    {formatDate(t.due)}
                                    {t.status === 'blocked' ? ' · Blocked' : ''}
                                  </small>
                                </div>
                                <button
                                  className="icon-btn"
                                  aria-label="Flag as blocked"
                                  disabled={saving}
                                  onClick={() => toggleTask(t.id, 'blocked')}
                                >
                                  <Flag size={13} />
                                </button>
                              </div>
                            ))}
                        </div>
                        <div className="quest-footer">
                          <span>
                            <Calendar size={13} />
                            {formatDate(g.due)}
                          </span>
                          <button className="text-btn" onClick={() => go('project', { goalId: g.id })}>
                            Open project <FolderKanban size={14} />
                          </button>
                          <button className="text-btn" onClick={() => open('task')}>
                            Add commitment <Plus size={14} />
                          </button>
                        </div>
                      </section>
                    );
                  })}
              </div>
              {!data.goals.length && (
                <section className="card">
                  <Empty
                    title="What would you like to make real?"
                    text="Start with one goal. You can find your direction as you go."
                    action={primary('Create your first quest', () => open('goal'))}
                  />
                </section>
              )}
            </>
          )}
          {page === 'nova' && (
            <>
              <Heading
                eyebrow="A CLEARER NEXT STEP STARTS HERE"
                title="Talk it through with Nova"
                text="Your AI accountability partner. Thoughtful support, at your pace."
              />
              <div className="nova-layout">
                <section className="card chat-panel">
                  <div className="chat-top">
                    <Orb small />
                    <div>
                      <h3>Nova</h3>
                      <small>{aiReady ? 'AI companion · connected' : 'AI companion · awaiting activation'}</small>
                    </div>
                    <button className="icon-btn" aria-label="Stop spoken reply" onClick={() => window.speechSynthesis?.cancel()}>
                      <Square size={15} />
                    </button>
                  </div>
                  <div className="messages">
                    <div className="message assistant">
                      <span className="message-label">NOVA · AI</span>
                      <p>
                        Hi {firstName}. This is your space to think, reflect, and choose your next step.{' '}
                        {aiReady
                          ? 'What would you like to work through today?'
                          : 'While my live connection is being set up, you can use a guided check-in and record your next commitment.'}
                      </p>
                    </div>
                    {data.messages.map((m) => (
                      <div className={'message ' + m.role} key={m.id}>
                        <span className="message-label">{m.role === 'assistant' ? 'NOVA · AI' : 'YOU'}</span>
                        <p>{m.text}</p>
                      </div>
                    ))}
                    {thinking && (
                      <div className="thinking">
                        <span />
                        <span />
                        <span />
                        Thinking it through…
                      </div>
                    )}
                  </div>
                  <div className="prompt-chips">
                    {['Help me get unstuck', 'Review my progress', 'Challenge my idea'].map((s) => (
                      <button key={s} onClick={() => setInput(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <form className="chat-input" onSubmit={send}>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      maxLength={3000}
                      placeholder="What’s on your mind?"
                      aria-label="Message Nova"
                      rows={2}
                    />
                    <div>
                      <button
                        type="button"
                        className={'icon-btn ' + (listening ? 'recording' : '')}
                        aria-label={listening ? 'Stop listening' : 'Dictate a message'}
                        onClick={voice}
                      >
                        <Mic size={19} />
                      </button>
                      <label className="voice-toggle">
                        <input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} />
                        Speak replies
                      </label>
                      <button className="send-btn" aria-label="Send message" disabled={!input.trim() || thinking || saving || !aiReady}>
                        <Send size={17} />
                      </button>
                    </div>
                  </form>
                  <p className="privacy-line">
                    <ShieldCheck size={12} />
                    Private to your workspace. Voice uses your browser’s speech service.
                  </p>
                </section>
                <aside className="nova-tools">
                  <section className="card">
                    <h3>Make space for progress</h3>
                    <p>You don’t need the perfect words. Start with what actually happened.</p>
                    <button className="btn primary full" onClick={() => open('checkin')}>
                      Guided check-in <ArrowRight size={16} />
                    </button>
                    <button className="btn full" onClick={() => open('review')}>
                      Weekly reflection <BookOpen size={16} />
                    </button>
                  </section>
                  <section className="card warm">
                    <Sparkles size={25} />
                    <h3>One question worth asking</h3>
                    <p>“What is the smallest step I could take today that would make tomorrow easier?”</p>
                    <button className="text-btn" onClick={() => (active.length ? open('task') : open('goal'))}>
                      Make it a commitment <ArrowUpRight size={14} />
                    </button>
                  </section>
                </aside>
              </div>
            </>
          )}
          {page === 'board' && (
            <>
              <Heading
                eyebrow="MORE PERSPECTIVES. CLEARER DECISIONS."
                title="Your advisory board"
                text="A council of AI advisers. You stay in the decision-maker’s seat."
                action={primary('Prepare a board session', () => open('board'), <Plus size={16} />)}
              />
              <div className="board-banner">
                <div>
                  <Badge color="neutral">YOUR PERSONAL COUNCIL</Badge>
                  <h3>Good decisions deserve a second perspective.</h3>
                  <p>Select advisers for your next session. Each brings a different lens.</p>
                </div>
                <div className="stack-avatars">
                  {advisers.slice(0, 4).map((a) => (
                    <span key={a.id} style={{ background: a.color }}>
                      {a.initial}
                    </span>
                  ))}
                </div>
              </div>
              <div className="advisor-grid">
                {advisers.map((a) => (
                  <button
                    className={'card advisor ' + (selected.includes(a.id) ? 'chosen' : '')}
                    key={a.id}
                    aria-pressed={selected.includes(a.id)}
                    onClick={() => setSelected(selected.includes(a.id) ? selected.filter((x) => x !== a.id) : [...selected, a.id])}
                  >
                    <div className="advisor-head">
                      <span className="advisor-avatar" style={{ background: a.color }}>
                        {a.initial}
                      </span>
                      <span className="selection-circle">{selected.includes(a.id) && <Check size={13} />}</span>
                    </div>
                    <small>{a.role}</small>
                    <h3>{a.name}</h3>
                    <p>“{a.question}”</p>
                    <span className="advisor-label">AI ADVISER</span>
                  </button>
                ))}
              </div>
              <div className="section-title">
                <h3>Your decision register</h3>
                <span className="muted">{data.decisions.length} records</span>
              </div>
              {!data.decisions.length ? (
                <section className="card">
                  <Empty
                    icon={Users}
                    title="Give your next decision a little room."
                    text="Prepare an agenda, compare perspectives, and record what you decide."
                  />
                </section>
              ) : (
                data.decisions.map((d) => (
                  <section className="card decision-card" key={d.id}>
                    <div className="card-heading">
                      <h3>{d.title}</h3>
                      <Badge color={d.approved ? 'sage' : 'peach'}>{d.approved ? 'APPROVED BY YOU' : 'DRAFT'}</Badge>
                    </div>
                    <p>{d.context}</p>
                    {d.analysis && (
                      <details>
                        <summary>Read advisory perspectives</summary>
                        <p className="pre-wrap">{d.analysis}</p>
                      </details>
                    )}
                    {d.decision && (
                      <div className="decision-result">
                        <strong>Your decision</strong>
                        <p>{d.decision}</p>
                      </div>
                    )}
                    {d.action && (
                      <p>
                        <strong>Next action:</strong> {d.action} · {formatDate(d.due)}
                      </p>
                    )}
                    <small>
                      {formatDate(d.created)} · {d.advisers.length} advisers selected
                    </small>
                  </section>
                ))
              )}
            </>
          )}
          {page === 'journal' && (
            <>
              <Heading
                eyebrow="THE EVIDENCE OF YOUR EFFORT"
                title="Your progress journal"
                text="The steps, lessons, and little wins that make up your journey."
                action={primary('Add a check-in', () => open('checkin'), <Plus size={16} />)}
              />
              <div className="journal-summary">
                <section className="card">
                  <BookOpen size={22} />
                  <strong>{data.logs.length}</strong>
                  <span>honest check-ins</span>
                </section>
                <section className="card">
                  <Lightbulb size={22} />
                  <strong>{data.logs.filter((l) => l.learning).length}</strong>
                  <span>lessons captured</span>
                </section>
                <section className="card">
                  <Flag size={22} />
                  <strong>{data.logs.filter((l) => l.blocker).length}</strong>
                  <span>blockers identified</span>
                </section>
              </div>
              <div className="toolbar">
                <input
                  placeholder="Search your journal…"
                  aria-label="Search journal"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn" onClick={() => open('review')}>
                  Weekly reflection <ArrowUpRight size={15} />
                </button>
              </div>
              {data.logs
                .filter((l) => (l.activity + ' ' + l.learning).toLowerCase().includes(search.toLowerCase()))
                .map((l) => (
                  <article className="card journal-entry" key={l.id}>
                    <div className="journal-date">
                      <span>{new Date(l.created).getDate()}</span>
                      <small>{new Date(l.created).toLocaleDateString(undefined, { month: 'short' })}</small>
                    </div>
                    <div>
                      <div className="card-heading">
                        <Badge>{data.goals.find((g) => g.id === l.goalId)?.title || 'PERSONAL REFLECTION'}</Badge>
                        <Badge color="neutral">SELF-REPORTED</Badge>
                      </div>
                      <h3>{l.activity}</h3>
                      {l.learning && (
                        <p>
                          <strong>What I learned</strong>
                          <br />
                          {l.learning}
                        </p>
                      )}
                      {l.blocker && (
                        <p className="blocker">
                          <Flag size={14} />
                          {l.blocker}
                        </p>
                      )}
                      {l.next && (
                        <p>
                          <strong>Next step:</strong> {l.next}
                        </p>
                      )}
                      {l.evidence && (
                        <p>
                          <strong>Evidence:</strong> {l.evidence}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              {!data.logs.length && (
                <section className="card">
                  <Empty
                    icon={BookOpen}
                    title="Your story of progress starts here."
                    text="Report what you did, what you learned, and what comes next."
                    action={primary('Make your first check-in', () => open('checkin'))}
                  />
                </section>
              )}
              <section className="card evidence-card">
                <div className="card-heading">
                  <div>
                    <h3>Your evidence locker</h3>
                    <p>Keep your work close. Files stay private.</p>
                  </div>
                  <label className="btn">
                    <Upload size={15} />
                    Add evidence
                    <input
                      hidden
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.docx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) upload(e.target.files[0]);
                        e.target.value = '';
                      }}
                      disabled={saving || thinking}
                    />
                  </label>
                </div>
                {data.files.map((f) => (
                  <a className="file-row" key={f.id} href={'/api/files?id=' + f.id}>
                    <FileText size={18} />
                    <strong>{f.name}</strong>
                    <span>{Math.ceil(f.size / 1024)} KB</span>
                    <Download size={16} />
                  </a>
                ))}
                {!data.files.length && <p className="muted">PDF, documents, images or notes · up to 4 MB each</p>}
              </section>
            </>
          )}
          {page === 'challenges' && (
            <>
              <Heading
                eyebrow="SMALL MISSIONS. MEANINGFUL MOMENTUM."
                title="Find your next spark"
                text="Practical challenges to help you learn by doing."
              />
              <div className="challenge-hero">
                <Trophy size={38} />
                <div>
                  <h3>Progress is more interesting when you play.</h3>
                  <p>Choose a challenge. Complete real work. Reflect on what you learn.</p>
                </div>
                <Badge color="neutral">YOUR PACE, ALWAYS</Badge>
              </div>
              <div className="challenge-grid">
                {challenges.map((ch) => (
                  <section className="card challenge-detail" key={ch.id}>
                    <div className={'challenge-cover ' + ch.color}>
                      <ch.icon size={58} />
                      <span>{ch.days}</span>
                    </div>
                    <div className="challenge-body">
                      <Badge>{ch.tag}</Badge>
                      <h3>{ch.title}</h3>
                      <p>{ch.desc}</p>
                      <ol>
                        {ch.tasks.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ol>
                      <button className="btn primary full" disabled={saving} onClick={() => startChallenge(ch)}>
                        {data.challenges.includes(ch.id) ? 'Continue your challenge' : 'Start this challenge'}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </section>
                ))}
              </div>
              <section className="card points-card">
                <Flame size={30} />
                <div>
                  <h3>{xp} progress points. All yours.</h3>
                  <p>
                    10 points for a quest, 5 for a completed commitment, 5 for an honest check-in, and 10 for an approved decision. No
                    public ranking. No pressure to keep a perfect streak.
                  </p>
                </div>
              </section>
            </>
          )}
          {page === 'meetings' && (
            <>
              <Heading
                eyebrow="TURN CONVERSATIONS INTO COMMITMENTS"
                title="Your meeting room"
                text="Prepare, reflect, and keep decisions connected to action."
                action={primary('Add a meeting record', () => open('meeting'), <Plus size={16} />)}
              />
              <div className="meeting-grid">
                <section className="card warm meeting-option">
                  <Users size={32} />
                  <h3>Private board session</h3>
                  <p>A focused space to explore a decision with your selected AI advisers.</p>
                  <button className="btn" onClick={() => open('board')}>
                    Prepare a session <ArrowUpRight size={15} />
                  </button>
                </section>
                <section className="card meeting-option">
                  <FileText size={32} />
                  <h3>After the conversation</h3>
                  <p>Save permitted meeting notes. Review decisions, open questions and next actions.</p>
                  <button className="btn" onClick={() => open('meeting')}>
                    Add your notes <Plus size={15} />
                  </button>
                </section>
                <section className="card meeting-option">
                  <Video size={32} />
                  <Badge color="neutral">NOT CONNECTED</Badge>
                  <h3>Bring Nova to a live meeting</h3>
                  <p>
                    Live participation needs a conferencing connection and attendee consent. No external meetings are currently joined or
                    recorded.
                  </p>
                </section>
              </div>
              <div className="section-title">
                <h3>Meeting records</h3>
                <span className="muted">Private to your workspace</span>
              </div>
              {!data.meetings.length ? (
                <section className="card">
                  <Empty
                    icon={Video}
                    title="Keep the useful parts of every conversation."
                    text="Add notes you have permission to store, then record your next commitment."
                  />
                </section>
              ) : (
                data.meetings.map((m) => (
                  <section className="card decision-card" key={m.id}>
                    <div className="card-heading">
                      <h3>{m.title}</h3>
                      <span className="muted">{formatDate(m.created)}</span>
                    </div>
                    <details>
                      <summary>View meeting notes</summary>
                      <p className="pre-wrap">{m.notes}</p>
                    </details>
                    {m.summary && (
                      <div className="decision-result">
                        <strong>AI draft for review</strong>
                        <p className="pre-wrap">{m.summary}</p>
                      </div>
                    )}
                    <button className="text-btn" onClick={() => (active.length ? open('task') : open('goal'))}>
                      Create a commitment <Plus size={14} />
                    </button>
                  </section>
                ))
              )}
            </>
          )}
          {page === 'circles' && <Circles name={firstName} />}
          {page === 'ideas' && <Ideas key={'ideas' + visit} ctx={ctx} />}
          {page === 'agents' && <Agents key={'agents' + visit} ctx={ctx} />}
          {page === 'about' && <AboutMe key={'about' + visit} ctx={ctx} />}
          {page === 'project' && <Project key={'project' + visit} ctx={ctx} />}
          {page === 'mystuff' && <MyStuff key={'mystuff' + visit} ctx={ctx} />}
          {page === 'sprint' && <Sprint key={'sprint' + visit} ctx={ctx} />}
          {page === 'gallery' && <Gallery ctx={ctx} />}
          {page === 'toolkit' && <Toolkit />}
          {page === 'customers' && (
            <Customers
              data={data}
              save={save}
              saving={saving}
              thinking={thinking}
              aiReady={aiReady}
              ai={ai}
              notify={notify}
              formatDate={formatDate}
            />
          )}
          {page === 'settings' && (
            <>
              <Heading
                eyebrow="YOUR SPACE. YOUR CHOICES."
                title="Settings & privacy"
                text="Make NextMade work for you, and keep control of your information."
              />
              <div className="settings-grid">
                <section className="card">
                  <h3>Your preferences</h3>
                  <form
                    onSubmit={async (e) => {
                      const f = values(e);
                      if (
                        await save({
                          ...data,
                          profile: { ...data.profile, name: f.name, path: f.path, style: f.style as any, timezone: f.timezone },
                        })
                      )
                        notify('Preferences saved.');
                    }}
                  >
                    <Field label="What should we call you?">
                      <input name="name" defaultValue={data.profile.name} maxLength={80} required />
                    </Field>
                    <Field label="Your current direction">
                      <select name="path" defaultValue={data.profile.path}>
                        {paths.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Nova’s coaching style">
                      <select name="style" defaultValue={data.profile.style}>
                        <option>Supportive</option>
                        <option>Direct</option>
                        <option>Structured</option>
                      </select>
                    </Field>
                    <Field label="Timezone">
                      <select name="timezone" defaultValue={data.profile.timezone}>
                        {['America/Toronto', 'America/Vancouver', 'Africa/Lagos', 'Europe/London', 'Asia/Dubai', 'Etc/UTC'].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <button className="btn primary" disabled={saving}>
                      Save preferences <Check size={16} />
                    </button>
                  </form>
                </section>
                <div>
                  <section className="card">
                    <ShieldCheck size={25} />
                    <h3>Private by default</h3>
                    <p>
                      Your goals, conversations and evidence are saved to your signed-in workspace. They are not shared with peers or
                      sponsors.
                    </p>
                    <p>
                      Nova is AI, not a human adviser. AI requests use your relevant workspace context when the provider is connected. No
                      raw voice recordings are stored by NextMade. Your browser’s speech service may process dictated audio.
                    </p>
                    <button className="btn" onClick={exportData}>
                      <Download size={15} />
                      Export my workspace
                    </button>
                    <label className="btn" style={{ marginTop: 12 }}>
                      <Upload size={15} />
                      Import an earlier workspace
                      <input
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        disabled={saving}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) importData(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <p style={{ fontSize: 11, marginTop: 10 }}>
                      Import into a new workspace before its first save. Personal records transfer; uploaded files and shared circles do
                      not. Download evidence from the original site and upload it here separately.
                    </p>
                  </section>
                  <section className="card setting-status">
                    <h3>Connections</h3>
                    <div>
                      <span>Nova AI reasoning</span>
                      <Badge color={aiReady ? 'sage' : 'neutral'}>{aiReady ? 'CONNECTED' : 'AWAITING ACTIVATION'}</Badge>
                    </div>
                    <div>
                      <span>Live meetings</span>
                      <Badge color="neutral">NOT CONNECTED</Badge>
                    </div>
                    <div>
                      <span>Email reminders</span>
                      <Badge color={emailReady ? 'sage' : 'neutral'}>{emailReady ? 'CONNECTED' : 'NOT CONNECTED'}</Badge>
                    </div>
                    <p className="muted">Your saved goals and progress work independently of these connections.</p>
                  </section>
                  <section className="card">
                    <Mail size={22} />
                    <h3>Email reminders</h3>
                    <p className="muted">Sent to your account email. Reminders arrive on mornings when something is due; the letter arrives on Mondays.</p>
                    {[
                      ['reminders', 'Daily reminders for due commitments, follow-ups and experiments'],
                      ['weeklyLetter', 'Weekly progress letter, with a note from Nova'],
                    ].map(([key, label]) => (
                      <label key={key} className="fc-toggle">
                        <input
                          type="checkbox"
                          checked={!!(data.profile as any)[key]}
                          disabled={saving}
                          onChange={async (e) => {
                            if (await save({ ...data, profile: { ...data.profile, [key]: e.target.checked } }))
                              notify(e.target.checked ? 'Turned on.' : 'Turned off.');
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                    <div className="fc-actions">
                      {(['daily', 'weekly'] as const).map((kind) => (
                        <button
                          key={kind}
                          className="btn"
                          disabled={saving || !emailReady}
                          onClick={async () => {
                            const r = await fetch('/api/reminders/test', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ kind }),
                            });
                            const b: any = await r.json().catch(() => ({}));
                            notify(r.ok ? `Preview sent to ${b.to}.` : b.error || 'Could not send the preview.');
                          }}
                        >
                          Send me a {kind === 'daily' ? 'reminder' : 'weekly letter'} preview
                        </button>
                      ))}
                    </div>
                    {!emailReady && <p className="muted">Email sending is not connected on this deployment yet.</p>}
                  </section>
                  <section className="card">
                    <h3>Account controls</h3>
                    <button
                      className="btn"
                      onClick={async () => {
                        const r = await fetch('/api/auth/logout', { method: 'POST' });
                        if (r.ok) location.assign('/login');
                        else notify('Could not sign out. Please try again.');
                      }}
                    >
                      Sign out
                    </button>
                    <button className="text-btn danger" onClick={() => open('delete')}>
                      Delete workspace data
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}
          <footer className="app-footer">
            <span>
              nextmade. <span>Make your next move real.</span>
            </span>
            <button onClick={() => go('settings')}>
              <ShieldCheck size={13} />
              Your space is private
            </button>
          </footer>
        </main>
      </div>
      <dialog
        ref={dialog}
        className="modal"
        onCancel={() => setModal('')}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <button className="modal-close icon-btn" aria-label="Close dialog" onClick={close}>
          <X size={20} />
        </button>
        {modal === 'goal' && (
          <>
            <p className="eyebrow">A NEW DIRECTION</p>
            <h2>What would you like to make real?</h2>
            <p className="muted">Start with a goal you can take a small step toward.</p>
            <form onSubmit={addGoal}>
              <Field label="Your quest">
                <input name="title" placeholder="e.g. Find my first consulting customer" maxLength={500} required autoFocus />
              </Field>
              <div className="form-row">
                <Field label="Your direction">
                  <select name="category" defaultValue={data.profile.path}>
                    {paths.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Target date">
                  <input name="due" type="date" required />
                </Field>
              </div>
              <Field label="Why does this matter to you?">
                <textarea name="why" rows={2} maxLength={2000} placeholder="Give your goal a little meaning." />
              </Field>
              <Field label="Your first small commitment">
                <input name="first" maxLength={500} placeholder="e.g. Interview one potential customer" />
              </Field>
              <Field label="When will you take that step?">
                <input type="date" name="firstDue" defaultValue={localDay()} />
              </Field>
              <FormError text={formError} />
              <button className="btn primary full" disabled={saving}>
                {saving ? 'Saving…' : 'Create my quest'}
                <ArrowRight size={16} />
              </button>
            </form>
          </>
        )}
        {modal === 'checkin' && (
          <>
            <p className="eyebrow">SHOW UP AS YOU ARE</p>
            <h2>Your daily check-in</h2>
            <p className="muted">Progress, a lesson, or a blocker. It all belongs here.</p>
            <form onSubmit={checkIn}>
              <Field label="Which quest are you working on?">
                <select name="goalId">
                  <option value="">Personal reflection</option>
                  {data.goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="What did you do?">
                <textarea name="activity" rows={2} maxLength={3000} required autoFocus placeholder="Be specific. Small actions count." />
              </Field>
              <Field label="What did you learn?">
                <textarea name="learning" rows={2} maxLength={3000} />
              </Field>
              <Field label="What got in the way?">
                <input name="blocker" maxLength={2000} placeholder="Optional. No judgement here." />
              </Field>
              <Field label="What’s your next commitment?">
                <input name="next" maxLength={500} placeholder="One manageable action" />
              </Field>
              <Field label="When will you do it?">
                <input name="due" type="date" defaultValue={localDay()} />
              </Field>
              <Field label="Evidence or reference (optional)">
                <input name="evidence" maxLength={2000} placeholder="A note or a link to your work" />
              </Field>
              <FormError text={formError} />
              <button className="btn primary full" disabled={saving}>
                {saving ? 'Saving…' : 'Save my check-in'}
                <Check size={16} />
              </button>
            </form>
          </>
        )}
        {modal === 'task' && (
          <>
            <p className="eyebrow">MAKE IT MANAGEABLE</p>
            <h2>One clear next step</h2>
            {!data.goals.length ? (
              <Empty
                title="Create a quest first"
                text="Your commitments need a direction."
                action={
                  <button className="btn primary" onClick={() => open('goal')}>
                    Create a quest
                  </button>
                }
              />
            ) : (
              <form onSubmit={addTask}>
                <Field label="Quest">
                  <select name="goalId">
                    {data.goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="What will you do?">
                  <input name="title" maxLength={500} required autoFocus />
                </Field>
                <Field label="When?">
                  <input name="due" type="date" required defaultValue={localDay()} />
                </Field>
                <FormError text={formError} />
                <button className="btn primary full" disabled={saving}>
                  Save commitment <Check size={16} />
                </button>
              </form>
            )}
          </>
        )}
        {modal === 'review' && (
          <>
            <p className="eyebrow">PAUSE. NOTICE. KEEP GOING.</p>
            <h2>Your weekly reflection</h2>
            <p className="muted">A factual snapshot of your workspace, ready for your reflection.</p>
            <div className="review-counts">
              <div>
                <strong>{weekly.logs.length}</strong>
                <span>check-ins this week</span>
              </div>
              <div>
                <strong>{weekly.completed.length}</strong>
                <span>steps completed overall</span>
              </div>
              <div>
                <strong>{weekly.blocked.length}</strong>
                <span>current blockers</span>
              </div>
            </div>
            <h3>What you learned this week</h3>
            {weekly.learnings.length ? (
              <ul>
                {weekly.learnings.slice(0, 6).map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">Add a learning note to your next check-in.</p>
            )}
            <h3>What comes next</h3>
            {weekly.next.slice(0, 4).map((t) => (
              <p key={t.id} className="review-task">
                <Flag size={14} />
                {t.title}
                <small>{formatDate(t.due)}</small>
              </p>
            ))}
            <button className="btn primary full" onClick={() => open('checkin')}>
              Record my reflection <ArrowRight size={16} />
            </button>
          </>
        )}
        {modal === 'board' && (
          <>
            <p className="eyebrow">YOUR AI ADVISORY COUNCIL</p>
            <h2>A decision worth thinking through</h2>
            <p className="muted">{selected.length} advisers selected. You approve every decision.</p>
            <form onSubmit={boardSubmit}>
              <Field label="The decision or question">
                <input name="title" maxLength={500} required autoFocus placeholder="e.g. Should I launch now or keep testing?" />
              </Field>
              <Field label="Context, evidence and constraints">
                <textarea name="context" rows={4} maxLength={12000} placeholder="What do you know? What remains uncertain?" />
              </Field>
              <button
                type="button"
                className="btn full"
                disabled={!aiReady || thinking || !selected.length}
                onClick={async (e) => {
                  const form = e.currentTarget.closest('form')!,
                    f = new FormData(form);
                  const text = String(f.get('title')) + '\n' + String(f.get('context'));
                  if (!String(f.get('title')).trim()) {
                    setFormError('Enter the decision first.');
                    return;
                  }
                  const r = await ai('board', text);
                  if (r) setDraftAnalysis(r);
                }}
              >
                <Sparkles size={16} />
                {thinking ? 'Council is considering…' : 'Ask my AI council'}
              </button>
              {!aiReady && (
                <p className="connection-note">Live AI is awaiting activation. You can save this agenda and your own decision now.</p>
              )}
              {draftAnalysis && <div className="analysis-box pre-wrap">{draftAnalysis}</div>}
              <Field label="Your decision (optional)">
                <textarea name="decision" rows={2} maxLength={3000} />
              </Field>
              <div className="form-row">
                <Field label="Next action">
                  <input name="action" maxLength={500} />
                </Field>
                <Field label="Due date">
                  <input name="due" type="date" />
                </Field>
              </div>
              <label className="check-label">
                <input name="approve" type="checkbox" />I approve this decision. Add its action to my first active quest.
              </label>
              <FormError text={formError} />
              <button className="btn primary full" disabled={saving || thinking}>
                Save session record <Check size={16} />
              </button>
            </form>
          </>
        )}
        {modal === 'meeting' && (
          <>
            <p className="eyebrow">KEEP THE USEFUL PARTS</p>
            <h2>Save a meeting record</h2>
            <form onSubmit={meetingSubmit}>
              <Field label="Meeting title">
                <input name="title" maxLength={500} required autoFocus />
              </Field>
              <Field label="Notes or transcript">
                <textarea name="notes" rows={7} maxLength={20000} required placeholder="Paste notes you have permission to save." />
              </Field>
              <label className="check-label">
                <input name="consent" type="checkbox" required />I have permission to store and, if requested, process these notes with AI.
              </label>
              <button
                type="button"
                className="btn full"
                disabled={!aiReady || thinking}
                onClick={async (e) => {
                  const form = e.currentTarget.closest('form')!,
                    f = new FormData(form);
                  if (f.get('consent') !== 'on') {
                    setFormError('Confirm permission before AI processing.');
                    return;
                  }
                  const r = await ai('meeting', String(f.get('notes')));
                  if (r) setDraftAnalysis(r);
                }}
              >
                <Sparkles size={16} />
                {thinking ? 'Preparing review…' : 'Prepare AI draft minutes'}
              </button>
              {draftAnalysis && <div className="analysis-box pre-wrap">{draftAnalysis}</div>}
              <FormError text={formError} />
              <button className="btn primary full" disabled={saving || thinking}>
                Save meeting record <Check size={16} />
              </button>
            </form>
          </>
        )}
        {modal === 'delete' && (
          <>
            <p className="eyebrow">ACCOUNT CONTROL</p>
            <h2>Delete your workspace?</h2>
            <p>
              This removes your goals, check-ins, conversations, decisions, meetings, uploaded evidence, circle posts and circles you own.
              Export your workspace first if you want a copy. This cannot be undone.
            </p>
            <form
              onSubmit={async (e) => {
                const f = values(e);
                if (f.confirm !== 'DELETE') return;
                setSaving(true);
                try {
                  const r = await fetch('/api/workspace', { method: 'DELETE' });
                  if (!r.ok) throw new Error('Could not delete your workspace.');
                  setModal('');
                  await load();
                  notify('Workspace data deleted.');
                } catch (e) {
                  setFormError(e instanceof Error ? e.message : 'Deletion failed.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <Field label="Type DELETE to confirm">
                <input name="confirm" required pattern="DELETE" autoFocus />
              </Field>
              <FormError text={formError} />
              <button className="btn destructive full" disabled={saving}>
                Delete workspace data
              </button>
            </form>
          </>
        )}
      </dialog>
      <FeedbackWidget page={page} notify={notify} />
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button className="icon-btn" aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function Heading({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function FormError({ text }: { text: string }) {
  return text ? (
    <p className="form-error" role="alert">
      {text}
    </p>
  ) : null;
}
