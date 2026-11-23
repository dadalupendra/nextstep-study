/* NextStep Study public Edge Function. Deploy with verify_jwt=false for anonymous feedback only.
 * All database credentials, captcha secrets and email keys remain on the server.
 */
const siteOrigin=Deno.env.get("NEXTSTEP_SITE_ORIGIN")||"https://dadalupendra.github.io";
const cors={
 "Access-Control-Allow-Origin":siteOrigin,
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Access-Control-Allow-Headers":"content-type",
 "Access-Control-Max-Age":"86400",
 "Vary":"Origin","Cache-Control":"no-store"
};
function respond(status:number,body:Record<string,unknown>):Response{
 return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});
}
function value(input:unknown,max:number):string{
 return typeof input==="string"?input.trim().slice(0,max+1):"";
}
async function sha256(input:string):Promise<string>{
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(input));
 return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async(req:Request)=>{
 if(req.headers.get("origin")!==siteOrigin)return respond(403,{ok:false,error:"Origin not allowed."});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return respond(405,{ok:false,error:"POST required."});
 if(Number(req.headers.get("content-length")||0)>10000)return respond(413,{ok:false,error:"Request too large."});
 const project=Deno.env.get("SUPABASE_URL")||"";
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 const captchaSecret=Deno.env.get("TURNSTILE_SECRET_KEY")||"";
 const hashSecret=Deno.env.get("FEEDBACK_IP_HASH_SECRET")||"";
 if(!project||!secret||!captchaSecret||hashSecret.length<32)
  return respond(503,{ok:false,error:"Private feedback storage has not been configured."});
 let payload:Record<string,unknown>;
 try{
  const raw=await req.text();
  if(raw.length>10000)return respond(413,{ok:false,error:"Request too large."});
  payload=JSON.parse(raw);
  if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("Bad payload");
 }catch(_){return respond(400,{ok:false,error:"Invalid JSON."});}
 const category=value(payload.type,45),level=value(payload.level,12);
 const rating=payload.rating===null?null:Number(payload.rating);
 const name=value(payload.name,70),message=value(payload.message,1800);
 const page=value(payload.page_url,900),question=value(payload.question_id,180);
 const token=value(payload.turnstile_token,4096);
 if(!["Suggestion","Bug report","Question","Content correction","Other"].includes(category)||
  !["General","N1","N2","N3","N4","N5"].includes(level)||
  (rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))||
  name.length>70||message.length<12||message.length>1800||
  question.length>180||!token)
  return respond(400,{ok:false,error:"Invalid feedback fields or missing anti-spam verification."});
 try{
  const source=new URL(page);
  if(source.origin!==siteOrigin||!source.pathname.startsWith("/nextstep-study/")||page.length>900)
   return respond(400,{ok:false,error:"Related page must belong to NextStep Study."});
 }catch(_){return respond(400,{ok:false,error:"Invalid page URL."});}
 let verification:{success?:boolean;hostname?:string};
 try{
  const result=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
   method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({
    secret:captchaSecret,response:token,
    remoteip:(req.headers.get("cf-connecting-ip")||"").slice(0,60)
   })
  });
  verification=await result.json();
 }catch(_){return respond(502,{ok:false,error:"Anti-spam verification unavailable. Retry."});}
 if(!verification.success||verification.hostname!==new URL(siteOrigin).hostname)
  return respond(400,{ok:false,error:"Anti-spam verification failed. Retry."});
 const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim();
 const bucket=new Date().toISOString().slice(0,13);
 const hash=await sha256(hashSecret+"|"+bucket+"|"+ip);
 let id:string;
 try{
  const response=await fetch(project+"/rest/v1/rpc/nextstep_submit_feedback",{
   method:"POST",
   headers:{apikey:secret,Authorization:"Bearer "+secret,"Content-Type":"application/json"},
   body:JSON.stringify({
    p_category:category,p_level:level,p_rating:rating,p_name:name,
    p_content:message,p_source_url:page,p_question_id:question,p_bucket_hash:hash
   })
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok){
   const detail=String(result?.message||"");
   if(detail.includes("RATE_LIMIT_EXCEEDED"))return respond(429,{ok:false,error:"Too many submissions. Retry next hour."});
   if(detail.includes("INVALID_FEEDBACK"))return respond(400,{ok:false,error:"Invalid feedback content."});
   console.error("Feedback database rejected write; HTTP",response.status);
   return respond(503,{ok:false,error:"Feedback storage unavailable. Retry."});
  }
  if(typeof result!=="string"||!/^[0-9a-f-]{36}$/i.test(result))throw Error("Missing database confirmation");
  id=result;
 }catch(_){return respond(503,{ok:false,error:"Database save could not be confirmed."});}
 const resendKey=Deno.env.get("RESEND_API_KEY");
 const owner=Deno.env.get("FEEDBACK_ADMIN_EMAIL");
 const sender=Deno.env.get("FEEDBACK_FROM_EMAIL");
 if(resendKey&&owner&&sender){
  try{
   const sent=await fetch("https://api.resend.com/emails",{
    method:"POST",headers:{Authorization:"Bearer "+resendKey,"Content-Type":"application/json"},
    body:JSON.stringify({
     from:sender,to:[owner],subject:"NextStep Study: "+category+" ("+level+")",
     text:"Reference: "+id+"\nLevel: "+level+"\nRating: "+
      (rating===null?"None":rating+"/5")+"\nQuestion ID: "+question+
      "\nPage: "+page+"\n\n"+message
    })
   });
   if(!sent.ok)console.error("Email notification unsuccessful; HTTP",sent.status);
  }catch(_){console.error("Email notification could not be delivered.");}
 }
 return respond(201,{ok:true,id});
});
