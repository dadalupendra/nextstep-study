/* Progressive enhancement for N4/N5 static notebooks. No lesson content is rewritten. */
(()=>{'use strict';
let scheduled=false;
function adapt(){
 scheduled=false;
 for(const table of document.querySelectorAll('.table-wrap table:not(.responsive-study-table):not(.mobile-table-checked)')){
  table.classList.add('mobile-table-checked');
  if(table.classList.contains('kana-chart') || table.querySelector('[colspan],[rowspan]'))continue;
  const rows=[...table.querySelectorAll('tr')];
  if(rows.length<2)continue;
  const head=rows.find(row=>row.querySelectorAll('th').length>=3);
  if(!head)continue;
  const columns=[...head.querySelectorAll(':scope > th')].map((el,i)=>(el.innerText||'').trim()||'Column '+(i+1));
  if(columns.length<3||columns.length>7)continue;
  if(!rows.some(row=>row.querySelector('td')))continue;
  table.classList.add('responsive-study-table');
  head.classList.add('mobile-header-row');
  for(const tr of rows){
   if(tr===head)continue;
   const cells=[...tr.children].filter(x=>x.tagName==='TD');
   cells.forEach((td,i)=>{td.dataset.columnLabel=columns[i]||'Column '+(i+1)});
  }
 }
}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(adapt)}
function start(){
 const root=document.getElementById('main');
 if(!root)return;
 queue();
 new MutationObserver(queue).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();