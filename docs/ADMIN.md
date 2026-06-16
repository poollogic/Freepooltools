# Admin outreach console (`/admin`)

A private, password-gated page for sending 1:1 outbound email (backlink
outreach, partnerships, etc.) from **jonathan@freepooltools.com**. Not linked
anywhere public, `noindex`, and kept out of the sitemap.

## How it works

- **`/admin`** (`src/pages/AdminPage.tsx`) — the UI. Compose, paste a recipient
  list (with optional names), `{{name}}`/`{{firstName}}`/`{{email}}` mail-merge,
  save reusable templates (stored in your browser), then send. A live log shows
  per-recipient success/failure. Sending is throttled to stay under rate limits.
- **`/api/send-email`** (`functions/api/send-email.ts`) — a Cloudflare Pages
  Function, the only thing that can actually send. It validates the admin
  password server-side and calls **Resend**. Secrets never reach the browser.

> Why Resend and not the Cloudflare domain email? Cloudflare Email Routing on
> `freepooltools.com` is **receive-only** (it forwards inbound mail to Gmail). To
> *send* from the address you need a sending provider with the domain verified.
> Why not SendGrid/Postmark? Their terms ban cold/outreach email. Resend is the
> cleanest fit for Cloudflare + low-volume personalized outreach. Keep volume
> modest and messages personalized to protect domain reputation and stay within
> acceptable-use rules.

## One-time setup

### 1. Resend account + verify the domain

1. Create an account at [resend.com](https://resend.com).
2. **Add Domain** → `freepooltools.com`. Resend shows a few DNS records
   (DKIM `CNAME`s, an SPF `TXT`, and a DMARC `TXT`).
3. Add those records in the **Cloudflare dashboard → freepooltools.com → DNS**.
   (Set the DKIM `CNAME`s to **DNS only / grey cloud**, not proxied.) Wait for
   Resend to show the domain as **Verified**. Until then you can only send to
   your own address from `onboarding@resend.dev`.
4. Create an **API key** (Sending access). Copy it — you'll paste it below.

### 2. Cloudflare Pages environment variables

Dashboard → your Pages project → **Settings → Environment variables →
Production** (add the same to Preview if you use preview deploys). Mark each as
**Encrypt**:

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | the `re_…` key from Resend |
| `ADMIN_PASSWORD` | a long random password you'll type to log in |
| `SENDER_EMAIL` | `jonathan@freepooltools.com` (optional; this is the default) |
| `SENDER_NAME` | optional default "From" name |

Redeploy after adding them (env vars apply to new deployments).

### 3. (Strongly recommended) Put Cloudflare Access in front of `/admin`

The app password protects *sending*, but Access protects the whole page with
real SSO and is free for small teams:

1. Cloudflare dashboard → **Zero Trust → Access → Applications → Add a
   self-hosted application**.
2. Domain `freepooltools.com`, path `admin` (and add a second app for
   `api/send-email` for defense in depth).
3. Add a policy: **Allow** → emails ending in your address only (or a one-time
   PIN to suncoastpoolpros@gmail.com / jonathan@freepooltools.com).

Now `/admin` requires a Cloudflare login *and* the app password.

## Local testing

The static dev server (`npm run dev`) has no `/api`, so login will fail there.
To test the Function locally:

```bash
cp .dev.vars.example .dev.vars   # fill in real values (gitignored)
npm run build                    # produces dist/
npx wrangler pages dev dist      # serves dist/ + functions/ with .dev.vars
```

## Deliverability tips

- Keep batches small and messages personalized (the merge fields help).
- Warm up: send a low volume the first week, then ramp.
- Always set a real, monitored reply-to (defaults to the sender).
- Resend's dashboard shows opens/bounces/complaints — watch the bounce rate.
