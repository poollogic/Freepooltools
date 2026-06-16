// Cloudflare Pages Function — the ONLY thing that can actually send mail.
// It deploys automatically with the Pages project (anything under functions/ at
// the repo root becomes a serverless route) and runs server-side, so the Resend
// API key and admin password live here as encrypted env vars and never ship in
// the client bundle. Route: POST /api/send-email
//
// Required Pages environment variables (dashboard → Settings → Environment
// variables, mark them "Encrypt"):
//   RESEND_API_KEY  — from resend.com after verifying freepooltools.com
//   ADMIN_PASSWORD  — the password the /admin page must present to send
//   SENDER_EMAIL    — optional; defaults to jonathan@freepooltools.com
//   SENDER_NAME     — optional default "From" display name
//
// Local dev (`npx wrangler pages dev dist`): put the same vars in a gitignored
// .dev.vars file at the repo root (see .dev.vars.example).

interface Env {
  RESEND_API_KEY: string;
  ADMIN_PASSWORD: string;
  SENDER_EMAIL?: string;
  SENDER_NAME?: string;
}

interface SendBody {
  /** "verify" just checks the password (used by the /admin login); omit to send. */
  action?: 'verify' | 'send';
  to?: string;
  subject?: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Constant-time-ish string compare so a wrong password can't be guessed by
// timing the response. Lengths leak, but that's not meaningfully exploitable here.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Minimal, safe plain-text → HTML: escape, blank lines become paragraphs, single
// newlines become <br>, and bare URLs are linked. We send this as the HTML part
// alongside the original text/plain part for good rendering + deliverability.
function textToHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const linked = esc.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}">${u}</a>`);
  const paras = linked
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">${paras}</div>`;
}

export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;

  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  if (!env.RESEND_API_KEY || !env.ADMIN_PASSWORD) {
    return json({ error: 'Server not configured (RESEND_API_KEY / ADMIN_PASSWORD missing).' }, 500);
  }

  // Auth — the /admin page sends the password in this header on every request.
  const supplied = request.headers.get('x-admin-password') ?? '';
  if (!safeEqual(supplied, env.ADMIN_PASSWORD)) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  // Login check — password already validated above, so just acknowledge.
  if (body.action === 'verify') return json({ ok: true });

  const to = (body.to ?? '').trim();
  const subject = (body.subject ?? '').trim();
  const text = (body.text ?? '').trim();

  if (!EMAIL_RE.test(to)) return json({ error: `Invalid recipient address: "${to}"` }, 400);
  if (!subject) return json({ error: 'Subject is required.' }, 400);
  if (!text) return json({ error: 'Body is required.' }, 400);

  const senderEmail = (env.SENDER_EMAIL || 'jonathan@freepooltools.com').trim();
  const fromName = (body.fromName || env.SENDER_NAME || 'Jonathan').trim();
  const from = `${fromName} <${senderEmail}>`;
  const replyTo = (body.replyTo || senderEmail).trim();

  let resp: Response;
  try {
    resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from, to, reply_to: replyTo, subject, text, html: textToHtml(text) }),
    });
  } catch (err) {
    return json({ error: `Network error reaching Resend: ${(err as Error).message}` }, 502);
  }

  const result = (await resp.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };
  if (!resp.ok) {
    return json({ error: result.message || result.error || `Resend error ${resp.status}` }, 502);
  }

  return json({ id: result.id ?? null, to });
};
