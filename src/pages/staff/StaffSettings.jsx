import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { STAFF_ROLES, getRoleLabel } from '@/lib/staffRoles';
import { logStaffAction } from '@/lib/staffAudit';
import {
  Loader2, UserPlus, Shield, Mail, RefreshCw, Trash2, AlertCircle,
} from 'lucide-react';

const STAFF_ROLE_OPTIONS = [
  { value: 'staff_admin', label: 'Staff Admin' },
  { value: 'operations', label: 'Operations' },
  { value: 'content', label: 'Content' },
  { value: 'support', label: 'Support' },
];

export default function StaffSettings() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'admin';
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('support');
  const [inviting, setInviting] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadStaff();
      loadAuditLogs();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const loadStaff = async () => {
    try {
      const list = await base44.entities.User.list();
      const staffOnly = list.filter(
        (u) => ['admin', 'staff_admin', 'operations', 'content', 'support'].includes(u.role)
      );
      setStaff(staffOnly);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      await logStaffAction('staff_invited', {
        entity_type: 'User', record_name: inviteEmail.trim(),
        new_value: inviteRole,
      });
      setInviteEmail('');
      alert(`Invitation sent to ${inviteEmail.trim()} as ${getRoleLabel(inviteRole)}`);
      loadStaff();
    } catch (err) {
      alert('Failed to invite: ' + (err.message || 'Unknown error'));
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (s, newRole) => {
    try {
      await base44.entities.User.update(s.id, { role: newRole });
      await logStaffAction('staff_role_changed', {
        entity_type: 'User', record_id: s.id, record_name: s.email,
        previous_value: s.role, new_value: newRole,
      });
      setStaff((prev) => prev.map((x) => (x.id === s.id ? { ...x, role: newRole } : x)));
    } catch (e) {
      alert('Failed to change role');
    }
  };

  const deactivate = async (s) => {
    if (!confirm(`Remove staff access for ${s.email}? They will become a regular customer.`)) return;
    try {
      await base44.entities.User.update(s.id, { role: 'user' });
      await logStaffAction('staff_deactivated', {
        entity_type: 'User', record_id: s.id, record_name: s.email,
        previous_value: s.role, new_value: 'user',
      });
      setStaff((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      alert('Failed to deactivate staff');
    }
  };

  if (!isSuperAdmin) {
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
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#2E7D32]" /> Invite New Staff Member
        </h3>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="staff@example.com"
            className="flex-1 min-w-[200px] h-10 px-3 text-sm rounded-lg border border-gray-200 outline-none focus:border-[#2E7D32]"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="h-10 text-sm rounded-lg border border-gray-200 px-3 outline-none focus:border-[#2E7D32]"
          >
            {STAFF_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="h-10 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-bold disabled:opacity-50"
          >
            {inviting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
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
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.full_name || s.email?.split('@')[0]}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3">
                      {s.role === 'admin' ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Super Admin
                        </span>
                      ) : (
                        <select
                          value={s.role}
                          onChange={(e) => changeRole(s, e.target.value)}
                          className="text-xs rounded border border-gray-200 px-2 py-1 outline-none focus:border-[#2E7D32]"
                        >
                          {STAFF_ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.role !== 'admin' && (
                        <button
                          onClick={() => deactivate(s)}
                          className="text-red-500 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                          title="Remove staff access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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