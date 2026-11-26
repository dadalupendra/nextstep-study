(async function(){'use strict';
const $=id=>document.getElementById(id),status=$('status'),details=$('details'),Auth=window.NextStepAuth;
const field=(name,value)=>{const label=document.createElement('dt'),body=document.createElement('dd');label.textContent=name;body.textContent=value||'—';details.append(label,body)};
let local={};try{local=JSON.parse(localStorage.getItem('nextstep-onboarding')||'{}')||{}}catch{}
field('Your selected JLPT level',local.level||'Not chosen');
field('Study goals',Array.isArray(local.goals)?local.goals.join(', '):'Not chosen');
field('Explanation language',local.lang||'Not chosen');
if(!Auth?.configured()){status.textContent='Guest Mode · No online account connected. No server-side identity or usage record exists.';return}
try{
 const info=await Auth.getProfile();
 if(!info){status.textContent='You are not signed in. Your private online profile is unavailable.';return}
 status.textContent='Signed in · Your profile is private.';
 const u=info.user,p=info.profile||{};
 field('Display name',p.displayName||u.displayName||'');
 field('Email',p.email||u.email||'');
 field('Authentication provider',p.provider||'');
 field('Account ID',u.uid);
 const date=p.lastActiveAt?.toDate?.();field('Last recorded activity',date?date.toLocaleString():'Not yet recorded');
 $('logout').hidden=false;$('logout').onclick=async()=>{
  try{await Auth.logout();status.textContent='Signed out.';$('logout').hidden=true;location.reload()}
  catch(e){status.textContent='Sign-out error: '+e.message}
 }
}catch(e){status.textContent='Profile could not be loaded: '+e.message}
})();