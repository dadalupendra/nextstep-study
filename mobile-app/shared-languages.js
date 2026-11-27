/* One explanation-language preference across the web book readers. */
(() => {
  'use strict';
  const names = {ne:'नेपाली',en:'English',ja:'日本語',hi:'हिन्दी',bn:'বাংলা','zh-CN':'中文',ko:'한국어',fr:'Français',es:'Español',de:'Deutsch',ar:'العربية',th:'ไทย',vi:'Tiếng Việt',id:'Bahasa Indonesia',pt:'Português',ru:'Русский',it:'Italiano',tr:'Türkçe',uk:'Українська',pl:'Polski',nl:'Nederlands',sv:'Svenska',fi:'Suomi',da:'Dansk',no:'Norsk',el:'Ελληνικά',he:'עברית',fa:'فارسی',ur:'اردو',ta:'தமிழ்',te:'తెలుగు',mr:'मराठी',gu:'ગુજરાતી',pa:'ਪੰਜਾਬੀ',ms:'Bahasa Melayu',sw:'Kiswahili',fil:'Filipino',my:'မြန်မာ',km:'ខ្មែរ',lo:'ລາວ',af:'Afrikaans',sq:'Shqip',am:'አማርኛ',hy:'Հայերեն',az:'Azərbaycanca',eu:'Euskara',be:'Беларуская',bs:'Bosanski',bg:'Български',ca:'Català',hr:'Hrvatski',cs:'Čeština',et:'Eesti',gl:'Galego',ka:'ქართული',ht:'Kreyòl ayisyen',hu:'Magyar',is:'Íslenska',ig:'Igbo',ga:'Gaeilge',jv:'Basa Jawa',kk:'Қазақша',ku:'Kurdî',ky:'Кыргызча',lv:'Latviešu',lt:'Lietuvių',mk:'Македонски',mn:'Монгол',ps:'پښتو',ro:'Română',sr:'Српски',sk:'Slovenčina',sl:'Slovenščina',so:'Soomaali',su:'Basa Sunda',tg:'Тоҷикӣ',uz:'Oʻzbekcha',cy:'Cymraeg',zu:'isiZulu',yo:'Yorùbá',xh:'isiXhosa',si:'සිංහල',or:'ଓଡ଼ିଆ',as:'অসমীয়া',tk:'Türkmençe',fy:'Frysk',lb:'Lëtzebuergesch',mt:'Malti',ny:'Chichewa',st:'Sesotho',sd:'سنڌي',yi:'ייִדיש',ceb:'Cebuano'};
  const key = 'nextstep-unified-prefs';
  const event = 'nextstep-meaning-language';
  function normalize(code) {
    if (code === 'zh') return 'zh-CN';
    return Object.prototype.hasOwnProperty.call(names, code) ? code : '';
  }
  function saved() {
    try {
      const prefs = JSON.parse(localStorage.getItem(key) || '{}');
      return normalize(prefs?.lang) || normalize(localStorage.getItem('ns-book-lang'));
    } catch { return ''; }
  }
  let current = saved();
  function notify(code) {
    current = code;
    window.dispatchEvent(new CustomEvent(event, {detail: code}));
  }
  function set(code) {
    code = normalize(code);
    if (!code) return;
    try {
      const prefs = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({...prefs, lang: code}));
    } catch { /* The choice still works in this tab. */ }
    notify(code);
  }
  function fill(select, code = current || 'ne') {
    select.replaceChildren(...Object.entries(names).map(([value, name]) => new Option(name, value)));
    select.value = normalize(code) || 'ne';
  }
  function sync() {
    const value = saved();
    if (value && value !== current) notify(value);
  }
  window.addEventListener('storage', e => { if (e.key === key) sync(); });
  window.addEventListener('pageshow', e => { if (e.persisted) sync(); });
  window.NextStepLanguages = {names, normalize, get: (fallback = 'ne') => current || fallback, fill, set, event};
})();
