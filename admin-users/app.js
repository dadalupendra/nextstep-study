(async function(){'use strict';
const $=id=>document.getElementById(id),auth=window.NextStepAuth,status=$('status');
const date=x=>{try{return x?.toDate?.().toLocaleString()||'Unknown'}catch{return 'Unknown'}};
let known=null;
function denied(e){
 $('directory').hidden=true;$('users').replaceChildren();known=null;
 status.textContent='Access denied or setup incomplete: '+e.message;
}
async function reload(){
 $('directory').hidden=true;
 try{
  await auth.watchProfiles(profiles=>{
  $('users').replaceChildren();
  profiles.sort((a,b)=>(b.lastActiveAt?.seconds||0)-(a.lastActiveAt?.seconds||0));
  for(const person of profiles){
   const tr=document.createElement('tr');
   for(const value of [person.displayName||person.id,person.email||'—',person.provider||'—',date(person.createdAt),date(person.lastSignInAt),date(person.lastActiveAt)]){
    const td=document.createElement('td');td.textContent=String(value);tr.append(td)
   }
   $('users').append(tr);
  }
  $('count').textContent=profiles.length+' registered accounts';
  const added=known ? profiles.filter(p=>!known.has(p.id)) : [];
  status.textContent=added.length ? 'New account: '+added.map(p=>p.displayName||p.email||p.id).join(', ') : 'Live account activity · Administrator access';
  known=new Set(profiles.map(p=>p.id));
  $('directory').hidden=false
 },denied)
 }catch(e){denied(e)}
}

if(!auth?.configured()){status.textContent='Not connected. Configure Firebase, publish Firestore rules and grant admin role before this page can list users.';return}
await reload()
})();