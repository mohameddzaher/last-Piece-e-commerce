'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import { referralAPI } from '@/utils/endpoints';
import { fmtMoney, fmtDate } from '@/utils/format';

export default function AdminReferrals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    referralAPI.getAll()
      .then((r) => setRows(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="font-mono font-bold text-xs">{r.code}</span>, exportValue: (r) => r.code },
    { key: 'referrer', label: 'Referrer', render: (r) => r.referrer ? `${r.referrer.firstName} ${r.referrer.lastName}` : '—', exportValue: (r) => r.referrer?.firstName },
    { key: 'totalInvited', label: 'Invited', accessor: (r) => r.totalInvited || 0 },
    { key: 'totalConverted', label: 'Converted', accessor: (r) => r.totalConverted || 0 },
    { key: 'totalEarned', label: 'Earned', render: (r) => fmtMoney(r.totalEarned, r.currency), exportValue: (r) => r.totalEarned },
    { key: 'isActive', label: 'Active', render: (r) => r.isActive ? 'Yes' : 'No', exportValue: (r) => r.isActive },
    { key: 'createdAt', label: 'Since', render: (r) => fmtDate(r.createdAt), exportValue: (r) => r.createdAt },
  ];

  return (
    <AdminLayout title="Referrals" requiredRoles={['super-admin', 'admin']}>
      <p className="text-xs text-slate-500 mb-4">
        Each customer gets a personal referral code. Track invitations, conversions, and rewards paid.
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['code']}
        exportFilename="referrals"
        emptyMessage={loading ? 'Loading...' : 'No referrals yet.'}
      />
    </AdminLayout>
  );
}
