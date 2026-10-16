// Privileged Supabase access for scheduled jobs ONLY (reminders and weekly letters).
// Member-facing routes never use this: they act with the signed-in member's own token so row-level security applies.
// Never import this file into a page, a client component or a member-facing route.
import { config } from './backend';

function adminKey() {
  const k = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error('Scheduled jobs need SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).');
  return k;
}
async function admin(path: string) {
  const { url } = config();
  const key = adminKey();
  const headers: Record<string, string> = { apikey: key };
  // Legacy service-role keys are JWTs and also go in the Authorization header; new sb_secret_ keys only use apikey.
  if (key.split('.').length === 3) headers.Authorization = 'Bearer ' + key;
  const r = await fetch(url + path, { headers, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Supabase admin request failed (${r.status}) for ${path.split('?')[0]}`);
  return r.json();
}
export const adminReady = () => !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Members who have workspace access, with their email and saved workspace. */
export async function membersWithWorkspaces() {
  const [access, workspaces] = await Promise.all([
    admin('/rest/v1/pilot_access?select=user_id'),
    admin('/rest/v1/workspaces?select=user_id,data'),
  ]);
  const allowed = new Set((access as any[]).map((a) => a.user_id));
  const users: Record<string, { email: string; name: string; confirmed: boolean }> = {};
  for (let page = 1; page <= 50; page++) {
    const r: any = await admin(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const list = r.users || [];
    for (const u of list)
      users[u.id] = { email: u.email || '', name: String(u.user_metadata?.full_name || ''), confirmed: !!u.email_confirmed_at };
    if (list.length < 200) break;
  }
  return (workspaces as any[])
    .filter((w) => allowed.has(w.user_id) && users[w.user_id]?.email && users[w.user_id].confirmed)
    .map((w) => ({ userId: w.user_id as string, email: users[w.user_id].email, name: users[w.user_id].name, data: w.data }));
}

/** Privileged write for scheduled jobs only (the daily catalog entries). */
export async function adminWrite(path: string, method: string, body: unknown) {
  const { url } = config();
  const key = adminKey();
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  if (key.split('.').length === 3) headers.Authorization = 'Bearer ' + key;
  const r = await fetch(url + path, { method, headers, body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Supabase admin write failed (${r.status}) for ${path.split('?')[0]}: ${(await r.text().catch(() => '')).slice(0, 300)}`);
  return r.status === 204 ? null : r.json();
}
export async function adminRead(path: string) {
  return admin(path);
}
