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
    const { action, email, userId, staffRole, password, fullName } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ---- SETUP: one-time super admin creation (no auth required) ----
    if (action === "setup") {
      // Check if a super_admin already exists
      const { data: existingAdmin } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")
        .eq("staff_role", "super_admin")
        .maybeSingle();

      if (existingAdmin) {
        return json({ error: "A super admin already exists. Use the staff login instead." }, 400);
      }

      if (!email || !password) {
        return json({ error: "Email and password are required" }, 400);
      }

      // Create the auth user
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || "Super Admin" },
      });

      if (createErr) return json({ error: createErr.message }, 500);

      // Set their profile to admin + super_admin + approved
      const { error: profileErr } = await supabase
        .from("users")
        .update({
          role: "admin",
          staff_role: "super_admin",
          admin_approval_status: "approved",
          full_name: fullName || "Super Admin",
        })
        .eq("id", newUser.user.id);

      if (profileErr) return json({ error: profileErr.message }, 500);

      // Also set the auth metadata
      await supabase.auth.admin.updateUserById(newUser.user.id, {
        user_metadata: { full_name: fullName || "Super Admin", role: "admin" },
      });

      return json({ success: true, email, message: "Super admin account created. You can now log in at /admin/login" });
    }

    // ---- All other actions require super_admin auth ----
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: caller } = await supabase
      .from("users")
      .select("role, staff_role, admin_approval_status")
      .eq("id", user.id)
      .single();

    if (!caller || caller.role !== "admin" || caller.staff_role !== "super_admin") {
      return json({ error: "Only super admins can manage staff" }, 403);
    }

    if (action === "invite") {
      if (!email) return json({ error: "Email is required" }, 400);

      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u: any) => u.email === email);

      if (existingUser) {
        await supabase
          .from("users")
          .update({ staff_role: staffRole || "support", updated_date: new Date().toISOString() })
          .eq("id", existingUser.id);
        return json({ success: true, userUpdated: true, userId: existingUser.id });
      }

      const tempPassword = Math.random().toString(36).slice(2) + "Aa1!";
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: email.split("@")[0] },
      });

      if (createErr) return json({ error: createErr.message }, 500);

      await supabase
        .from("users")
        .update({
          role: "admin",
          staff_role: staffRole || "support",
          admin_approval_status: "pending",
          updated_date: new Date().toISOString(),
        })
        .eq("id", newUser.user.id);

      return json({ success: true, userUpdated: false, userId: newUser.user.id, tempPassword });
    }

    if (action === "promote") {
      if (!userId) return json({ error: "userId is required" }, 400);
      await supabase
        .from("users")
        .update({ role: "admin", admin_approval_status: "pending", updated_date: new Date().toISOString() })
        .eq("id", userId);
      return json({ success: true });
    }

    if (action === "updateRole") {
      if (!userId || !staffRole) return json({ error: "userId and staffRole are required" }, 400);
      await supabase
        .from("users")
        .update({ staff_role: staffRole, updated_date: new Date().toISOString() })
        .eq("id", userId);
      return json({ success: true });
    }

    if (action === "approve") {
      if (!userId) return json({ error: "userId is required" }, 400);
      await supabase
        .from("users")
        .update({ admin_approval_status: "approved", updated_date: new Date().toISOString() })
        .eq("id", userId);
      return json({ success: true });
    }

    if (action === "reject") {
      if (!userId) return json({ error: "userId is required" }, 400);
      await supabase
        .from("users")
        .update({ admin_approval_status: "rejected", role: "user", staff_role: null, updated_date: new Date().toISOString() })
        .eq("id", userId);
      return json({ success: true });
    }

    if (action === "deactivate") {
      if (!userId) return json({ error: "userId is required" }, 400);
      await supabase
        .from("users")
        .update({ role: "user", staff_role: null, admin_approval_status: null, updated_date: new Date().toISOString() })
        .eq("id", userId);
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
