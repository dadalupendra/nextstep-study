# NextStep Study — Facebook Feedback Connection

This site is currently hosted on GitHub Pages. It cannot, by itself, read
who views a Facebook post, receive Page webhooks, or deliver private Messenger
messages to the owner.

## What works now

- Public Feedback Center: `/nextstep-study/feedback/`.
- Visitors may write a bug report, suggestion, question, content correction or
  rating; they can copy the feedback themselves.
- Visitors with GitHub accounts can open a **pre-filled GitHub Issue**. They
  must log in, review the public issue and click **Submit new issue**. The
  website does **not** silently send feedback and does not store submissions.
- Once connected to the real public Facebook post, visitors can click
  **Open Facebook Post**, paste their feedback as a **comment**, and post it.
- Once connected to a real Facebook Page, a Messenger button opens a chat.
  Sending the message is initiated by the visitor, not by the website.

## Complete the Facebook links (owner only)

Edit root `community-config.js` and fill the PUBLIC URLs you own:

```js
window.NextStepCommunityConfig=Object.freeze({
 facebookPostUrl:"", // Link to your actual NextStep Study Facebook post
 facebookPageUrl:"", // Optional: public Facebook Page URL
 messengerUrl:"",    // Optional: your Page's https://m.me/... link
 githubIssuesBase:"https://github.com/dadalupendra/nextstep-study/issues/new"
});
```

Only public URLs belong in this file. **Never put Page access tokens,
app secrets, Messenger tokens, email passwords or webhook verify tokens
in GitHub Pages JavaScript.**

When an actual link is supplied, connect it and retest the links; do not
guess a Facebook identity or substitute a generic link for the user's post.

## Owner notifications on Facebook

**If the post is on a personal profile:** Use the Facebook app's native
notifications for comments and reactions. Facebook does not give a list of
ordinary post viewers, nor does its APIs support messaging the owner each
time an identifiable person merely views a post.

**If the post is published by a Facebook Page:** Turn on appropriate Page/
Meta Business Suite notification settings for comments and messages. For a
custom automatic alert, Meta Page Webhooks can deliver updates for `feed`
changes and `messages` to a secure HTTPS backend. A Meta Developer App,
Page administration permissions, possible app review, a verified public
webhook endpoint and a secure delivery channel are required. GitHub Pages
cannot serve this webhook endpoint on its own.

Official references:
- https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages/
- https://developers.facebook.com/docs/graph-api/webhooks/reference/page/

**Important:** Notification settings are controlled by Facebook/Meta and
the Page owner, not by NextStep Study or this repository.

## Privacy and safety

Do not ask people for Facebook passwords or copy access tokens into
website code. Feedback submitted as a Facebook comment or GitHub Issue
may be visible publicly. A profile visit/view is not consent to contact
someone or collect their identifying details.
