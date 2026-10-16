// Connect your AI: the same MCP endpoint for clients that only accept a URL (the key is part of the path).
// Treat this URL like a password; revoke the key in NextMade if it is ever shared.
import { handleMcp } from '../../../../lib/mcp';
export const dynamic = 'force-dynamic';
type P = { params: Promise<{ key: string }> };
export const POST = async (req: Request, { params }: P) => handleMcp(req, (await params).key);
export const GET = async (req: Request, { params }: P) => handleMcp(req, (await params).key);
export const OPTIONS = (req: Request) => handleMcp(req, null);
