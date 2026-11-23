/* Non-destructive Feedback / Facebook actions shared by every published study page. */
(function () {
  "use strict";
  if (!document.body || /\/feedback\/(?:admin\/)?$/.test(location.pathname)) return;
  const script = document.currentScript;
  const root = script ? new URL("../", script.src) : new URL("../", location.href);
  const facebook = "https://www.facebook.com/share/1HTRs8SwmG/?mibextid=wwXIfr";
  const dock = document.createElement("nav");
  dock.id = "ns-feedback-dock";
  dock.setAttribute("aria-label", "NextStep Study Feedback");
  const css = document.createElement("style");
  css.textContent = '#ns-feedback-dock{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:calc(100vw - 28px);font:700 14px/1.2 system-ui,sans-serif}#ns-feedback-dock a{box-sizing:border-box;min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:12px 14px;border-radius:14px;background:#096d65;border:2px solid #87fce7;color:#fff!important;text-decoration:none!important;box-shadow:0 6px 21px #001423b0}#ns-feedback-dock a.ns-facebook{background:#175ca6;border-color:#8dc4ff}#ns-feedback-dock a:focus-visible{outline:3px solid #fff;outline-offset:3px}@media print{#ns-feedback-dock{display:none!important}}';
  document.head.appendChild(css);
  const feedback = document.createElement("a");
  feedback.textContent = "💬 Feedback";
  const fb = document.createElement("a");
  fb.className = "ns-facebook";
  fb.textContent = "f Facebook";
  fb.href = facebook;
  fb.target = "_blank";
  fb.rel = "noopener noreferrer";
  function feedbackURL() {
    const url = new URL("feedback/", root);
    const params = new URLSearchParams(location.search);
    const pathLevel = location.pathname.match(/\/(N[1-5])(?:\/|$)/i);
    const exam = window.NextStepExamStudio?.getState?.();
    const select = document.querySelector("#studio-level");
    const level = (exam?.level || select?.value || params.get("level") || pathLevel?.[1] || "").toUpperCase();
    if (/^N[1-5]$/.test(level)) url.searchParams.set("level", level);
    url.searchParams.set("from", location.href.slice(0, 1000));
    const daily = document.querySelector("#nextstep-daily-100");
    let question = daily?.dataset.feedbackQuestionId || "";
    if (!question && exam?.question) question = exam.level + "-P" + String(exam.paper).padStart(2, "0") + "-Q" + String(exam.question).padStart(3, "0");
    if (!question) {
      const current = document.querySelector("#studio-current");
      if (current && !document.querySelector("#studio-test:not([hidden])")) question = "";
    }
    if (question) url.searchParams.set("questionId", question.slice(0, 180));
    return url.href;
  }
  feedback.href = feedbackURL();
  feedback.addEventListener("pointerdown", function () { feedback.href = feedbackURL(); });
  feedback.addEventListener("focus", function () { feedback.href = feedbackURL(); });
  feedback.addEventListener("click", function () { feedback.href = feedbackURL(); });
  dock.append(feedback, fb);
  document.body.append(dock);
})();
