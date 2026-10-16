// Connect your AI: MCP endpoint. Clients send the member's key as "Authorization: Bearer nm_...".
import { handleMcp } from '../../../lib/mcp';
export const dynamic = 'force-dynamic';
const keyFrom = (req: Request) => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim() || null;
export const POST = (req: Request) => handleMcp(req, keyFrom(req));
export const GET = (req: Request) => handleMcp(req, keyFrom(req));
export const OPTIONS = (req: Request) => handleMcp(req, null);
