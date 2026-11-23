/* Read-only administrator dashboard. Authorization is enforced by Supabase RLS. */
(function(){
"use strict";
const $=id=>document.getElementById(id),cfg=window.NextStepCommunityConfig||{},status=$("status");
let project="",key="",token="";
try{
 const u=new URL(cfg.supabaseUrl);
 if(u.protocol!=="https:"||!u.hostname.endsWith(".supabase.co")||!cfg.supabaseAnonKey)throw Error("Missing Supabase configuration");
 project=u.origin;key=cfg.supabaseAnonKey;
}catch(_){status.textContent="⚠ Private feedback backend is not configured yet.";return;}
$("signin").hidden=false;status.textContent="Sign in with an approved NextStep administrator account.";
async function api(path,opt={}){
 const headers={apikey:key,...(opt.headers||{})};
 if(token)headers.Authorization="Bearer "+token;
 const r=await fetch(project+path,{...opt,headers,credentials:"omit"});
 const json=await r.json().catch(()=>null);
 if(!r.ok)throw Error("Server rejected request (HTTP "+r.status+").");
 return json;
}
async function load(){
 status.textContent="Checking administrator permissions…";
 const access=await api("/rest/v1/nextstep_feedback_admins?select=user_id&limit=1");
 if(!Array.isArray(access)||access.length!==1)throw Error("This account is not an approved feedback administrator.");
 const entries=await api("/rest/v1/nextstep_feedback?select=id,created_at,category,jlpt_level,rating,display_name,content,source_url,question_id,status&order=created_at.desc&limit=200");
 if(!Array.isArray(entries))throw Error("Invalid feedback data.");
 $("entries").replaceChildren();
 $("count").textContent="Showing "+entries.length+" latest private submissions (maximum 200).";
 for(const row of entries){
  const card=document.createElement("article");card.className="entry";
  const h=document.createElement("h3");h.textContent=(row.category||"Feedback")+" · "+(row.jlpt_level||"General")+" · "+(row.rating==null?"No rating":row.rating+"/5 stars");
  const small=document.createElement("small");small.textContent=new Date(row.created_at).toLocaleString()+" · "+(row.display_name||"Anonymous")+" · "+(row.status||"new");
  const p=document.createElement("p");p.textContent=row.content||"";
  const q=document.createElement("small");q.textContent=row.question_id?"Question: "+row.question_id:"No question ID";
  card.append(h,small,p,q);
  try{
   const page=new URL(row.source_url);
   if(page.origin==="https://dadalupendra.github.io"&&page.pathname.startsWith("/nextstep-study/")){
    const link=document.createElement("a");link.href=page.href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=" Related page";
    card.append(document.createElement("div"),link);
   }
  }catch(_){}
  $("entries").append(card);
 }
 $("dashboard").hidden=false;$("signin").hidden=true;status.textContent="✅ Authorized feedback loaded.";
}
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!$("login-form").reportValidity())return;
 $("login").disabled=true;status.textContent="Authenticating…";
 try{
  const auth=await api("/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("admin-email").value.trim(),password:$("admin-password").value})});
  token=typeof auth.access_token==="string"?auth.access_token:"";
  $("admin-password").value="";
  if(!token)throw Error("No valid authentication token.");
  await load();
 }catch(err){token="";$("dashboard").hidden=true;$("signin").hidden=false;status.textContent="⚠ "+String(err.message);}
 finally{$("login").disabled=false;}
});
$("refresh").addEventListener("click",async()=>{try{await load();}catch(err){status.textContent="⚠ "+String(err.message);}});
$("logout").addEventListener("click",()=>{token="";$("dashboard").hidden=true;$("signin").hidden=false;$("entries").replaceChildren();status.textContent="Signed out of the dashboard.";});
})();
