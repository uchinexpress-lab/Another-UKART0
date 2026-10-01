import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// TEMPORARY diagnostic: reports the auth context the workflow runtime provides
// when it invokes a backend function. Used to decide how processBirthdayRewards
// should authenticate scheduled calls without hardcoding a secret in the
// workflow JSON. Will be deleted after the diagnostic run.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let isAuthenticated = false;
    try { isAuthenticated = await base44.auth.isAuthenticated(); } catch (e) {}
    let user: any = null;
    try { user = await base44.auth.me(); } catch (e) {}
    const headers: Record<string, string> = {};
    req.headers.forEach((value: string, key: string) => {
      headers[key] = key.toLowerCase().startsWith('auth') || key.toLowerCase().includes('token') || key.toLowerCase().includes('base44') ? value.slice(0, 20) + '…' : value;
    });
    return Response.json({
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role || null,
      userId: user?.id || null,
      headerKeys: Object.keys(headers),
      hasAuthorization: !!req.headers.get('authorization'),
      hasBase44Token: !!req.headers.get('x-base44-token'),
      method: req.method,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}