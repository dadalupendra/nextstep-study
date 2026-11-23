'use strict';
/* NextStep Study Feedback Center.
 * Explicitly user-initiated actions only: no hidden Facebook tracking,
 * no pretend auto-submission, no user access tokens on GitHub Pages.
 */
(function(){
const $=id=>document.getElementById(id);
const raw=window.NextStepCommunityConfig||{};
const configs={
 post:validFacebook(raw.facebookPostUrl),
 page:validFacebook(raw.facebookPageUrl),
 messenger:validMessenger(raw.messengerUrl)
};
function validFacebook(value){
 if(typeof value!=='string'||!value.trim())return '';
 try{
  const u=new URL(value);
  if(u.protocol!=='https:'||!['facebook.com','www.facebook.com','m.facebook.com','web.facebook.com','fb.watch'].includes(u.hostname.toLowerCase()))return '';
  return u.href;
 }catch(e){return ''}
}
function validMessenger(value){
 if(typeof value!=='string'||!value.trim())return '';
 try{
  const u=new URL(value);
  if(u.protocol!=='https:'||!['m.me','www.m.me','facebook.com','www.facebook.com','messenger.com','www.messenger.com'].includes(u.hostname.toLowerCase()))return '';
  return u.href;
 }catch(e){return ''}
}
function plain(s,max){return String(s||'').trim().slice(0,max).replace(/[\u0000-\u001f\u007f]/g,' ');}
function isValidLink(value){
 if(!value)return true;
 try{return new URL(value).protocol==='https:'||new URL(value).protocol==='http:';}catch(e){return false}
}
function formData(){
 const f=$('feedback-form');
 if(!f.checkValidity()){f.reportValidity();return null;}
 const message=plain($('feedback-message').value,1800);
 if(message.length<12){$('form-status').textContent='Please write a little more detail (at least 12 characters).';return null;}
 const page=plain($('feedback-page').value,350);
 if(!isValidLink(page)){$('form-status').textContent='Enter a valid page URL, or leave it blank.';return null;}
 const rating=f.querySelector('[name="rating"]:checked')?.value||'Not rated';
 return{
  type:plain($('feedback-type').value,50),
  level:plain($('feedback-level').value,15),
  rating,
  name:plain($('feedback-name').value,70),
  message,
  page
 };
}
function textMessage(data){
 const parts=[
  '📣 NextStep Study Feedback',
  'Type: '+data.type,
  'JLPT level: '+data.level,
  'Rating: '+(data.rating==='Not rated'?'Not provided':data.rating+'/5'),
  '',
  data.message
 ];
 if(data.page)parts.push('','Related page: '+data.page);
 if(data.name)parts.push('','From: '+data.name);
 return parts.join('\n');
}
async function copyText(str){
 if(navigator.clipboard&&window.isSecureContext){
  try{await navigator.clipboard.writeText(str);return true;}catch(e){}
 }
 const input=document.createElement('textarea');input.value=str;input.setAttribute('aria-label','Feedback to copy');
 input.style.cssText='position:fixed;top:-2000px;left:-2000px';
 document.body.append(input);input.focus();input.select();
 let copied=false;
 try{copied=document.execCommand('copy');}catch(e){}
 input.remove();return copied;
}
function report(msg){$('form-status').textContent=msg}
const facebookStatus=$('facebook-status');
if(configs.post){
 const a=$('facebook-post');a.href=configs.post;a.hidden=false;
 facebookStatus.textContent='✅ Facebook post link connected. Paste your copied feedback in a comment on the post.';
}else{
 facebookStatus.textContent='⚠ Facebook post not connected yet. The owner must add the actual NextStep Study Facebook post URL. No comment is posted automatically.';
}
if(configs.page){const a=$('facebook-page');a.href=configs.page;a.hidden=false;}
if(configs.messenger){
 const a=$('messenger-link');a.href=configs.messenger;a.hidden=false;
 $('messenger-status').textContent='✅ Messenger link available. Send a message there yourself.';
}else{
 $('messenger-status').textContent='⚠ Messenger link not configured. The owner must add a real Facebook Page Messenger URL.';
}
$('copy-feedback').addEventListener('click',async()=>{
 const data=formData();if(!data)return;
 const success=await copyText(textMessage(data));
 report(success?'✅ Feedback copied. Paste it into a Facebook comment or another message. It has NOT been sent automatically.':'⚠ Copy was blocked. Select the message and copy manually; nothing has been sent.');
});
$('copy-facebook').addEventListener('click',async()=>{
 const data=formData();if(!data)return;
 const success=await copyText(textMessage(data));
 if(success){
  report(configs.post?'✅ Copied! Click “Open Facebook Post”, paste your comment, and press Post.':'✅ Copied! Facebook post is not yet linked. Ask the NextStep owner to provide their Facebook post URL.');
 }else report('⚠ Clipboard unavailable. You can select your message and paste it manually.');
 if(configs.post&&success)$('facebook-post').focus();
});
$('feedback-form').addEventListener('submit',event=>{
 event.preventDefault();
 const data=formData();if(!data)return;
 // The GitHub issue is authored by the visitor after GitHub sign-in;
 // the site does not claim a message was sent by opening a URL.
 let base;
 try{base=new URL(raw.githubIssuesBase||'https://github.com/dadalupendra/nextstep-study/issues/new');
  if(base.protocol!=='https:'||base.hostname!=='github.com'||!/^\/dadalupendra\/nextstep-study\/issues\/new\/?$/.test(base.pathname))throw Error('Invalid GitHub Issues destination');
 }catch(e){report('⚠ GitHub feedback destination is not correctly configured.');return;}
 base.searchParams.set('title','[NextStep Feedback] '+data.type+' — '+data.level);
 base.searchParams.set('body',textMessage(data)+'\n\n---\nFeedback prepared via NextStep Study. The visitor submits it on GitHub.');
 report('Opening GitHub Issue. Please sign in to GitHub if necessary, review your public message and press Submit new issue. Nothing has been submitted yet.');
 window.location.assign(base.href);
});
})();
