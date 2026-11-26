(async function(){'use strict';
const $=id=>document.getElementById(id),auth=window.NextStepAuth,status=$('status');
const date=x=>{try{return x?.toDate?.().toLocaleString()||'Unknown'}catch{return 'Unknown'}};
async function reload(){
 $('directory').hidden=true;
 try{
  const profiles=await auth.listProfiles();
  $('users').replaceChildren();
  profiles.sort((a,b)=>(b.lastActiveAt?.seconds||0)-(a.lastActiveAt?.seconds||0));
  for(const person of profiles){
   const tr=document.createElement('tr');
   for(const value of [person.displayName||person.id,person.email||'—',person.provider||'—',date(person.createdAt),date(person.lastSignInAt),date(person.lastActiveAt)]){
    const td=document.createElement('td');td.textContent=String(value);tr.append(td)
   }
   $('users').append(tr);
  }
  $('count').textContent=profiles.length+' verified profiles in Firebase';
  status.textContent='Access authorized. Entries are visible only to an authorized administrator.';
  $('directory').hidden=false
 }catch(e){status.textContent='Access denied or setup incomplete: '+e.message}
}
$('refresh').onclick=reload;
if(!auth?.configured()){status.textContent='Not connected. Configure Firebase, publish Firestore rules and grant admin role before this page can list users.';return}
await reload()
})();