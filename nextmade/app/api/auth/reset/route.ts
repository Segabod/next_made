import {z} from 'zod';import {body,configured,json,sameOrigin} from '../../../../lib/backend';import {authCall,passwordProblem} from '../../../../lib/auth-api';
export const dynamic='force-dynamic';
// Sets a new password using the short-lived recovery token from the reset email link.
export async function POST(req:Request){
  if(!configured())return json({error:'Password reset is awaiting deployment configuration.'},503);
  if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);
  let b;try{b=z.object({token:z.string().min(20).max(4000),password:z.string().min(8).max(72)}).parse(await body(req,6000));}catch{return json({error:'Choose a password of at least 8 characters.'},400);}
  try{
    const r=await authCall('user',{password:b.password},{method:'PUT',access:b.token});
    if(r.ok){try{await authCall('logout',{}, {access:b.token});}catch{}return json({ok:true});}
    if(r.status===401||r.status===403)return json({error:'This reset link has expired. Request a new one.'},401);
    if(r.code==='same_password')return json({error:'Choose a password different from your current one.'},400);
    const pw=passwordProblem(r);if(pw)return json({error:pw},400);
    return json({error:'We could not update your password. Request a new link and try again.'},502);
  }catch{return json({error:'The password service is unavailable. Please try again.'},503);}
}
