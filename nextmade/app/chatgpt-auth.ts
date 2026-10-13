// Kept as a compatibility interface for the original UI. Identity comes exclusively from Supabase.
import {safeReturn} from '../lib/access';
import {redirect} from 'next/navigation';
import {backend,configured,db,token} from '../lib/backend';
export type ChatGPTUser={userId:string,displayName:string,email:string,fullName:string|null};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{if(!configured())return null;const access=await token();if(!access)return null;try{const r=await backend('/auth/v1/user',{},access);const u=await r.json();const allowed=await db('pilot_access?select=user_id&user_id=eq.'+encodeURIComponent(u.id),'GET',undefined,access);if(!allowed?.length)return null;const name=String(u.user_metadata?.full_name||u.user_metadata?.name||'');return {userId:u.id,email:u.email||'',fullName:name||null,displayName:name||u.email||'Member'};}catch{return null;}}
export async function requireChatGPTUser(returnTo:string){const u=await getChatGPTUser();if(u)return u;redirect('/login?next='+encodeURIComponent(safeReturn(returnTo)));}
