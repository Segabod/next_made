'use client';
// First Customers: offer builder, customer conversation tracker and experiment log.
import { useState, type FormEvent } from 'react';
import { Check, Copy, FlaskConical, Handshake, Lightbulb, Pencil, Plus, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { localDay, stageLabels, stages, type Workspace } from './domain';

type Offer = Workspace['offers'][number];
type Contact = Workspace['contacts'][number];
type Experiment = Workspace['experiments'][number];
type Props = {
  data: Workspace;
  save: (next: Workspace) => Promise<boolean>;
  saving: boolean;
  thinking: boolean;
  aiReady: boolean;
  ai: (mode: string, text: string) => Promise<string | null>;
  notify: (text: string) => void;
  formatDate: (d: string) => string;
  initialTab?: 'offer' | 'pipeline' | 'experiments';
};

const uid = () => crypto.randomUUID(),
  now = () => new Date().toISOString();
const blankOffer = (): Offer => ({
  id: '',
  title: '',
  audience: '',
  problem: '',
  promise: '',
  price: '',
  proof: '',
  status: 'draft',
  created: '',
  updated: '',
});
const values = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
};
function parseJson(text: string): Record<string, string> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]);
    return o && typeof o === 'object' ? o : null;
  } catch {
    return null;
  }
}
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);

export default function Customers(p: Props) {
  const { data, save, saving, thinking, aiReady, ai, notify, formatDate } = p;
  const [tab, setTab] = useState<'offer' | 'pipeline' | 'experiments'>(p.initialTab || 'pipeline');
  const busy = saving || thinking;
  const conversations = data.contacts.filter((c) => c.stage !== 'contacted' && c.stage !== 'lost').length;
  const paid = data.contacts.filter((c) => c.stage === 'paid');
  const revenue = paid.reduce((s, c) => s + (c.value || 0), 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FROM IDEA TO FIRST YES</p>
          <h2>First customers</h2>
          <p>Shape an offer, talk to real people, and test what you believe. Evidence beats guessing.</p>
        </div>
      </div>
      <div className="journal-summary">
        <section className="card">
          <Handshake size={22} />
          <strong>{data.contacts.length}</strong>
          <span>people contacted</span>
        </section>
        <section className="card">
          <Sparkles size={22} />
          <strong>{conversations}</strong>
          <span>real conversations</span>
        </section>
        <section className="card">
          <Check size={22} />
          <strong>{paid.length}</strong>
          <span>
            {paid.length === 1 ? 'paying customer' : 'paying customers'}
            {revenue ? ` · ${revenue.toLocaleString()}` : ''}
          </span>
        </section>
      </div>
      <div className="toolbar">
        <div className="tabs" role="tablist">
          {(
            [
              ['pipeline', 'Conversations'],
              ['offer', 'Offer builder'],
              ['experiments', 'Experiments'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'selected' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'offer' && <OfferBuilder {...p} busy={busy} />}
      {tab === 'pipeline' && <Pipeline {...p} busy={busy} />}
      {tab === 'experiments' && <Experiments {...p} busy={busy} />}
      {!aiReady && <p className="muted fc-note">Nova drafting turns on once an AI provider is connected. Everything else works now.</p>}
    </>
  );
}

function OfferBuilder(p: Props & { busy: boolean }) {
  const { data, save, saving, thinking, aiReady, ai, notify, formatDate, busy } = p;
  const [draft, setDraft] = useState<Offer | null>(null);
  const [brief, setBrief] = useState('');
  const [coach, setCoach] = useState('');
  async function askNova() {
    if (!brief.trim()) return;
    const text = await ai('offer', brief.trim());
    if (!text) return;
    const o = parseJson(text);
    if (!o) {
      setCoach(text);
      notify('Nova replied, but not in the expected format. Its notes are below.');
      return;
    }
    setDraft({ ...(draft || blankOffer()), ...pick(o) });
    setCoach(String(o.coach || ''));
  }
  const pick = (o: Record<string, string>) => {
    const s = (k: string, n: number) => String(o[k] || '').slice(0, n);
    return {
      title: s('title', 500),
      audience: s('audience', 2000),
      problem: s('problem', 2000),
      promise: s('promise', 2000),
      price: s('price', 500),
      proof: s('proof', 2000),
    };
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    const f = values(e);
    const base = draft || blankOffer();
    const offer: Offer = {
      ...base,
      id: base.id || uid(),
      title: f.title.trim(),
      audience: f.audience,
      problem: f.problem,
      promise: f.promise,
      price: f.price,
      proof: f.proof,
      status: (f.status as Offer['status']) || 'draft',
      created: base.created || now(),
      updated: now(),
    };
    const exists = data.offers.some((o) => o.id === offer.id);
    if (!exists && data.offers.length >= 20) return notify('You can keep up to 20 offers. Archive one first.');
    if (await save({ ...data, offers: exists ? data.offers.map((o) => (o.id === offer.id ? offer : o)) : [...data.offers, offer] })) {
      setDraft(null);
      setCoach('');
      setBrief('');
      notify('Offer saved. Now test it with a real person.');
    }
  }
  return (
    <div className="fc-grid">
      <section className="card">
        {draft ? (
          <form onSubmit={submit} key={draft.id || 'new' + draft.title}>
            <div className="card-heading">
              <h3>{draft.id ? 'Edit offer' : 'New offer'}</h3>
              <button type="button" className="icon-btn" aria-label="Close offer form" onClick={() => setDraft(null)}>
                <X size={16} />
              </button>
            </div>
            <Field label="Name your offer">
              <input
                name="title"
                required
                maxLength={500}
                defaultValue={draft.title}
                placeholder="e.g. 2-week bookkeeping clean-up for salons"
              />
            </Field>
            <Field label="Who is it for, exactly?">
              <textarea name="audience" rows={2} maxLength={2000} defaultValue={draft.audience} />
            </Field>
            <Field label="What urgent problem does it solve?">
              <textarea name="problem" rows={2} maxLength={2000} defaultValue={draft.problem} />
            </Field>
            <Field label="What specific result do you promise?">
              <textarea name="promise" rows={2} maxLength={2000} defaultValue={draft.promise} />
            </Field>
            <Field label="Price to test">
              <input name="price" maxLength={500} defaultValue={draft.price} placeholder="e.g. $300 one-off, pilot price" />
            </Field>
            <Field label="Why should they trust you? (real proof only)">
              <textarea name="proof" rows={2} maxLength={2000} defaultValue={draft.proof} />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={draft.status}>
                <option value="draft">Draft</option>
                <option value="testing">Testing with people</option>
                <option value="validated">Validated (someone paid)</option>
              </select>
            </Field>
            <button className="btn primary full" disabled={busy}>
              {saving ? 'Saving…' : 'Save offer'} <Check size={16} />
            </button>
          </form>
        ) : (
          <>
            <h3>Shape a testable offer</h3>
            <p className="muted">A good first offer is specific: one kind of customer, one painful problem, one clear result, one price.</p>
            <Field label="Describe your skill or idea, and who you think it helps">
              <textarea
                rows={4}
                maxLength={3000}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="I am an accountant who wants to help small salons stop losing money on…"
              />
            </Field>
            <div className="fc-actions">
              <button className="btn primary" disabled={busy || !aiReady || !brief.trim()} onClick={askNova}>
                {thinking ? 'Nova is thinking…' : 'Draft with Nova'} <Wand2 size={15} />
              </button>
              <button className="btn" disabled={busy} onClick={() => setDraft(blankOffer())}>
                Write it myself <Pencil size={15} />
              </button>
            </div>
          </>
        )}
        {coach && (
          <p className="fc-coach">
            <Lightbulb size={15} /> {coach}
          </p>
        )}
      </section>
      <div>
        {data.offers.map((o) => (
          <section className="card fc-offer" key={o.id}>
            <div className="card-heading">
              <span className={'badge ' + (o.status === 'validated' ? 'sage' : o.status === 'testing' ? 'peach' : 'neutral')}>
                {o.status.toUpperCase()}
              </span>
              <div className="fc-row-actions">
                <button className="icon-btn" aria-label={'Edit ' + o.title} disabled={busy} onClick={() => setDraft(o)}>
                  <Pencil size={14} />
                </button>
                <button
                  className="icon-btn"
                  aria-label={'Delete ' + o.title}
                  disabled={busy}
                  onClick={() => confirm('Delete this offer?') && save({ ...data, offers: data.offers.filter((x) => x.id !== o.id) })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3>{o.title}</h3>
            <dl className="fc-dl">
              {o.audience && (
                <>
                  <dt>For</dt>
                  <dd>{o.audience}</dd>
                </>
              )}
              {o.problem && (
                <>
                  <dt>Problem</dt>
                  <dd>{o.problem}</dd>
                </>
              )}
              {o.promise && (
                <>
                  <dt>Result</dt>
                  <dd>{o.promise}</dd>
                </>
              )}
              {o.price && (
                <>
                  <dt>Price</dt>
                  <dd>{o.price}</dd>
                </>
              )}
              {o.proof && (
                <>
                  <dt>Proof</dt>
                  <dd>{o.proof}</dd>
                </>
              )}
            </dl>
            <p className="muted">{data.contacts.filter((c) => c.offerId === o.id).length} conversations linked</p>
          </section>
        ))}
        {!data.offers.length && <p className="muted">Your offers will appear here.</p>}
      </div>
    </div>
  );
}

function Pipeline(p: Props & { busy: boolean }) {
  const { data, save, saving, thinking, aiReady, ai, notify, formatDate, busy } = p;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string>('');
  const [message, setMessage] = useState<{ id: string; text: string } | null>(null);
  const update = (id: string, patch: Partial<Contact>) =>
    save({ ...data, contacts: data.contacts.map((c) => (c.id === id ? { ...c, ...patch, updated: now() } : c)) });
  async function add(e: FormEvent<HTMLFormElement>) {
    const f = values(e);
    if (data.contacts.length >= 500) return notify('You have reached 500 contacts. Remove old ones first.');
    const c: Contact = {
      id: uid(),
      name: f.name.trim(),
      channel: f.channel || '',
      offerId: f.offerId || '',
      stage: 'contacted',
      notes: f.notes || '',
      nextStep: f.nextStep || '',
      nextDate: f.nextDate || '',
      value: 0,
      created: now(),
      updated: now(),
    };
    if (await save({ ...data, contacts: [...data.contacts, c] })) {
      setAdding(false);
      notify('Added. Every conversation teaches you something.');
    }
  }
  async function draftMessage(c: Contact) {
    const offer = data.offers.find((o) => o.id === c.offerId);
    const text = await ai(
      'outreach',
      `Write a message to ${c.name} (reached via ${c.channel || 'unknown channel'}). Current stage: ${stageLabels[c.stage]}. Planned next step: ${c.nextStep || 'none'}. Notes: ${c.notes || 'none'}. Offer: ${offer ? JSON.stringify(offer) : 'not chosen yet'}.`,
    );
    if (text) setMessage({ id: c.id, text });
  }
  async function saveEdit(e: FormEvent<HTMLFormElement>, c: Contact) {
    const f = values(e);
    if (
      await update(c.id, {
        notes: f.notes,
        nextStep: f.nextStep,
        nextDate: f.nextDate,
        value: Math.max(0, Number(f.value) || 0),
        channel: f.channel,
      })
    )
      setEditing('');
  }
  const today = localDay();
  return (
    <>
      <div className="fc-actions">
        <button className="btn primary" onClick={() => setAdding(!adding)} disabled={busy}>
          {adding ? 'Cancel' : 'Add a person'} {adding ? <X size={15} /> : <Plus size={15} />}
        </button>
        <span className="muted">Aim for real conversations, not likes. Ten honest chats beat a hundred posts.</span>
      </div>
      {adding && (
        <section className="card">
          <form onSubmit={add} className="fc-form-grid">
            <Field label="Name">
              <input name="name" required maxLength={120} autoFocus />
            </Field>
            <Field label="Where you reached them">
              <input name="channel" maxLength={500} placeholder="LinkedIn, referral, WhatsApp…" />
            </Field>
            <Field label="Offer">
              <select name="offerId" defaultValue="">
                <option value="">Not linked</option>
                {data.offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next step">
              <input name="nextStep" maxLength={500} placeholder="Follow up about a call" />
            </Field>
            <Field label="Follow up on">
              <input name="nextDate" type="date" defaultValue={today} />
            </Field>
            <Field label="Notes">
              <input name="notes" maxLength={5000} />
            </Field>
            <button className="btn primary" disabled={busy}>
              Save person <Check size={15} />
            </button>
          </form>
        </section>
      )}
      <div className="fc-board">
        {stages.map((stage) => {
          const list = data.contacts.filter((c) => c.stage === stage);
          return (
            <section className="card fc-column" key={stage}>
              <h3>
                {stageLabels[stage]} <span>{list.length}</span>
              </h3>
              {list.map((c) => (
                <article
                  className={'fc-contact' + (c.nextDate && c.nextDate <= today && stage !== 'paid' && stage !== 'lost' ? ' due' : '')}
                  key={c.id}
                >
                  <strong>{c.name}</strong>
                  {c.channel && <small>{c.channel}</small>}
                  {c.nextStep && (
                    <p>
                      Next: {c.nextStep}
                      {c.nextDate ? ` · ${formatDate(c.nextDate)}` : ''}
                    </p>
                  )}
                  {stage === 'paid' && c.value > 0 && <p>Paid {c.value.toLocaleString()}</p>}
                  <select
                    aria-label={'Move ' + c.name}
                    value={c.stage}
                    disabled={busy}
                    onChange={async (e) => {
                      const next = e.target.value as Contact['stage'];
                      if ((await update(c.id, { stage: next })) && next === 'paid')
                        notify('A paying customer! Record what they paid and what convinced them.');
                    }}
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {stageLabels[s]}
                      </option>
                    ))}
                  </select>
                  <div className="fc-row-actions">
                    <button className="text-btn" disabled={busy} onClick={() => setEditing(editing === c.id ? '' : c.id)}>
                      <Pencil size={12} /> Details
                    </button>
                    <button className="text-btn" disabled={busy || !aiReady} onClick={() => draftMessage(c)}>
                      <Wand2 size={12} /> Draft message
                    </button>
                    <button
                      className="text-btn"
                      disabled={busy}
                      aria-label={'Remove ' + c.name}
                      onClick={() =>
                        confirm('Remove ' + c.name + '?') && save({ ...data, contacts: data.contacts.filter((x) => x.id !== c.id) })
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {editing === c.id && (
                    <form onSubmit={(e) => saveEdit(e, c)} className="fc-edit">
                      <Field label="Where you reached them">
                        <input name="channel" defaultValue={c.channel} maxLength={500} />
                      </Field>
                      <Field label="Next step">
                        <input name="nextStep" defaultValue={c.nextStep} maxLength={500} />
                      </Field>
                      <Field label="Follow up on">
                        <input name="nextDate" type="date" defaultValue={c.nextDate} />
                      </Field>
                      <Field label="Amount paid (if any)">
                        <input name="value" type="number" min={0} step="any" defaultValue={c.value || ''} />
                      </Field>
                      <Field label="Notes: what did they say, in their words?">
                        <textarea name="notes" rows={3} defaultValue={c.notes} maxLength={5000} />
                      </Field>
                      <button className="btn primary full" disabled={busy}>
                        Save
                      </button>
                    </form>
                  )}
                  {message?.id === c.id && (
                    <div className="fc-message">
                      <p>{message.text}</p>
                      <div className="fc-row-actions">
                        <button
                          className="text-btn"
                          onClick={() =>
                            navigator.clipboard
                              ?.writeText(message.text)
                              .then(() => notify('Copied. Edit it so it sounds like you, then send.'))
                          }
                        >
                          <Copy size={12} /> Copy
                        </button>
                        <button className="text-btn" onClick={() => setMessage(null)}>
                          <X size={12} /> Close
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
              {!list.length && <p className="muted">Nobody here yet.</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}

function Experiments(p: Props & { busy: boolean }) {
  const { data, save, saving, thinking, aiReady, ai, notify, formatDate, busy } = p;
  const [idea, setIdea] = useState('');
  const [shaped, setShaped] = useState('');
  const [closing, setClosing] = useState('');
  async function add(e: FormEvent<HTMLFormElement>) {
    const f = values(e);
    if (data.experiments.length >= 200) return notify('You can keep up to 200 experiments.');
    const x: Experiment = {
      id: uid(),
      belief: f.belief.trim(),
      test: f.test,
      success: f.success,
      due: f.due,
      status: 'running',
      result: '',
      created: now(),
      updated: now(),
    };
    if (await save({ ...data, experiments: [x, ...data.experiments] })) {
      (e.target as HTMLFormElement).reset();
      setShaped('');
      notify('Experiment started. Decide in advance what counts as success.');
    }
  }
  async function close(e: FormEvent<HTMLFormElement>, x: Experiment) {
    const f = values(e);
    if (
      await save({
        ...data,
        experiments: data.experiments.map((y) =>
          y.id === x.id ? { ...y, status: f.status as Experiment['status'], result: f.result, updated: now() } : y,
        ),
      })
    ) {
      setClosing('');
      notify('Result recorded. That is real learning.');
    }
  }
  return (
    <div className="fc-grid">
      <section className="card">
        <h3>Start an experiment</h3>
        <p className="muted">Write down what you believe, the smallest test, and what result would prove you wrong.</p>
        <Field label="Rough idea (optional, Nova can shape it)">
          <textarea
            rows={2}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            maxLength={3000}
            placeholder="I think salon owners will pay for monthly bookkeeping…"
          />
        </Field>
        <button
          className="btn"
          disabled={busy || !aiReady || !idea.trim()}
          onClick={async () => setShaped((await ai('experiment', idea.trim())) || '')}
        >
          {thinking ? 'Nova is thinking…' : 'Shape with Nova'} <FlaskConical size={15} />
        </button>
        {shaped && <p className="fc-coach">{shaped}</p>}
        <form onSubmit={add}>
          <Field label="I believe that…">
            <textarea name="belief" rows={2} required maxLength={2000} />
          </Field>
          <Field label="To test it, I will…">
            <textarea name="test" rows={2} required maxLength={2000} />
          </Field>
          <Field label="I will know it worked if…">
            <input name="success" required maxLength={2000} placeholder="3 of 10 people book a call" />
          </Field>
          <Field label="Decide by">
            <input name="due" type="date" required defaultValue={localDay(new Date(Date.now() + 7 * 86400000))} />
          </Field>
          <button className="btn primary full" disabled={busy}>
            Start experiment <FlaskConical size={15} />
          </button>
        </form>
      </section>
      <div>
        {data.experiments.map((x) => (
          <section className="card fc-offer" key={x.id}>
            <div className="card-heading">
              <span className={'badge ' + (x.status === 'validated' ? 'sage' : x.status === 'invalidated' ? 'peach' : 'neutral')}>
                {x.status.toUpperCase()}
              </span>
              <small className="muted">Decide by {formatDate(x.due)}</small>
            </div>
            <h3>{x.belief}</h3>
            <dl className="fc-dl">
              <dt>Test</dt>
              <dd>{x.test}</dd>
              <dt>Success</dt>
              <dd>{x.success}</dd>
              {x.result && (
                <>
                  <dt>Result</dt>
                  <dd>{x.result}</dd>
                </>
              )}
            </dl>
            {x.status === 'running' &&
              (closing === x.id ? (
                <form onSubmit={(e) => close(e, x)}>
                  <Field label="What happened?">
                    <textarea name="result" rows={2} required maxLength={5000} />
                  </Field>
                  <Field label="Verdict">
                    <select name="status" defaultValue="validated">
                      <option value="validated">Validated: it worked</option>
                      <option value="invalidated">Invalidated: it did not</option>
                      <option value="inconclusive">Inconclusive</option>
                    </select>
                  </Field>
                  <button className="btn primary full" disabled={busy}>
                    Record result
                  </button>
                </form>
              ) : (
                <button className="text-btn" onClick={() => setClosing(x.id)}>
                  Record the result <Check size={13} />
                </button>
              ))}
          </section>
        ))}
        {!data.experiments.length && <p className="muted">Your experiments will appear here.</p>}
      </div>
    </div>
  );
}
