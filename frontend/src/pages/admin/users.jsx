'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { adminAPI } from '@/utils/endpoints';
import { fmtDate, roleLabel } from '@/utils/format';
import { FiUserX, FiUserCheck, FiTrash2 } from 'react-icons/fi';

const ROLE_BADGE = {
  'super-admin': 'bg-rose-500/10 text-rose-600 border-rose-500/30',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  'saudi-staff': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  'egypt-staff': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  customer: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
};

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await adminAPI.getUsers({ limit: 500 });
      setRows(res.data.data || res.data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const changeRole = async (userId, role) => {
    try {
      await adminAPI.updateUserRole(userId, role);
      toast.success('Role updated');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const toggleBlock = async (userId) => {
    try {
      await adminAPI.blockUser(userId);
      toast.success('Updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const del = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    {
      key: 'name', label: 'Name',
      render: (r) => (
        <div>
          <div className="font-semibold text-xs">{r.firstName} {r.lastName}</div>
          <div className="text-[10px] text-slate-500">{r.email}</div>
        </div>
      ),
      exportValue: (r) => `${r.firstName} ${r.lastName}`,
    },
    {
      key: 'role', label: 'Role',
      render: (r) => (
        <select
          value={r.role}
          onChange={(e) => changeRole(r._id, e.target.value)}
          className={`px-2 py-1 text-[10px] rounded-full font-semibold border ${ROLE_BADGE[r.role] || ''} bg-transparent cursor-pointer`}
        >
          <option value="super-admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="saudi-staff">Saudi Staff</option>
          <option value="egypt-staff">Egypt Staff</option>
          <option value="customer">Customer</option>
        </select>
      ),
      exportValue: (r) => roleLabel(r.role),
    },
    { key: 'workLocation', label: 'Location', render: (r) => r.workLocation || '—', exportValue: (r) => r.workLocation || '' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—', exportValue: (r) => r.phone || '' },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium border ${
          r.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
        }`}>{r.status}</span>
      ),
      exportValue: (r) => r.status,
    },
    { key: 'createdAt', label: 'Joined', render: (r) => fmtDate(r.createdAt), exportValue: (r) => r.createdAt },
    {
      key: 'actions', label: '',
      render: (r) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); toggleBlock(r._id); }}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title={r.status === 'active' ? 'Block' : 'Unblock'}
          >
            {r.status === 'active' ? <FiUserX size={12} /> : <FiUserCheck size={12} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); del(r._id); }}
            className="p-1.5 rounded hover:bg-rose-500/10 text-rose-500"
            title="Delete"
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      ),
      exportValue: () => '',
    },
  ];

  return (
    <AdminLayout title="Team & Customers">
      <p className="text-xs text-slate-500 mb-4">
        Super-admins can change roles, block, or remove users. Be careful — these changes apply instantly.
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['firstName', 'lastName', 'email', 'phone']}
        exportFilename="users"
        emptyMessage={loading ? 'Loading...' : 'No users yet.'}
      />
    </AdminLayout>
  );
}
