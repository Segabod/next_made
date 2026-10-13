import {requireChatGPTUser} from '../chatgpt-auth';
import Platform from '../platform';
export const dynamic='force-dynamic';
export default async function WorkspacePage(){const user=await requireChatGPTUser('/workspace');return <Platform displayName={user.fullName||''}/>;}
