/* The original notebooks render a page at a time. N3 renders inside a shadow
   root, and N4/N5 already have a bilingual view alongside their language menu. */
function initializeNotebookLanguage() {
  'use strict';
  const languages = window.NextStepLanguages;
  const meanings = window.NextStepMeanings;
  const viewer = document.getElementById('viewer');
  if (viewer) {
    const select = document.getElementById('nsNotebookLanguage');
    languages.fill(select);
    select.onchange = () => languages.set(select.value);
    window.addEventListener(languages.event, e => { select.value = e.detail; });
    meanings.watch(viewer, '.meaning-en');
    return;
  }

  const shadow = document.querySelector('.nextstep-n3-root')?.shadowRoot;
  const root = shadow || document;
  const page = root.getElementById(shadow ? 'paper' : 'main');
  if (!page) return;
  let select = root.getElementById('language');
  const initial = languages.get(select?.value || 'both');
  if (shadow) {
    const label = document.createElement('label');
    label.textContent = '🌐 Meaning language ';
    select = document.createElement('select');
    label.append(select);
    root.querySelector('.toolbar').prepend(label);
  }
  select.setAttribute('aria-label','Meaning language');
  const originalChoice = [...select.options].some(o => o.value === 'ja');
  languages.fill(select);
  select.prepend(new Option('नेपाली + English', 'both'));
  if (originalChoice) select.add(new Option('日本語本文のみ / Japanese text only', 'original'));
  select.value = initial;
  const panel = shadow ? root.getElementById('app') : document.body;

  function apply(mode) {
    panel.dataset.bookLanguage = mode;
    // Use the original checkbox/visibility settings in the bilingual view.
    if (!shadow) {
      panel.classList.toggle('hide-en', mode === 'original' || mode === 'ne');
      panel.classList.toggle('hide-ne', mode !== 'both' && mode !== 'ne');
    }
  }
  const styles = document.createElement('style');
  styles.textContent = `
    [data-book-language="original"] .en,[data-book-language="original"] .ne {display:none!important}
    [data-book-language]:not([data-book-language="both"]):not([data-book-language="ne"]) #main .ne {display:none!important}
    [data-book-language="ne"] .en.ns-unpaired-gloss {display:revert!important}
  `;
  if (shadow) {
    styles.textContent += `
      [data-book-language]:not([data-book-language="both"]):not([data-book-language="ne"]) #paper .ne {display:none!important}
      [data-book-language="ne"] #paper .ns-paired-gloss {display:none!important}
    `;
  }
  (shadow || document.head).append(styles);

  function paired(element) {
    const next = element.nextElementSibling, previous = element.previousElementSibling;
    if (next?.matches('.ne')) return next;
    if (previous?.matches('.ne')) return previous;
    return null;
  }
  // Keep table headers accurate in the chosen language and retain the lesson's
  // authored Japanese, including its ruby markup. Only plain glosses are changed.
  function prepare() {
    for (const field of page.querySelectorAll('p.en,td.en,span.en,li.en')) {
      if (field.childElementCount || field.hasAttribute('data-notebook-gloss')) continue;
      const other = paired(field);
      field.classList.add(other ? 'ns-paired-gloss' : 'ns-unpaired-gloss');
      if (other) field.dataset.ne = other.textContent.trim();
      field.dataset.notebookGloss = '';
    }
    for (const heading of page.querySelectorAll('.entry-head h2')) {
      if (heading.childElementCount) continue;
      const match = heading.textContent.match(/^(\d+\s*·\s*)(.+)$/);
      if (!match) continue;
      const span = document.createElement('span');
      span.textContent = match[2];
      const ne = paired(heading);
      if (ne) span.dataset.ne = ne.textContent.trim();
      span.dataset.notebookGloss = '';
      heading.replaceChildren(match[1],span);
    }
    for (const th of page.querySelectorAll('th.en')) {
      const label = languages.names[select.value] || 'English';
      if (th.textContent !== label) th.textContent = label;
    }
  }
  function contentLanguage() { return languages.normalize(select.value) || 'en'; }
  prepare();
  const refresh = meanings.watch(page,'[data-notebook-gloss]',{language:contentLanguage, attribute:'data-notebook-gloss'});
  new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(n => n.nodeType === 1 && n.tagName !== 'SMALL'))) {
      prepare();
    }
  }).observe(page,{subtree:true,childList:true});
  function syncMode(mode) {
    select.value = mode;
    if (!shadow) select.onchange?.({target:select});
    apply(mode);
    prepare();
    refresh();
  }
  apply(initial);
  if (!shadow) select.onchange?.({target:select});
  select.addEventListener('change',() => {
    if (languages.normalize(select.value)) languages.set(select.value);
    else syncMode(select.value);
  });
  window.addEventListener(languages.event,e => syncMode(e.detail));
}
if (document.readyState === 'complete') initializeNotebookLanguage();
else window.addEventListener('DOMContentLoaded', initializeNotebookLanguage, {once:true});
