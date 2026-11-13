import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { STAFF_ROLE_OPTIONS, getRoleLabel, isSuperAdmin, resolveStaffRole } from '@/lib/staffRoles';
import { logStaffAction } from '@/lib/staffAudit';
import {
  Loader2, UserPlus, Shield, Mail, RefreshCw, Trash2, AlertCircle, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import SheetSelect from '@/components/SheetSelect';

export default function StaffSettings() {
  const { user } = useAuth();
  const canManageStaff = isSuperAdmin(user);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('support');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (canManageStaff) {
      loadStaff();
      loadAuditLogs();
    } else {
      setLoading(false);
    }
  }, [canManageStaff]);

  const loadStaff = async () => {
    try {
      const list = await base44.entities.User.list();
      // Staff have Base44 role = "admin". Also show users who have a staffRole
      // set but role is still "user" — these are broken records that need promotion.
      const staffOnly = list.filter((u) => u.role === 'admin' || u.staffRole);
      setStaff(staffOnly);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const promote = async (s) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('manage_staff', {
        p_action: 'promote',
        p_user_id: s.id,
      });
      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);
      loadStaff();
    } catch (err) {
      alert(err.message || 'Failed to promote staff');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await base44.entities.StaffAuditLog.filter(
        {},
        { sort: '-created_date', limit: 20 }
      );
      setAuditLogs(res.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('manage_staff', {
        p_action: 'invite',
        p_email: inviteEmail.trim(),
        p_staff_role: inviteRole,
      });
      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);
      if (data.userUpdated) {
        setInviteMsg(`Invited ${inviteEmail.trim()} as ${getRoleLabel(inviteRole)}. Their existing account was updated.`);
      } else {
        const pass = data.tempPassword ? ` Temporary password: ${data.tempPassword}` : '';
        setInviteMsg(`Invited ${inviteEmail.trim()} as ${getRoleLabel(inviteRole)}.${pass}`);
      }
      setInviteEmail('');
      loadStaff();
    } catch (err) {
      setInviteMsg(`Failed to invite: ${err.message || 'Unknown error'}`);
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (s, newStaffRole) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('manage_staff', {
        p_action: 'updateRole',
        p_user_id: s.id,
        p_staff_role: newStaffRole,
      });
      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);
      setStaff((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, staffRole: newStaffRole } : x))
      );
    } catch (err) {
      alert(err.message || 'Failed to change role');
    }
  };

  const approveAdmin = async (s) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('manage_staff', {
        p_action: 'approve',
        p_user_id: s.id,
      });
      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);
      setStaff((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, admin_approval_status: 'approved' } : x))
      );
    } catch (err) {
      alert(err.message || 'Failed to approve admin');
    }
  };

  const rejectAdmin = async (s) => {
    if (!confirm(`Reject admin access for ${s.email}? They will be demoted to a regular customer.`)) return;
    try {
      const { data, error: rpcError } = await supabase.rpc('manage_staff', {
        p_action: 'reject',
        p_user_id: s.id,
      });
      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);
      setStaff((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      alert(err.message || 'Failed to reject admin');
    }
  };

  const deactivate = async (s) => {
    if (!confirm(`Remove staff access for ${s.email}? They will become a regular customer.`)) return;
    try {
      const { data, error: rpcError } = await supabase.rpc('manage_staff', {
        p_action: 'deactivate',
        p_user_id: s.id,
      });
      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);
      setStaff((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      alert(err.message || 'Failed to deactivate staff');
    }
  };

  if (!canManageStaff) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Super Admin Only</h2>
        <p className="text-sm text-gray-500">Staff management requires Super Admin access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Staff management & audit log</p>
        <Link to="/admin/settings/notifications" className="mt-2 inline-block text-sm text-primary underline">Notification Settings & Deal Broadcasts</Link>
      </div>

      {/* Invite Staff */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#2E7D32]" /> Invite New Staff Member
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Staff are invited with Base44 role "admin" and a separate Ukart staff role that controls their dashboard access.
        </p>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="staff@example.com"
            className="flex-1 min-w-[200px] h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
          <SheetSelect
            value={inviteRole}
            onChange={setInviteRole}
            title="Staff role"
            triggerClassName="h-10 flex items-center justify-between text-sm rounded-lg border border-gray-200 px-3 bg-white"
            options={STAFF_ROLE_OPTIONS}
          />
          <button
            type="submit"
            disabled={inviting}
            className="h-10 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold disabled:opacity-50"
          >
            {inviting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
        {inviteMsg && (
          <div className={`mt-3 text-sm rounded-lg p-3 ${inviteMsg.startsWith('Failed')
            ? 'bg-red-50 text-red-600'
            : 'bg-green-50 text-green-700'}`}>
            {inviteMsg}
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Staff Members ({staff.length})</h3>
          <button onClick={loadStaff} className="p-1.5 rounded hover:bg-gray-100">
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Staff Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((s) => {
                  const sRole = resolveStaffRole(s);
                  const isSelf = s.id === user?.id;
                  const isSuper = sRole === 'super_admin';
                  const needsPromotion = s.role !== 'admin';
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50 ${needsPromotion ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.full_name || s.email?.split('@')[0]}
                        {isSelf && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
                        {needsPromotion && (
                          <span className="ml-2 text-xs text-amber-600 font-medium">⚠ Role not promoted</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.email}</td>
                      <td className="px-4 py-3">
                        {isSuper ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Super Admin
                          </span>
                        ) : !s.staffRole ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-600 font-medium">Unassigned</span>
                            <SheetSelect
                              value=""
                              onChange={(v) => changeRole(s, v)}
                              title="Assign role"
                              placeholder="Assign role…"
                              triggerClassName="text-xs flex items-center justify-between rounded border border-gray-200 px-2 py-1 bg-white"
                              options={STAFF_ROLE_OPTIONS.filter((r) => r.value !== 'super_admin')}
                            />
                          </div>
                        ) : (
                          <SheetSelect
                            value={s.staffRole}
                            onChange={(v) => changeRole(s, v)}
                            title="Staff role"
                            triggerClassName="text-xs flex items-center justify-between rounded border border-gray-200 px-2 py-1 bg-white"
                            options={STAFF_ROLE_OPTIONS.filter((r) => r.value !== 'super_admin')}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const status = s.admin_approval_status;
                          if (isSuper || status === 'approved' || (!status && !needsPromotion)) {
                            return (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            );
                          }
                          if (status === 'pending') {
                            return (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            );
                          }
                          if (status === 'rejected') {
                            return (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            );
                          }
                          return (
                            <span className="text-xs text-gray-400">—</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {needsPromotion && (
                            <button
                              onClick={() => promote(s)}
                              className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-2.5 py-1 rounded"
                              title="Promote Base44 role to admin"
                            >
                              Promote
                            </button>
                          )}
                          {s.admin_approval_status === 'pending' && !needsPromotion && (
                            <button
                              onClick={() => approveAdmin(s)}
                              className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-2.5 py-1 rounded"
                              title="Approve admin access"
                            >
                              Approve
                            </button>
                          )}
                          {s.admin_approval_status === 'pending' && !needsPromotion && (
                            <button
                              onClick={() => rejectAdmin(s)}
                              className="text-xs font-bold text-red-600 border border-red-300 hover:bg-red-50 px-2.5 py-1 rounded"
                              title="Reject admin access"
                            >
                              Reject
                            </button>
                          )}
                          {!isSuper && !needsPromotion && s.admin_approval_status !== 'pending' && (
                            <button
                              onClick={() => deactivate(s)}
                              className="text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                              title="Remove staff access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500" /> Recent Staff Activity
          </h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">No activity logged</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(log.created_date).toLocaleString('en-NG')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="font-medium">{log.staff_name}</span>
                  {log.record_name && ` · ${log.record_name}`}
                  {log.previous_value && ` · ${log.previous_value} → ${log.new_value}`}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}