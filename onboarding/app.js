(function(){'use strict';
const $=id=>document.getElementById(id),screens=[...document.querySelectorAll('.screen')];
const Auth=window.NextStepAuth;
let step=0;
let saved={};try{saved=JSON.parse(localStorage.getItem('nextstep-onboarding')||'{}')||{}}catch{}
if(saved.lang&&[...$('lang').options].some(x=>x.value===saved.lang))$('lang').value=saved.lang;
if(saved.level){const radio=document.querySelector('input[name=level][value="'+saved.level+'"]');if(radio)radio.checked=true}
if(saved.goals?.length){document.querySelectorAll('input[name=goal]').forEach(c=>c.checked=saved.goals.includes(c.value))}
if(saved.minutes)$('minutes').value=String(saved.minutes);
function show(n){
 step=Math.min(3,Math.max(0,n));screens.forEach((x,i)=>x.hidden=i!==step);
 $('stepCount').textContent=(step+1)+' / 4';document.querySelector('.steps').setAttribute('aria-valuenow',String(step+1));
 $('progress').style.width=((step+1)/4*100)+'%';
 document.querySelector('h1').focus?.();
 window.scrollTo({top:0,behavior:'instant'})
}
function preference(){
 const chosen=document.querySelector('input[name=level]:checked'),level=chosen?.value||'N2';
 const goals=[...document.querySelectorAll('input[name=goal]:checked')].map(x=>x.value);
 return {lang:$('lang').value,level,goals:goals.length?goals:['kanji'],minutes:Number($('minutes').value)||30}
}
function save(){
 const values=preference();localStorage.setItem('nextstep-onboarding',JSON.stringify(values));
 localStorage.setItem('nextstep-home-lang',(['ja','en','ne','hi'].includes(values.lang)?values.lang:'en'));
 localStorage.setItem('nextstep-selected-level',values.level);
 localStorage.setItem('nextstep-daily-target-minutes',String(values.minutes));
 try{
  const old=JSON.parse(localStorage.getItem('nextstep-unified-prefs')||'{}')||{};
  localStorage.setItem('nextstep-unified-prefs',JSON.stringify({...old,lang:values.lang}));
 }catch{}
 return values
}
function finish(type){
 save();
 localStorage.setItem('nextstep-onboarded','1');
 localStorage.setItem('nextstep-onboarding-access',type);
 localStorage.setItem('nextstep-profile-activity-consent',$('activityConsent').checked?'yes':'no');
 window.location.assign('../');
}
function error(e){$('authStatus').textContent=String(e?.message||e||'Sign-in error').slice(0,300)}
async function login(fn){
 if(!$('activityConsent').checked){$('authStatus').textContent='To create an online account, please consent to private account and last-use records. Or choose Guest without tracking.';return}
 $('authStatus').textContent='Secure sign-in…';
 try{const user=await fn();localStorage.setItem('nextstep-consenting-uid',user.uid);finish('account')}catch(e){error(e)}
}
$('welcomeNext').onclick=()=>show(1);
$('languageNext').onclick=()=>show(2);
$('goalNext').onclick=()=>{const goals=[...document.querySelectorAll('input[name=goal]:checked')];if(!goals.length){alert('Please select at least one subject.');return}show(3)};
document.querySelectorAll('[data-back]').forEach(x=>x.onclick=()=>show(step-1));
$('guest').onclick=async()=>{
 try{
  if(Auth?.configured() && await Auth.waitForUser())await Auth.logout();
  localStorage.removeItem('nextstep-consenting-uid');$('activityConsent').checked=false;finish('guest');
 }catch(e){error(e)}
};
if(Auth?.configured()){
 $('authStatus').textContent='Secure online accounts are available. Your profile will be private; only you and the administrator can see it.';
 $('google').disabled=false;$('emailLogin').disabled=false;$('emailRegister').disabled=false;
 $('google').onclick=()=>login(()=>Auth.loginGoogle());
 if(window.NEXTSTEP_FACEBOOK_LOGIN_READY===true){$('facebook').disabled=false;$('facebook').onclick=()=>login(()=>Auth.loginFacebook())}
 if(window.NEXTSTEP_PHONE_LOGIN_READY===true){
  let verifier,confirmation;
  $('phone').disabled=false;
  $('phone').onclick=()=>{$('phoneBox').hidden=false;$('number').focus()};
  $('sendCode').onclick=async()=>{
   if(!$('activityConsent').checked){error('Please agree to private account activity records first.');return}
   const number=$('number').value.trim();
   if(!/^\+[1-9]\d{6,14}$/.test(number)){error('Include the country code, for example +81, followed by digits.');return}
   $('sendCode').disabled=true;$('verifyCode').hidden=true;confirmation=null;
   try{
    const x=await Auth.sdk();
    verifier=new x.auth.RecaptchaVerifier(x.authentication,'captcha',{size:'normal'});
    confirmation=await x.auth.signInWithPhoneNumber(x.authentication,number,verifier);
    $('code').value='';$('verifyCode').hidden=false;$('code').focus();$('authStatus').textContent='Check your SMS for the verification code.';
   }catch(e){error(e)}finally{verifier?.clear();verifier=null;$('sendCode').disabled=false}
  };
  $('verifyCode').onsubmit=e=>{e.preventDefault();login(async()=>{
   const result=await confirmation.confirm($('code').value.trim());
   await Auth.touch(result.user,{signedIn:true});return result.user;
  })};
 }
 $('emailForm').onsubmit=e=>{e.preventDefault();login(()=>Auth.loginEmail($('email').value.trim(),$('password').value,false))};
 $('emailRegister').onclick=()=>login(()=>Auth.loginEmail($('email').value.trim(),$('password').value,true));
}else{
 $('authStatus').textContent='Online accounts are not connected yet. Guest Mode is available now; your study preferences are stored only in this browser.';
}
if(new URLSearchParams(location.search).get('step')==='signin')show(3);else show(0);
})();
