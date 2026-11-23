"use strict";
// Shared JLPT level controls and time information only.
// Old demo sample bank intentionally removed: content is loaded from
// the individually authored existing-paper data in full-papers.js.
const times={N1:["言語知識・読解 110分","聴解 55分"],N2:["言語知識・読解 105分","聴解 50分"],N3:["文字・語彙 30分","文法・読解 70分","聴解 40分"],N4:["文字・語彙 25分","文法・読解 55分","聴解 35分"],N5:["文字・語彙 20分","文法・読解 40分","聴解 30分"]};
const timesBox=document.getElementById('times'),levelsBox=document.getElementById('levels'),testBox=document.getElementById('test');
const requestedLevel=new URLSearchParams(location.search).get('level');
let active=requestedLevel&&times[requestedLevel.toUpperCase()]?requestedLevel.toUpperCase():'N5';
if(timesBox)timesBox.innerHTML=Object.entries(times).map(([level,sections])=>'<p><strong>'+level+':</strong> '+sections.join(' · ')+'</p>').join('');
for(const level of ['N5','N4','N3','N2','N1']){
 const b=document.createElement('button');b.textContent=level;b.type='button';
 b.addEventListener('click',()=>choose(level));
 levelsBox.append(b);
}
function choose(level){
 if(!times[level])return;
 active=level;
 testBox.classList.add('hidden');
 document.getElementById('current-level').textContent='JLPT '+level+' · 20 Existing Practice Papers';
 const subtitle=document.getElementById('current-description');
 if(subtitle)subtitle.textContent='Level '+level+' · 20 existing paper cards · 100 reserved slots each. Only individually authored Japanese content is displayed; missing content is unavailable.';
 for(const button of levelsBox.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.textContent===level));
 const url=new URL(location.href);url.searchParams.set('level',level);
 history.replaceState(null,'',url);
}
document.getElementById('print').addEventListener('click',()=>window.print());
choose(active);
