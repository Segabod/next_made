import {originMatches} from './access';
import {cookies} from 'next/headers';
export const SESSION='nextmade_session';
export function configured(){return !!(process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY&&process.env.APP_ORIGIN);}
export function config(){if(!configured())throw new Error('NextMade needs its Supabase and application origin configuration.');const url=new URL(process.env.SUPABASE_URL!);if(url.protocol!=='https:')throw new Error('Supabase must use HTTPS.');return {url:url.origin,key:process.env.SUPABASE_PUBLISHABLE_KEY!};}
export async function token(){return (await cookies()).get(SESSION)?.value;}
export async function backend(path:string,init:RequestInit={},access?:string){const {url,key}=config();const t=access??await token();const headers=new Headers(init.headers);headers.set('apikey',key);if(t)headers.set('Authorization','Bearer '+t);const r=await fetch(url+path,{...init,headers,cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok){const e=new Error('The saved-data service could not complete this request.');(e as any).status=r.status;throw e;}return r;}
export async function db(path:string,method='GET',body?:unknown,access?:string){const r=await backend('/rest/v1/'+path,{method,headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)},access);return r.status===204?null:r.json();}
export async function rpc(name:string,body:unknown={}){return db('rpc/'+name,'POST',body);}
export function sameOrigin(req:Request){return originMatches(req.headers.get('origin'),process.env.APP_ORIGIN);}
export const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function body(req:Request,max:number){const raw=await req.text();if(raw.length>max)throw new Error('Request is too large.');return JSON.parse(raw);}
