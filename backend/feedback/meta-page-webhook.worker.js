/* Optional Meta Page webhook callback for NextStep Study.
 * This is a deployable Cloudflare Worker template, NOT an activated connection.
 * Configure Meta app/Page approval + subscriptions and Worker secrets privately.
 * Sends only a count/type alert; never fetches visitors or messages them.
 */
function equalBytes(a,b){
 if(a.length!==b.length)return false;
 let n=0;
 for(let i=0;i<a.length;i++)n|=a[i]^b[i];
 return n===0;
}
function bytesFromHex(hex){
 if(!/^[a-f0-9]{64}$/i.test(hex))return null;
 return new Uint8Array(hex.match(/.{2}/g).map(h=>parseInt(h,16)));
}
async function verifiedSignature(body,header,secret){
 if(!header||!header.startsWith("sha256="))return false;
 const expected=bytesFromHex(header.slice(7));
 if(!expected)return false;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),
  {name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const signature=new Uint8Array(await crypto.subtle.sign("HMAC",key,body));
 return equalBytes(expected,signature);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  const verifyToken=env.META_WEBHOOK_VERIFY_TOKEN;
  const appSecret=env.META_APP_SECRET;
  const pageID=env.META_PAGE_ID;
  if(!verifyToken||!appSecret||!pageID)
   return new Response("Meta webhook is not configured.",{status:503});
  if(request.method==="GET"){
   const good=url.searchParams.get("hub.mode")==="subscribe" &&
    url.searchParams.get("hub.verify_token")===verifyToken;
   const challenge=url.searchParams.get("hub.challenge")||"";
   if(!good||!/^.{1,256}$/.test(challenge))
    return new Response("Verification rejected.",{status:403});
   return new Response(challenge,{status:200,headers:{"Content-Type":"text/plain"}});
  }
  if(request.method!=="POST")return new Response("Method not allowed.",{status:405});
  const data=await request.arrayBuffer();
  if(data.byteLength>100000)return new Response("Payload too large.",{status:413});
  if(!(await verifiedSignature(data,request.headers.get("X-Hub-Signature-256"),appSecret)))
   return new Response("Invalid signature.",{status:403});
  let event;
  try{event=JSON.parse(new TextDecoder().decode(data));}
  catch(_){return new Response("Invalid JSON.",{status:400});}
  if(event.object!=="page"||!Array.isArray(event.entry))
   return new Response("Ignored non-Page update.",{status:200});
  let comments=0,messages=0;
  for(const entry of event.entry){
   if(String(entry.id)!==String(pageID))continue;
   if(Array.isArray(entry.changes))for(const change of entry.changes){
    if(change.field==="feed"&&change.value?.item==="comment"&&change.value?.verb==="add")
     comments++;
   }
   if(Array.isArray(entry.messaging))for(const m of entry.messaging){
    if(m.message&&!m.message.is_echo)messages++;
   }
  }
  if(!comments&&!messages)return new Response("No relevant events.",{status:200});
  if(!env.RESEND_API_KEY||!env.FEEDBACK_ADMIN_EMAIL||!env.FEEDBACK_FROM_EMAIL)
   return new Response("Owner email channel is not configured.",{status:503});
  // This deliberately does not include users' identities or message contents.
  const subject="NextStep Facebook Page: "+comments+" new comment(s), "+messages+" new message(s)";
  try{
   const sent=await fetch("https://api.resend.com/emails",{
    method:"POST",headers:{
     "Authorization":"Bearer "+env.RESEND_API_KEY,
     "Content-Type":"application/json"
    },
    body:JSON.stringify({
     from:env.FEEDBACK_FROM_EMAIL,to:[env.FEEDBACK_ADMIN_EMAIL],
     subject,text:"Your linked Facebook Page has "+comments+" new comment(s) and "+
      messages+" new message(s). Open Meta Business Suite to review them. "+
      "This notification was generated from an authorized Meta Page webhook event."
    })
   });
   if(!sent.ok)return new Response("Email notification failed.",{status:502});
  }catch(_){return new Response("Email provider unavailable.",{status:502});}
  return new Response("Event received.",{status:200});
 }
};
