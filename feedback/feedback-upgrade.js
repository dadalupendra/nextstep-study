/* Context-aware private feedback submission. UI works in copy-only mode until configured. */
(function () {
  "use strict";
  const config = window.NextStepCommunityConfig || {};
  const $ = id => document.getElementById(id);
  const form = $("feedback-form");
  if (!form) return;
  const query = new URLSearchParams(location.search);
  const base = new URL("../", location.href);
  const selectedLevel = (query.get("level") || "").toUpperCase();
  if (/^N[1-5]$/.test(selectedLevel)) $("feedback-level").value = selectedLevel;
  $("feedback-page").value = location.href;
  const source = query.get("from");
  if (source) {
    try {
      const u = new URL(source);
      if (u.origin === location.origin && u.pathname.startsWith(base.pathname) && /^https?:$/.test(u.protocol)) {
        $("feedback-page").value = u.href.slice(0, 900);
        if (!/^N[1-5]$/.test(selectedLevel)) {
          const m = u.pathname.match(/\/(N[1-5])(?:\/|$)/i);
          if (m) $("feedback-level").value = m[1].toUpperCase();
        }
      }
    } catch (_) {}
  }
  const question = (query.get("questionId") || "").slice(0, 180);
  const label = document.createElement("label");
  label.htmlFor = "feedback-question-id";
  label.textContent = "Question ID (automatically captured where available)";
  const field = document.createElement("input");
  field.type = "text";
  field.id = "feedback-question-id";
  field.name = "questionId";
  field.maxLength = 180;
  field.value = question;
  field.readOnly = Boolean(question);
  field.placeholder = "Optional — enter a question reference";
  label.appendChild(field);
  const privacy = form.querySelector(".privacy");
  privacy.before(label);
  const actions = form.querySelector(".compose-actions");
  const send = document.createElement("button");
  send.id = "send-private-feedback";
  send.type = "button";
  send.className = "primary";
  send.textContent = "🔒 Send to NextStep (private)";
  actions.prepend(send);
  const tokenSlot = document.createElement("div");
  tokenSlot.id = "nextstep-captcha";
  tokenSlot.setAttribute("aria-label", "Anti-spam verification");
  actions.before(tokenSlot);
  const status = $("form-status");
  let challenge = "", widgetId = null;
  const validApi = (() => {
    try {
      const u = new URL(config.feedbackApiUrl);
      return u.protocol === "https:" && u.pathname.endsWith("/functions/v1/submit-feedback");
    } catch (_) { return false; }
  })();
  const configured = validApi && Boolean(config.turnstileSiteKey);
  if (!configured) {
    send.disabled = true;
    send.title = "Private submissions are not activated yet. Please use Copy Feedback or GitHub Issues.";
    const p = document.createElement("p");
    p.className = "muted small";
    p.textContent = "Private website submission is not active yet. You can still copy feedback to Facebook or open a GitHub Issue.";
    actions.after(p);
    return;
  }
  window.nextstepTurnstileLoaded = function () {
    if (!window.turnstile) return;
    widgetId = window.turnstile.render("#nextstep-captcha", {
      sitekey: config.turnstileSiteKey,
      callback: function (v) { challenge = v; },
      "expired-callback": function () { challenge = ""; },
      "error-callback": function () { challenge = ""; }
    });
  };
  const challengeScript = document.createElement("script");
  challengeScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=nextstepTurnstileLoaded";
  challengeScript.async = true;
  challengeScript.defer = true;
  document.head.append(challengeScript);
  send.addEventListener("click", async function () {
    if (!form.reportValidity()) return;
    if (!challenge) { status.textContent = "Please complete the anti-spam check before sending."; return; }
    const checked = form.querySelector('input[name="rating"]:checked');
    const payload = {
      type: $("feedback-type").value,
      level: $("feedback-level").value,
      rating: checked ? Number(checked.value) : null,
      name: $("feedback-name").value.trim(),
      message: $("feedback-message").value.trim(),
      page_url: $("feedback-page").value.trim() || location.href,
      question_id: field.value.trim(),
      turnstile_token: challenge
    };
    if (payload.message.length < 12 || payload.message.length > 1800) {
      status.textContent = "Write feedback between 12 and 1800 characters.";
      return;
    }
    send.disabled = true;
    status.textContent = "Submitting securely…";
    try {
      const reply = await fetch(config.feedbackApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
        credentials: "omit"
      });
      const result = await reply.json().catch(() => ({}));
      if (!reply.ok || !result.ok) throw new Error(result.error || "Feedback could not be submitted.");
      status.textContent = "✅ Feedback stored successfully. Reference: " + String(result.id || "").slice(0, 36);
      $("feedback-message").value = "";
    } catch (e) {
      status.textContent = "⚠ " + String(e.message || "Network error") + " Your feedback was not confirmed as saved.";
    } finally {
      send.disabled = false;
      challenge = "";
      if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
    }
  });
})();
