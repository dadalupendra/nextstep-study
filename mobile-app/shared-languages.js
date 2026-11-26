/* NextStep shared language preference for all existing full book readers.
   The free translator may not support all language pairs; original content stays intact. */
(()=>{'use strict';
const codes='ne en ja hi bn zh-CN ko fr es de ar th vi id pt ru it tr uk pl nl sv fi da no el he fa ur ta te mr gu pa ms sw fil my km lo af sq am hy az eu be bs bg ca hr cs et gl ka ht hu is ig ga jv kk ku ky lv lt mk mn ps ro sr sk sl so su tg uz cy zu yo xh si or as tk fy lb mt ny st sd yi ceb'.split(' ');
const names={ne:'नेपाली',en:'English',ja:'日本語',hi:'हिन्दी','zh-CN':'中文',ko:'한국어',bn:'বাংলা',ar:'العربية',ur:'اردو',ta:'தமிழ்'};
function init(){
 const select=document.getElementById('targetLang');if(!select||select.dataset.nsExpanded)return;
 select.dataset.nsExpanded='true';
 let prefs={};try{prefs=JSON.parse(localStorage.getItem('nextstep-unified-prefs')||'{}')||{}}catch{}
 select.replaceChildren();
 for(const code of codes){const item=document.createElement('option');item.value=code;
   let name=names[code];if(!name){try{name=new Intl.DisplayNames(['en'],{type:'language'}).of(code)}catch{name=code}}
   item.textContent=name+' ('+code+')';select.append(item);
 }
 select.value=codes.includes(prefs.lang)?prefs.lang:'ne';
 select.addEventListener('change',()=>{
   prefs.lang=select.value;
   try{localStorage.setItem('nextstep-unified-prefs',JSON.stringify(prefs))}catch{}
 });
 const banner=document.createElement('small');banner.style.cssText='display:block;margin-top:7px;color:#5B5780;line-height:1.6';
 banner.textContent='93 languages · machine translation may be unavailable or inaccurate. Original Japanese stays visible.';
 select.parentElement?.append(banner);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
