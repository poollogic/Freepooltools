import { useEffect, useRef, useState } from 'react';
import { Lock, Send, Save, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { usePageMeta } from '@/lib/usePageMeta';

/**
 * Private outreach console (backlink campaigns etc.). Lives at /admin, marked
 * noindex and kept out of the sitemap, and is useless without the admin
 * password — which is validated server-side by the /api/send-email Pages
 * Function (see functions/api/send-email.ts). Mail is sent from
 * jonathan@freepooltools.com via Resend.
 *
 * This page is intentionally NOT linked anywhere in the public site. For real
 * auth, also put Cloudflare Access in front of /admin (see docs/ADMIN.md).
 */

const PW_KEY = 'fpt-admin-pw'; // session-only (cleared when the tab closes)
const TPL_KEY = 'fpt-admin-templates';
const SENDER = 'jonathan@freepooltools.com';
const SEND_DELAY_MS = 600; // throttle so we stay under Resend's rate limit

type Recipient = { email: string; name: string };
type Template = { name: string; subject: string; body: string };
type LogEntry = { email: string; status: 'pending' | 'sending' | 'sent' | 'error'; message?: string };

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-fg placeholder:text-muted/50 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse the recipients textarea: one per line, `email` or `email, Name`. */
function parseRecipients(raw: string): Recipient[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const comma = line.indexOf(',');
      if (comma === -1) return { email: line, name: '' };
      return { email: line.slice(0, comma).trim(), name: line.slice(comma + 1).trim() };
    });
}

/** {{name}} / {{email}} / {{firstName}} mail-merge. */
function applyMerge(template: string, r: Recipient): string {
  const firstName = r.name.split(/\s+/)[0] || '';
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, r.name || 'there')
    .replace(/\{\{\s*firstName\s*\}\}/gi, firstName || 'there')
    .replace(/\{\{\s*email\s*\}\}/gi, r.email);
}

async function callApi(pw: string, payload: Record<string, unknown>) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin-password': pw },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string | null; ok?: boolean };
  return { ok: res.ok, status: res.status, data };
}

export const AdminPage = () => {
  usePageMeta({
    title: 'Admin — Outreach',
    description: 'Private admin console.',
    noindex: true,
  });

  // ----- auth -----
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  // ----- compose -----
  const [fromName, setFromName] = useState('Jonathan');
  const [replyTo, setReplyTo] = useState('');
  const [recipientsRaw, setRecipientsRaw] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // ----- templates (local to this browser) -----
  const [templates, setTemplates] = useState<Template[]>([]);

  // ----- send -----
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const cancelRef = useRef(false);

  const recipients = parseRecipients(recipientsRaw);
  const invalid = recipients.filter((r) => !EMAIL_RE.test(r.email));

  // On mount: restore a session password (auto-verify) + load saved templates.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PW_KEY);
      if (saved) {
        setPw(saved);
        verify(saved);
      }
      const tpl = localStorage.getItem(TPL_KEY);
      if (tpl) setTemplates(JSON.parse(tpl));
    } catch {
      /* storage blocked — ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(candidate: string) {
    setAuthBusy(true);
    setAuthError('');
    try {
      const { ok, status } = await callApi(candidate, { action: 'verify' });
      if (ok) {
        setAuthed(true);
        try {
          sessionStorage.setItem(PW_KEY, candidate);
        } catch {
          /* ignore */
        }
      } else {
        setAuthed(false);
        setAuthError(status === 401 ? 'Wrong password.' : 'Could not reach the server.');
      }
    } catch {
      setAuthError('Network error — is the Function deployed? (Static dev server has no /api.)');
    } finally {
      setAuthBusy(false);
    }
  }

  function saveTemplate() {
    const name = window.prompt('Save this subject + body as a template named:');
    if (!name) return;
    const next = [...templates.filter((t) => t.name !== name), { name, subject, body }];
    setTemplates(next);
    try {
      localStorage.setItem(TPL_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function loadTemplate(name: string) {
    const t = templates.find((x) => x.name === name);
    if (!t) return;
    setSubject(t.subject);
    setBody(t.body);
  }

  function deleteTemplate(name: string) {
    const next = templates.filter((t) => t.name !== name);
    setTemplates(next);
    try {
      localStorage.setItem(TPL_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function runSend() {
    setConfirming(false);
    setSending(true);
    cancelRef.current = false;
    setLog(recipients.map((r) => ({ email: r.email, status: 'pending' })));

    for (let i = 0; i < recipients.length; i++) {
      if (cancelRef.current) break;
      const r = recipients[i];
      setLog((prev) => prev.map((e, idx) => (idx === i ? { ...e, status: 'sending' } : e)));
      try {
        const { ok, data } = await callApi(pw, {
          to: r.email,
          subject: applyMerge(subject, r),
          text: applyMerge(body, r),
          fromName,
          replyTo: replyTo.trim() || undefined,
        });
        setLog((prev) =>
          prev.map((e, idx) =>
            idx === i ? { ...e, status: ok ? 'sent' : 'error', message: ok ? undefined : data.error } : e,
          ),
        );
      } catch (err) {
        setLog((prev) =>
          prev.map((e, idx) => (idx === i ? { ...e, status: 'error', message: (err as Error).message } : e)),
        );
      }
      if (i < recipients.length - 1) await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
    }
    setSending(false);
  }

  const sentCount = log.filter((e) => e.status === 'sent').length;
  const errorCount = log.filter((e) => e.status === 'error').length;
  const canSend =
    recipients.length > 0 && invalid.length === 0 && subject.trim() !== '' && body.trim() !== '' && !sending;

  // ---------- LOGIN ----------
  if (!authed) {
    return (
      <PageShell>
        <section className="max-w-md mx-auto px-4 pt-40 pb-32">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-brand-orange" />
            <h1 className="font-display font-bold text-fg text-2xl">Admin sign-in</h1>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verify(pw);
            }}
            className="space-y-4"
          >
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Admin password"
              className={inputCls}
            />
            {authError && <p className="text-sm text-red-400">{authError}</p>}
            <button type="submit" disabled={authBusy || !pw} className="btn btn-orange w-full disabled:opacity-50">
              {authBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {authBusy ? 'Checking…' : 'Unlock'}
            </button>
          </form>
          <p className="text-xs text-muted/70 mt-6 leading-relaxed">
            This console sends from <strong>{SENDER}</strong>. The password is checked server-side; nothing sends
            without it.
          </p>
        </section>
      </PageShell>
    );
  }

  // ---------- CONSOLE ----------
  return (
    <PageShell>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display font-bold text-fg text-3xl">Outreach</h1>
          <button
            onClick={() => {
              setAuthed(false);
              try {
                sessionStorage.removeItem(PW_KEY);
              } catch {
                /* ignore */
              }
            }}
            className="text-sm text-muted hover:text-fg transition"
          >
            Sign out
          </button>
        </div>
        <p className="text-sm text-muted mb-8">
          Sends from <strong className="text-fg">{SENDER}</strong>. Use{' '}
          <code className="text-brand-orange">{'{{name}}'}</code>,{' '}
          <code className="text-brand-orange">{'{{firstName}}'}</code> and{' '}
          <code className="text-brand-orange">{'{{email}}'}</code> for mail-merge.
        </p>

        <div className="space-y-5">
          {/* From / reply-to */}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-semibold text-fg mb-1.5">From name</span>
              <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-fg mb-1.5">
                Reply-to <span className="font-normal text-muted/70">(optional)</span>
              </span>
              <input
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder={SENDER}
                className={inputCls}
              />
            </label>
          </div>

          {/* Recipients */}
          <label className="block">
            <span className="block text-sm font-semibold text-fg mb-1.5">
              Recipients{' '}
              <span className="font-normal text-muted/70">
                — one per line: <code>email</code> or <code>email, Name</code>
              </span>
            </span>
            <textarea
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              rows={5}
              placeholder={'editor@poolblog.com, Jane Doe\nwebmaster@poolsite.com'}
              className={`${inputCls} font-mono text-sm`}
            />
            <span className="block text-xs text-muted/70 mt-1">
              {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
              {invalid.length > 0 && (
                <span className="text-red-400"> · {invalid.length} invalid address(es)</span>
              )}
            </span>
          </label>

          {/* Templates */}
          {templates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Templates:</span>
              {templates.map((t) => (
                <span key={t.name} className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 pl-3 pr-1 py-1 text-sm">
                  <button onClick={() => loadTemplate(t.name)} className="text-fg hover:text-brand-orange transition">
                    {t.name}
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.name)}
                    aria-label={`Delete template ${t.name}`}
                    className="text-muted/60 hover:text-red-400 transition p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Subject */}
          <label className="block">
            <span className="block text-sm font-semibold text-fg mb-1.5">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          </label>

          {/* Body */}
          <label className="block">
            <span className="block text-sm font-semibold text-fg mb-1.5">Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder={'Hi {{firstName}},\n\nI run freepooltools.com — a set of free pool calculators…'}
              className={inputCls}
            />
          </label>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                disabled={!canSend}
                className="btn btn-orange disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                Send to {recipients.length || 0}
              </button>
            ) : (
              <>
                <button onClick={runSend} className="btn btn-orange">
                  <Send className="w-4 h-4" />
                  Confirm — send {recipients.length} now
                </button>
                <button onClick={() => setConfirming(false)} className="text-sm text-muted hover:text-fg transition">
                  Cancel
                </button>
              </>
            )}

            {sending && (
              <button
                onClick={() => (cancelRef.current = true)}
                className="text-sm text-red-400 hover:text-red-300 transition"
              >
                Stop
              </button>
            )}

            <button
              onClick={saveTemplate}
              disabled={!subject && !body}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg transition disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              Save template
            </button>
          </div>

          {/* Send log */}
          {log.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-muted mb-2">
                {sending ? 'Sending…' : 'Done.'} {sentCount} sent
                {errorCount > 0 && <span className="text-red-400"> · {errorCount} failed</span>}
              </div>
              <ul className="space-y-1 max-h-72 overflow-auto text-sm">
                {log.map((e, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {e.status === 'sent' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {e.status === 'error' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    {e.status === 'sending' && <Loader2 className="w-4 h-4 text-brand-orange animate-spin shrink-0" />}
                    {e.status === 'pending' && <span className="w-4 h-4 shrink-0" />}
                    <span className="text-fg truncate">{e.email}</span>
                    {e.message && <span className="text-red-400 truncate">— {e.message}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
};
