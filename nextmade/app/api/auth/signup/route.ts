import {cookies} from 'next/headers';import {z} from 'zod';import {body,configured,db,json,sameOrigin,SESSION} from '../../../../lib/backend';import {appOrigin,authCall,passwordProblem} from '../../../../lib/auth-api';
export const dynamic='force-dynamic';
export async function POST(req:Request){
  if(!configured())return json({error:'Sign-up is awaiting deployment configuration.'},503);
  if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);
  let b;try{b=z.object({name:z.string().trim().min(1).max(80),email:z.string().trim().toLowerCase().email().max(254),password:z.string().min(8).max(72)}).parse(await body(req,2000));}
  catch{return json({error:'Enter your name, a valid email and a password of at least 8 characters.'},400);}
  try{
    const r=await authCall('signup',{email:b.email,password:b.password,data:{full_name:b.name}},{redirectTo:appOrigin()+'/login?confirmed=1'});
    if(r.ok){
      // With "Confirm email" turned off in Supabase, sign-up returns a session: sign the member straight in.
      const t=r.data?.access_token;
      if(t){
        try{
          const rows=await db('pilot_access?select=user_id&user_id=eq.'+encodeURIComponent(r.data.user?.id||''),'GET',undefined,t);
          if(rows?.length){(await cookies()).set(SESSION,t,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:Math.min(r.data.expires_in||3600,3600)});return json({ok:true,signedIn:true});}
        }catch{}
        return json({ok:true,signedIn:false,confirm:false});
      }
      return json({ok:true,signedIn:false,confirm:true});
    }
    if(r.status===429||r.code==='over_email_send_rate_limit')return json({error:'Too many sign-up emails were sent just now. Please wait a few minutes and try again.'},429);
    if(r.code==='signup_disabled')return json({error:'New sign-ups are currently closed.'},403);
    if(r.code==='user_already_exists'||r.code==='email_exists')return json({error:'An account with this email already exists. Sign in or reset your password.'},409);
    const pw=passwordProblem(r);if(pw)return json({error:pw},400);
    console.error('signup failed',r.status,r.code,r.message);
    return json({error:'We could not create your account. Please try again.'},502);
  }catch{return json({error:'The sign-up service is unavailable. Please try again.'},503);}
}
