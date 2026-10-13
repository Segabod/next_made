import {z} from 'zod';import {body,configured,json,sameOrigin} from '../../../../lib/backend';import {appOrigin,authCall} from '../../../../lib/auth-api';
export const dynamic='force-dynamic';
// Re-sends the confirmation email. Always answers the same way so it cannot be used to discover accounts.
export async function POST(req:Request){
  if(!configured())return json({error:'Email is awaiting deployment configuration.'},503);
  if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);
  let b;try{b=z.object({email:z.string().trim().toLowerCase().email().max(254)}).parse(await body(req,1000));}catch{return json({error:'Enter a valid email.'},400);}
  try{const r=await authCall('resend',{type:'signup',email:b.email},{redirectTo:appOrigin()+'/login?confirmed=1'});if(r.status===429)return json({error:'Please wait a minute before requesting another email.'},429);}catch{}
  return json({ok:true});
}
