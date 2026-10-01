import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// TEMPORARY diagnostic: records the auth context the workflow runtime provides
// when it invokes a backend function, by writing it to a StaffAuditLog record
// that can be read afterwards. Will be deleted after the diagnostic.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let isAuthenticated = false;
    try { isAuthenticated = await base44.auth.isAuthenticated(); } catch (e) {}
    let user: any = null;
    try { user = await base44.auth.me(); } catch (e) {}
    const hasUserAuth = !!req.headers.get('authorization');
    const hasServiceAuth = !!req.headers.get('base44-service-authorization');
    const ctx = {
      isAuthenticated,
      hasUser: !!user,
      userRole: user?.role || null,
      userId: user?.id || null,
      hasUserAuthHeader: hasUserAuth,
      hasServiceAuthHeader: hasServiceAuth,
      ts: new Date().toISOString(),
    };
    // Persist so we can read it after the run
    await base44.asServiceRole.entities.StaffAuditLog.create({
      action: 'workflow_auth_probe',
      entity_type: 'diagnostic',
      details: JSON.stringify(ctx),
      staff_name: 'workflow-runtime-probe',
    });
    return Response.json(ctx);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}