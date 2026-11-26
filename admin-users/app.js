(async function(){'use strict';
const $=id=>document.getElementById(id),auth=window.NextStepAuth,status=$('status');
const date=x=>{try{return x?.toDate?.().toLocaleString()||'Unknown'}catch{return 'Unknown'}};
let knownUserIds=null;
function showProfiles(profiles){
 const ids=new Set(profiles.map(x=>x.id));
 const newlyRegistered=knownUserIds?[...ids].filter(id=>!knownUserIds.has(id)).length:0;
 knownUserIds=ids;
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
 status.textContent='Authorized account directory · '+(newlyRegistered?newlyRegistered+' new registration(s) since last update.':'Live account list up to date.');
 $('directory').hidden=false;
 if(newlyRegistered&&'Notification'in window&&Notification.permission==='granted'){
  try{new Notification('NextStep Study: new registration',{body:newlyRegistered+' new verified account(s) registered.'})}catch{}
 }
}
async function reload(){
 try{const profiles=await auth.listProfiles();showProfiles(profiles)}
 catch(e){$('directory').hidden=true;status.textContent='Access denied or setup incomplete: '+e.message}
}
$('refresh').onclick=reload;
if(!auth?.configured()){status.textContent='Not connected. Configure Firebase, publish Firestore rules and grant admin role before this page can list users.';return}
await reload();
if(auth.watchProfiles){auth.watchProfiles(showProfiles,error=>{
 status.textContent='Live updates unavailable: '+error.message+'. Manual refresh is still possible.'
}).catch(error=>{status.textContent='Live update setup failed: '+error.message})}
$('notify').onclick=async()=>{
 if(!('Notification'in window)){status.textContent='This browser does not support notifications.';return}
 try{const permission=await Notification.requestPermission();status.textContent=permission==='granted'
  ?'Browser alerts enabled while this dashboard is open. Background delivery is not configured.'
  :'Notifications not enabled. Live list can still update.'}
 catch(e){status.textContent='Unable to enable notifications: '+e.message}
};
})();