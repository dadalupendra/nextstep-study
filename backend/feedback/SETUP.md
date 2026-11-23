# NextStep Study — Private Feedback Backend Setup

The NextStep Study site is static GitHub Pages. This repository contains a secure backend template but **does not host or configure a live database**. Facebook feedback links and Copy/GitHub flows work without a backend; private submissions and owner email notifications only work after you complete setup.

## 1. Create a Supabase project

Use your own Supabase project, and run `backend/feedback/schema.sql` in the SQL editor. It creates a private feedback table, an administrator allowlist, row-level security (RLS) policies, and a transactional hourly rate limit. Only the Edge Function service role can insert via the stored procedure. Public users cannot read submissions.

Create an administrator in Supabase Auth. In the SQL Editor, allowlist that user's *actual UUID*:

```sql
insert into public.nextstep_feedback_admins (user_id)
values ('REPLACE_WITH_REAL_AUTH_USERS_UUID');
```

The UUID is not a password. Do not add any unknown user's ID.

## 2. Configure Cloudflare Turnstile

Create a Turnstile widget restricted to the hostname `dadalupendra.github.io`. Its **site key** is public. Its **secret key** must only go to the server. The Edge Function validates every token through Cloudflare Siteverify, and checks the hostname. The form remains non-submitting until its public site key and API URL are set.

## 3. Deploy the Supabase Edge Function

Place the supplied file in the Supabase project under:

`supabase/functions/submit-feedback/index.ts`

Deploy the function as **submit-feedback**. Anonymous users cannot supply an Auth JWT, so turn OFF JWT verification on **this endpoint only**, not for other functions:

```sh
supabase functions deploy submit-feedback --no-verify-jwt
```

Set these **server-only** secrets in Supabase (via the project dashboard or Supabase CLI):

- SUPABASE_URL: your project base URL.
- SUPABASE_SERVICE_ROLE_KEY: your server-side service-role JWT key. **Never publish it.**
- TURNSTILE_SECRET_KEY: private Turnstile key.
- FEEDBACK_IP_HASH_SECRET: random string of 32+ characters, used to hash IP + hour for rate limits.
- NEXTSTEP_SITE_ORIGIN: https://dadalupendra.github.io
- RESEND_API_KEY: optional, for email notifications.
- FEEDBACK_ADMIN_EMAIL: optional destination mailbox for alerts.
- FEEDBACK_FROM_EMAIL: optional sender address/domain verified with Resend.

The webhook email only runs when all three email values are set. Even after successfully saving a feedback submission, email delivery needs to be checked independently.

## 4. Complete the *public* settings

Edit the existing root `community-config.js`, leaving Facebook URL unchanged. Fill only public values:

```js
feedbackApiUrl: "https://YOURPROJECT.supabase.co/functions/v1/submit-feedback",
turnstileSiteKey: "PUBLIC_SITE_KEY",
supabaseUrl: "https://YOURPROJECT.supabase.co",
supabaseAnonKey: "PUBLIC_PUBLISHABLE_OR_ANON_KEY"
```

This key is never the service-role key. GitHub Pages exposes all JS to visitors.

## 5. Test and operate

Open the production Feedback Center on a phone, submit a real test feedback, confirm the returned reference UUID and database row. Attempt a direct anonymous table read; it must be denied. Attempt dashboard access with an unauthorized account; it must not reveal any feedback. Login as the allowlisted owner at `/nextstep-study/feedback/admin/` and confirm the actual row displays. Test the 5/hour limit and verify any configured owner email.

There are no fake feedback/review entries. Never publish private feedback as a public review without consent.

## 6. Meta Facebook notifications (not connected)

The provided share link is connected to visible Facebook buttons. Actual Facebook Page comment/message webhook automation requires an eligible Meta Developer App, Page permissions, access tokens kept server-side, a verified webhook and possibly Meta approval. There is no live Facebook Page Webhook in this repository. Use Facebook's own comment/message notifications until that is separately configured.

Official references:

- Supabase: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Turnstile server-side check: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Meta Page Webhooks: https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages/

## Optional Meta Page comment/message webhook relay (not active)

The file `backend/feedback/meta-page-webhook.worker.js` is an optional **Cloudflare Worker** callback. It is not deployed or registered with Meta.

To activate it later, you must own/manage a Facebook **Page** (a personal-profile share link is not sufficient) and have a Meta Developer App with the applicable Page permissions and Page subscription approval. Deploy the Worker to a private Cloudflare account on a public HTTPS Worker URL. Store the following as **Worker secrets** (not repository content): `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`, `META_PAGE_ID`, `RESEND_API_KEY`, `FEEDBACK_ADMIN_EMAIL`, and `FEEDBACK_FROM_EMAIL`. Configure the Worker URL and verification token as the Page webhook callback in your Meta app, and subscribe only to approved `feed` and `messages` events as permitted.

The handler verifies the GET subscription challenge and validates each POST using `X-Hub-Signature-256` and the Meta app secret before sending a count-only email alert. It does not retrieve message bodies, track post viewers, or automatically message visitors. Meta can redeliver webhook events; a production deployment should add deduplication if duplicate notification emails matter. Verify actual Meta events and delivery before calling this active.

References: https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages/ and https://developers.facebook.com/docs/graph-api/webhooks/reference/page/.
