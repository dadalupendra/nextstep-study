/* NextStep Study Daily Reminder.
 * A real optional, opt-in browser notification while the site/PWA is open.
 * NOT server push: closed-app delivery needs a push subscription backend.
 * Date and reminder time are interpreted in Asia/Tokyo for all visitors.
 */
(function(global){
'use strict';
const SCRIPT_ROOT=new URL('.',document.currentScript.src);
const PREF_KEY='nextstep-daily-reminder-v1',SENT_PREFIX='nextstep-daily-reminder-shown-';
const LEVELS=['N5','N4','N3','N2','N1'],DEFAULT_TIME='08:30';
const ROOT=SCRIPT_ROOT.href;
const safe=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
function tokyoClock(date=new Date()){
 const opts={timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'};
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',opts).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 return{date:parts.year+'-'+parts.month+'-'+parts.day,time:parts.hour+':'+parts.minute};
}
function challengeURL(level){
 return new URL(level==='N1'?'N1/?section=daily':level+'/master.html?section=daily',ROOT).href;
}
function canUseNotifications(){
 return typeof global.Notification!=='undefined'&&typeof Notification.requestPermission==='function'&&
 !!navigator.serviceWorker&&global.isSecureContext;
}
function readPrefs(){
 let prefs={enabled:false,level:'N5',time:DEFAULT_TIME};
 try{
  const val=JSON.parse(localStorage.getItem(PREF_KEY)||'null');
  if(val&&typeof val==='object'){
   if(LEVELS.includes(val.level))prefs.level=val.level;
   if(/^([01]\d|2[0-3]):[0-5]\d$/.test(val.time))prefs.time=val.time;
   prefs.enabled=val.enabled===true;
  }
 }catch(e){}
 return prefs;
}
function storePrefs(prefs){try{localStorage.setItem(PREF_KEY,JSON.stringify(prefs));return true;}catch(e){return false;}}
function doneToday(level,date){
 try{
  const v=JSON.parse(localStorage.getItem('nextstep-daily100-v1-'+level+'-'+date)||'null');
  return !!v?.answers&&Object.keys(v.answers).length>=100;
 }catch(e){return false;}
}
function sentKey(day){return SENT_PREFIX+day;}
function alreadySent(day){try{return localStorage.getItem(sentKey(day))==='yes';}catch(e){return false;}}
function recordSent(day){try{localStorage.setItem(sentKey(day),'yes');}catch(e){}}
async function registration(){
 const rootReg=await navigator.serviceWorker.register(new URL('sw.js',ROOT).href,{scope:ROOT});
 await navigator.serviceWorker.ready;
 // Always use the *root* registration: some old N1 readers use an independent SW.
 return await navigator.serviceWorker.getRegistration(ROOT)||rootReg;
}
async function show(title,body,url,tag){
 const options={body,tag,icon:new URL('icons/icon-192.png',ROOT).href,badge:new URL('icons/icon-192.png',ROOT).href,data:{url},renotify:false};
 const reg=await registration();
 if(!reg||typeof reg.showNotification!=='function')throw Error('Persistent browser notifications are unsupported on this device.');
 await reg.showNotification(title,options);
}
let nodes=[],busy=false;
function textStatus(node,message){if(node){const el=node.querySelector('[data-ns-status]');if(el)el.textContent=message;}}
function report(message){for(const node of nodes)textStatus(node,message);}
async function tick(){
 if(busy||document.visibilityState==='hidden')return;
 const prefs=readPrefs(),clock=tokyoClock();
 for(const root of nodes){
  const label=root.querySelector('[data-ns-today]');
  if(label)label.textContent='📆 '+clock.date+' · Japan Time · '+prefs.level+' — 100 questions';
  const link=root.querySelector('[data-ns-go]');
  if(link)link.href=challengeURL(prefs.level);
 }
 if(!prefs.enabled||!canUseNotifications()||Notification.permission!=='granted')return;
 if(clock.time<prefs.time||alreadySent(clock.date)||doneToday(prefs.level,clock.date))return;
 busy=true;
 try{
  await show("🔔 Today's Challenge — NextStep Study",
   'आजको '+prefs.level+' Daily Challenge तयार छ! 30 Kanji + 40 Vocabulary + 30 Grammar = 100 प्रश्न।',
   challengeURL(prefs.level),'nextstep-daily-'+clock.date);
  recordSent(clock.date);
  report('✅ Today’s challenge reminder sent on this device. Next reminder on another Japan-calendar day.');
 }catch(e){report('⚠ Notification unavailable: '+e.message+' Your Daily 100 is still ready here.');}
 finally{busy=false;}
}
function statusMessage(){
 const prefs=readPrefs();
 if(!canUseNotifications())return '⚠ Browser notifications unsupported here. On iPhone, add NextStep Study to your Home Screen and open the installed app. The daily challenge is still available.';
 if(Notification.permission==='denied')return '⚠ Notifications blocked in your browser/phone settings. Re-enable permission there if wanted.';
 if(prefs.enabled&&Notification.permission==='granted')return '🔔 Enabled: '+prefs.time+' Japan Time · '+prefs.level+' — only while this website/app is active. Closed-app push is not configured.';
 return '🔕 Notifications are off. Enable only if you want device alerts. Automatic alerts while the app is closed require a push server.';
}
function setup(root){
 if(!root||root.dataset.nsReminderReady==='1')return;
 root.dataset.nsReminderReady='1';
 const prefs=readPrefs(),clock=tokyoClock();
 root.innerHTML='<section class="ns-reminder-panel" aria-label="Daily Challenge reminders">'+
  '<div class="ns-reminder-copy"><span class="ns-reminder-tag">📅 DAILY CHALLENGE · N5–N1</span>'+
  '<h3>🔔 Today’s Challenge / 今日の挑戦</h3>'+
  '<p class="ns-reminder-lead">आजको अभ्यास तयार छ! <b>100 Japanese questions every day</b> — 30 Kanji · 40 Vocabulary · 30 Grammar.</p>'+
  '<p class="ns-reminder-date" data-ns-today>📆 '+safe(clock.date)+' · Japan Time · '+prefs.level+' — 100 questions</p>'+
  '<a class="ns-reminder-link" data-ns-go href="'+safe(challengeURL(prefs.level))+'">🎯 Start Today’s Challenge →</a></div>'+
  '<div class="ns-reminder-settings"><div class="ns-reminder-controls">'+
  '<label>Level <select data-ns-level aria-label="JLPT reminder level">'+LEVELS.map(level=>'<option value="'+level+'"'+(level===prefs.level?' selected':'')+'>'+level+'</option>').join('')+'</select></label>'+
  '<label>Reminder (JST) <input type="time" data-ns-time aria-label="Reminder time in Japan" value="'+prefs.time+'"></label></div>'+
  '<div class="ns-reminder-actions"><button data-ns-enable type="button">🔔 Enable reminders</button>'+
  '<button data-ns-test type="button">🔊 Test notification</button>'+
  '<button data-ns-disable type="button">🔕 Turn off</button></div>'+
  '<p class="ns-reminder-status" role="status" data-ns-status>'+safe(statusMessage())+'</p>'+
  '<p class="ns-reminder-note">Permission is optional. While this site or installed app is open, your device can show a daily reminder after your selected time. It cannot guarantee notifications after you close the app without a separate Push service. No visitor is automatically subscribed.</p></div></section>';
 nodes.push(root);
 const level=root.querySelector('[data-ns-level]'),time=root.querySelector('[data-ns-time]');
 const enable=root.querySelector('[data-ns-enable]'),disable=root.querySelector('[data-ns-disable]'),test=root.querySelector('[data-ns-test]');
 function changed(){const p=readPrefs();p.level=LEVELS.includes(level.value)?level.value:'N5';p.time=/^([01]\d|2[0-3]):[0-5]\d$/.test(time.value)?time.value:DEFAULT_TIME;storePrefs(p);for(const other of nodes){if(other!==root){other.querySelector('[data-ns-level]').value=p.level;other.querySelector('[data-ns-time]').value=p.time;}}tick();}
 level.addEventListener('change',changed);time.addEventListener('change',changed);
 enable.addEventListener('click',async()=>{
  changed();if(!canUseNotifications()){report(statusMessage());return;}
  // Request permission directly in the click handler, before any async work.
  let permission;
  try{permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();}
  catch(e){report('⚠ Could not request notification permission: '+e.message);return;}
  if(permission!=='granted'){const p=readPrefs();p.enabled=false;storePrefs(p);report(statusMessage());return;}
  const p=readPrefs();p.enabled=true;storePrefs(p);
  report(statusMessage());await tick();
 });
 disable.addEventListener('click',()=>{
  const p=readPrefs();p.enabled=false;storePrefs(p);report(statusMessage());
 });
 test.addEventListener('click',async()=>{
  if(!canUseNotifications()||Notification.permission!=='granted'){report('Enable reminders and grant notification permission first.');return;}
  try{await show('🔔 NextStep Study — Test Notification',
   'Today’s Challenge is ready! Open '+readPrefs().level+' to practice 100 Japanese questions.',
   challengeURL(readPrefs().level),'nextstep-daily-test-'+Date.now());
   report('✅ Test notification sent. Please check your device notification settings if it is not visible.');
  }catch(e){report('⚠ Test notification failed: '+e.message);}
 });
}
function init(){
 let root=document.getElementById('daily-reminder-root');
 if(!root){
  const home=document.querySelector('main');
  const reader=document.getElementById('studyView');
  if(reader){root=document.createElement('div');root.id='daily-reminder-root';reader.prepend(root);}
  else if(home){root=document.createElement('div');root.id='daily-reminder-root';home.prepend(root);}
 }
 setup(root);
 tick();
 setInterval(tick,60000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick();});
 global.addEventListener('focus',tick);
 global.addEventListener('storage',event=>{
  if(event.key===PREF_KEY||event.key?.startsWith('nextstep-daily100-v1-')){
   const p=readPrefs();for(const node of nodes){
    node.querySelector('[data-ns-level]').value=p.level;
    node.querySelector('[data-ns-time]').value=p.time;
    textStatus(node,statusMessage());
   }tick();
  }
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
global.NextStepDailyReminder={tokyoClock,challengeURL,readPrefs,tick};
})(window);
