import {serve} from 'https://deno.land/std@0.224.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.79.0';

// Deploy with JWT verification enabled. Never put SUPABASE_SERVICE_ROLE_KEY in Expo.
serve(async(request)=>{
  const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{
    status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
  });
  if(request.method!=='POST')return json(405,{error:'Method not allowed'});
  const jwt=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!jwt)return json(401,{error:'Authentication required'});
  const url=Deno.env.get('SUPABASE_URL');
  const anon=Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!anon||!serviceRole)return json(503,{error:'Server configuration incomplete'});
  try{
    const body=await request.json();
    if(body?.confirm!=='DELETE MY ACCOUNT')return json(400,{error:'Explicit confirmation required'});
    const authClient=createClient(url,anon,{auth:{persistSession:false}});
    const {data,error}=await authClient.auth.getUser(jwt);
    if(error||!data.user)return json(401,{error:'Invalid session'});
    const admin=createClient(url,serviceRole,{auth:{persistSession:false}});
    // Study backups cascade-delete via auth.users foreign key.
    const {error:deleteError}=await admin.auth.admin.deleteUser(data.user.id);
    if(deleteError)return json(500,{error:'Account deletion failed'});
    return json(200,{deleted:true});
  }catch{
    return json(400,{error:'Invalid request'});
  }
});
