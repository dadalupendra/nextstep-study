# NextStep Study — Facebook Feedback Center

## Connected public Facebook link

https://www.facebook.com/share/1HTRs8SwmG/?mibextid=wwXIfr

The site now includes Facebook Feedback shortcuts in the Home page, N1–N5 books, Exam Papers and Daily Challenge. The Feedback Center lets visitors compose ratings (1–5), suggestions, problems and questions, automatically carrying available JLPT level, question reference and originating page URL.

Visitors may **copy the feedback to Facebook** or choose to create a GitHub Issue. Opening a link does not post a comment or send any message automatically.

## Private feedback + owner alerts

A secure Supabase-backed implementation, rate limiting, Cloudflare Turnstile, a read-only administrator dashboard and optional Resend email notifications have been added as **configuration-ready source files**.

**Private submission is OFF** until the owner sets up Supabase, Turnstile, the function and keys. Do not claim a database row is saved or an alert is delivered before end-to-end verification.

For full instructions see [backend/feedback/SETUP.md](backend/feedback/SETUP.md).

## Meta Page notifications

A signed Meta Page Webhook Worker template is included in [backend/feedback/meta-page-webhook.worker.js](backend/feedback/meta-page-webhook.worker.js). It has **not been deployed, authorized, subscribed or verified with Meta**. The user-provided Facebook share link does not verify that the linked account is an admin-managed Page.

For a personal-profile post, use the Facebook app's notifications. For an eligible managed Page, configure approved Meta API access, Page webhooks and email delivery in a separate HTTPS backend. No ordinary Facebook post viewer's identity can be collected or messaged just because they opened the post.

Never publish access tokens, service-role keys, Turnstile secrets, Meta app secrets or admin passwords in GitHub Pages JavaScript.
