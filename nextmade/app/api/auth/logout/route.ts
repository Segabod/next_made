import {cookies} from 'next/headers';import {backend,json,sameOrigin,SESSION} from '../../../../lib/backend';
export async function POST(req:Request){if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);try{await backend('/auth/v1/logout',{method:'POST'});}catch{}(await cookies()).delete(SESSION);return json({ok:true});}
