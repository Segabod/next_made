// Thin helpers around Supabase Auth (GoTrue) endpoints used by sign-up, confirmation and password reset.
import {config,appOriginSetting} from './backend';

export function appOrigin(){return new URL(appOriginSetting()).origin;}

/** Call a Supabase Auth endpoint with the publishable key. `redirectTo` must be allow-listed in Supabase Auth → URL Configuration. */
export async function authCall(path:string,body:unknown,opts:{redirectTo?:string,method?:string,access?:string}={}){
  const {url,key}=config();
  const q=opts.redirectTo?'?redirect_to='+encodeURIComponent(opts.redirectTo):'';
  const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};
  if(opts.access)headers.Authorization='Bearer '+opts.access;
  const r=await fetch(url+'/auth/v1/'+path+q,{method:opts.method||'POST',headers,body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(15000)});
  let data:any=null;try{data=await r.json();}catch{}
  return {ok:r.ok,status:r.status,data,code:String(data?.error_code||data?.code||''),message:String(data?.msg||data?.message||data?.error_description||'')};
}

/** Supabase answers password-policy failures with this code; surface its message so people know what to fix. */
export function passwordProblem(res:{code:string,message:string}){return res.code==='weak_password'||/password/i.test(res.message)?res.message||'Choose a stronger password.':'';}
