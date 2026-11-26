/* NextStep Smart Review: local-only, source-independent spaced practice.
   Records the learner's self-rating; no fake mastery or score prediction.
   Review periods are illustrative scheduling choices, not official JLPT rules.
*/
(function(global){'use strict';
const LEVELS=new Set(['N5','N4','N3','N2','N1']);
const TYPES=new Set(['kanji','vocab']);
const GRADES=['again','hard','good','easy'];
const BASE={again:10*60*1000,hard:24*60*60*1000,good:3*24*60*60*1000,easy:7*24*60*60*1000};
const STORAGE='nextstep-srs-v1';
function store(){try{const data=JSON.parse(localStorage.getItem(STORAGE)||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{}}catch{return {}}}
function save(data){try{localStorage.setItem(STORAGE,JSON.stringify(data));return true}catch{return false}}
function identifier(level,type,item){if(!LEVELS.has(level)||!TYPES.has(type)||typeof item!=='string'||!item.trim())throw Error('Invalid SRS study item');return level+'|'+type+'|'+item.trim()}
function get(level,type,item){const entry=store()[identifier(level,type,item)];return entry&&Number.isFinite(entry.due)?entry:null}
function rate(level,type,item,grade,now=Date.now()){
 if(!GRADES.includes(grade))throw Error('Unknown review rating');
 const id=identifier(level,type,item);
 const db=store(),prev=db[id]||{};
 let streak=grade==='again'?0:(Number(prev.streak)||0)+1;
 let interval=BASE[grade];
 if(grade==='good')interval=Math.min(60*24*60*60*1000,interval*Math.max(1,Math.pow(1.7,Math.max(0,streak-1))));
 if(grade==='easy')interval=Math.min(120*24*60*60*1000,interval*Math.max(1,Math.pow(1.9,Math.max(0,streak-1))));
 if(grade==='hard'&&prev.interval)interval=Math.max(interval,Math.min(prev.interval*1.2,14*24*60*60*1000));
 db[id]={due:now+Math.round(interval),interval:Math.round(interval),streak,grade,reviewed:now,attempts:(prev.attempts||0)+1};
 save(db);
 return db[id]
}
function isDue(level,type,item,now=Date.now()){const entry=get(level,type,item);return Boolean(entry&&entry.due<=now)}
function status(level,type,items,keyFn,now=Date.now()){
 const db=store(),stats={total:items.length,new:0,due:0,scheduled:0,reviewed:0,weak:0};
 for(const item of items){const key=identifier(level,type,keyFn(item));const e=db[key];
  if(!e){stats.new++;continue}
  stats.reviewed++;
  if(e.due<=now)stats.due++;else stats.scheduled++;
  if(e.grade==='again'||e.grade==='hard')stats.weak++
 }
 return stats
}
function candidates(level,type,items,keyFn,mode='all',now=Date.now()){
 if(mode==='all')return items;
 return items.filter(item=>{
  const entry=get(level,type,keyFn(item));
  if(mode==='due')return entry&&entry.due<=now;
  if(mode==='new')return !entry;
  if(mode==='weak')return entry&&(entry.grade==='again'||entry.grade==='hard');
  return true
 })
}
function printable(entry){
 if(!entry)return 'Not yet reviewed';
 const date=new Date(entry.due);
 return (entry.due<=Date.now()?'Due now':'Next review: '+date.toLocaleString())+' · '+entry.attempts+' reviews'
}
global.NextStepSRS={rate,get,isDue,status,candidates,printable,GRADES};
})(window);