import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, email, userId, staffRole } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is an approved super_admin
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: callerProfile } = await supabase
      .from("users")
      .select("role, staff_role, admin_approval_status")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.staff_role !== "super_admin" || callerProfile.admin_approval_status !== "approved") {
      return json({ error: "Only approved super admins can manage staff" }, 403);
    }

    if (action === "invite") {
      // Invite a new staff member by email
      if (!email) return json({ error: "Email is required" }, 400);

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

      let targetUserId: string;

      if (existingUser) {
        targetUserId = existingUser.id;
        // User exists — set their staff_role
        const { error: rpcErr } = await supabase.rpc("promote_staff", {
          p_target_user_id: targetUserId,
          p_action: "invite",
          p_staff_role: staffRole || "support",
        });
        if (rpcErr) return json({ error: rpcErr.message }, 500);

        return json({ success: true, userUpdated: true, userId: targetUserId });
      } else {
        // User doesn't exist — create them with a temp password
        const tempPassword = Math.random().toString(36).slice(2) + "Aa1!";
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: email.split("@")[0] },
        });

        if (createErr) return json({ error: createErr.message }, 500);
        targetUserId = newUser.user.id;

        // Set their role to admin with pending approval
        const { error: rpcErr } = await supabase.rpc("promote_staff", {
          p_target_user_id: targetUserId,
          p_action: "promote",
          p_staff_role: staffRole || "support",
        });
        if (rpcErr) return json({ error: rpcErr.message }, 500);

        return json({ success: true, userUpdated: false, userId: targetUserId, tempPassword });
      }
    }

    if (action === "promote") {
      if (!userId) return json({ error: "userId is required" }, 400);
      const { error: rpcErr } = await supabase.rpc("promote_staff", {
        p_target_user_id: userId,
        p_action: "promote",
      });
      if (rpcErr) return json({ error: rpcErr.message }, 500);
      return json({ success: true });
    }

    if (action === "updateRole") {
      if (!userId) return json({ error: "userId is required" }, 400);
      const { error: rpcErr } = await supabase.rpc("promote_staff", {
        p_target_user_id: userId,
        p_action: "updateRole",
        p_staff_role: staffRole,
      });
      if (rpcErr) return json({ error: rpcErr.message }, 500);
      return json({ success: true });
    }

    if (action === "approve") {
      if (!userId) return json({ error: "userId is required" }, 400);
      const { error: rpcErr } = await supabase.rpc("promote_staff", {
        p_target_user_id: userId,
        p_action: "approve",
      });
      if (rpcErr) return json({ error: rpcErr.message }, 500);
      return json({ success: true });
    }

    if (action === "reject") {
      if (!userId) return json({ error: "userId is required" }, 400);
      const { error: rpcErr } = await supabase.rpc("promote_staff", {
        p_target_user_id: userId,
        p_action: "reject",
      });
      if (rpcErr) return json({ error: rpcErr.message }, 500);
      return json({ success: true });
    }

    if (action === "deactivate") {
      if (!userId) return json({ error: "userId is required" }, 400);
      const { error: rpcErr } = await supabase.rpc("promote_staff", {
        p_target_user_id: userId,
        p_action: "deactivate",
      });
      if (rpcErr) return json({ error: rpcErr.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Unknown action: " + action }, 400);
  } catch (err) {
    return json({ error: err.message || "Internal server error" }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
