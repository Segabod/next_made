// Office hours: approved mentor directory, mentor profiles, and session requests.
import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
import { body, db, json, rpc, sameOrigin } from '../../../lib/backend';
export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  try {
    const [mentors, requests] = await Promise.all([
      db('mentors?select=user_id,name,headline,bio,expertise,rate,booking_url,approved,active,updated&order=updated.desc&limit=200'),
      db('mentor_requests?select=id,mentor_id,user_id,requester_name,topic,message,status,reply,created,updated&order=created.desc&limit=200'),
    ]);
    const me = mentors.find((m: any) => m.user_id === u.userId) || null;
    return json({
      me,
      mentors: mentors.filter((m: any) => m.approved && m.active).map((m: any) => ({ ...m, mine: m.user_id === u.userId })),
      sent: requests.filter((r: any) => r.user_id === u.userId).map((r: any) => ({ ...r, mentor: mentors.find((m: any) => m.user_id === r.mentor_id)?.name || 'Mentor' })),
      received: requests.filter((r: any) => r.mentor_id === u.userId),
    });
  } catch {
    return json({ error: 'Office hours are not set up yet. Run supabase/005_discover_pro_growth.sql.' }, 503);
  }
}

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('profile'),
    name: z.string().trim().min(1).max(80),
    headline: z.string().trim().min(1).max(140),
    bio: z.string().max(2000).default(''),
    expertise: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
    rate: z.string().max(80).default(''),
    booking_url: z.union([z.literal(''), z.string().trim().max(300).regex(/^https:\/\/[^\s]+$/)]).default(''),
    active: z.boolean().default(true),
  }),
  z.object({ action: z.literal('request'), mentor: z.string().uuid(), topic: z.string().trim().min(1).max(140), message: z.string().max(2000).default('') }),
  z.object({ action: z.literal('answer'), id: z.string().uuid(), status: z.enum(['accepted', 'declined', 'done']), reply: z.string().max(2000).default('') }),
]);

export async function POST(req: Request) {
  const u = await getChatGPTUser();
  if (!u) return json({ error: 'Please sign in.' }, 401);
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin.' }, 403);
  let b: z.infer<typeof schema>;
  try {
    b = schema.parse(await body(req, 8000));
  } catch {
    return json({ error: 'Check the required fields. Links must start with https://' }, 400);
  }
  try {
    if (b.action === 'profile') {
      const { action, ...p } = b;
      await rpc('save_mentor_profile', { p });
    } else if (b.action === 'request') {
      await rpc('request_mentor', { mentor: b.mentor, req_name: (u.fullName || 'A NextMade member').slice(0, 80), req_topic: b.topic, req_message: b.message });
    } else {
      await rpc('answer_mentor_request', { req: b.id, new_status: b.status, reply_text: b.reply });
    }
    return json({ ok: true });
  } catch {
    return json({ error: b.action === 'request' ? 'Could not send. Free includes 1 request a month and Pro includes 10.' : 'Could not save. Try again.' }, 400);
  }
}
