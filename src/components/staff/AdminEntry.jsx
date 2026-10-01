import { Link } from 'react-router-dom';
import { LayoutDashboard, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isStaffRole } from '@/lib/staffRoles';

export default function AdminEntry({ compact = false }) {
  const { user } = useAuth();
  if (!isStaffRole(user?.role)) return null;
  return <Link to="/admin" className={compact
    ? 'mt-2 flex w-fit items-center gap-1.5 ml-auto text-xs font-semibold text-primary py-1'
    : 'flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground'}>
    <LayoutDashboard className={compact ? 'h-4 w-4' : 'h-5 w-5 text-primary'} />
    <span className="flex-1 font-semibold">Admin Dashboard</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </Link>;
}