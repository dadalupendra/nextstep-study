/* Translate only book glosses. Japanese text, ruby, quizzes and learner input
   are outside the watched fields. Use bundled translations before the service. */
(() => {
  'use strict';
  const languages = window.NextStepLanguages;
  const translator = window.NextStepTranslate;
  function watch(root, selector = '[data-book-meaning]', options = {}) {
    if (!root) return;
    const language = options.language || (() => languages.get());
    const source = new WeakMap();
    const visible = new Set();
    const queue = new Set();
    let version = 0, running = false, unavailableUntil = 0;

    function paint(field, value, code, note = '') {
      if (field.textContent !== value || field.lastElementChild) field.textContent = value;
      field.lang = code;
      field.dir = 'auto';
      if (note) {
        const hint = document.createElement('small');
        hint.lang = 'en';
        hint.textContent = ' · ' + note;
        field.append(hint);
      }
    }

    async function drain() {
      if (running) return;
      running = true;
      const ticket = version;
      try {
        for (const field of queue) {
          queue.delete(field);
          if (!field.isConnected || !visible.has(field)) continue;
          const en = source.get(field), target = language();
          try {
            if (!navigator.onLine || Date.now() < unavailableUntil) throw Error('Unavailable');
            const value = await translator.requestTranslation(en, 'en', target);
            if (ticket !== version) return;
            if (field.isConnected && target === language()) paint(field, value, target);
          } catch {
            if (ticket !== version) return;
            unavailableUntil = Date.now() + 30000;
            if (field.isConnected && target === language()) paint(field, en, 'en', 'English · translation unavailable');
          }
        }
      } finally { if (ticket === version) running = false; }
    }

    function render(field) {
      if (!source.has(field)) {
        const en = field.dataset.sourceEn || field.textContent.trim();
        if (!en) return;
        source.set(field, en);
        field.dataset.sourceEn = en;
      }
      const en = source.get(field), target = language();
      const local = target === 'en' ? en : field.getAttribute('data-'+target) || options.local?.(field, target);
      const text = local || translator.cached(en, 'en', target);
      if (text) { paint(field, text, target); return; }
      paint(field, en, 'en');
      if (visible.has(field)) { queue.add(field); drain(); }
    }

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target.isConnected) {
          visible.add(entry.target);
          render(entry.target);
        } else {
          visible.delete(entry.target);
          queue.delete(entry.target);
        }
      }
    }, {rootMargin:'120px'}) : null;
    function add(field) {
      if (source.has(field)) return;
      if (observer) observer.observe(field); else visible.add(field);
      render(field);
    }
    function remove(field) {
      observer?.unobserve(field);
      visible.delete(field);
      queue.delete(field);
      source.delete(field);
    }
    function visit(node, fn) {
      if (node.nodeType !== 1) return;
      if (node.matches(selector)) fn(node);
      node.querySelectorAll(selector).forEach(fn);
    }
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') { add(record.target); continue; }
        for (const node of record.removedNodes) visit(node, remove);
        for (const node of record.addedNodes) visit(node, add);
      }
    }).observe(root, {childList:true, subtree:true, ...(options.attribute ? {attributeFilter:[options.attribute]} : {})});
    function refresh() {
      version++;
      queue.clear();
      running = false;
      unavailableUntil = 0;
      root.querySelectorAll(selector).forEach(render);
    }
    window.addEventListener(languages.event, refresh);
    window.addEventListener('online', refresh);
    root.querySelectorAll(selector).forEach(add);
    return refresh;
  }
  function mark(element, translations = {}) {
    element.dataset.bookMeaning = '';
    for (const [code, value] of Object.entries(translations)) {
      if (value) element.setAttribute('data-'+code, value);
    }
    return element;
  }
  window.NextStepMeanings = {watch, mark};
  watch(document, '[data-book-meaning]', {
    language: () => document.querySelector('[data-meaning-language]')?.value || languages.get()
  });
})();
