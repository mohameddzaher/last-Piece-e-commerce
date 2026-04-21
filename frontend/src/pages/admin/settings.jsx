'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import { useAuthStore } from '@/store';
import { fmtDate } from '@/utils/format';

export default function AdminSettings() {
  const { user } = useAuthStore();
  return (
    <AdminLayout title="Settings">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your profile</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-500">Name: </span>{user?.firstName} {user?.lastName}</div>
            <div><span className="text-slate-500">Email: </span>{user?.email}</div>
            <div><span className="text-slate-500">Role: </span>{user?.role}</div>
            <div><span className="text-slate-500">Joined: </span>{fmtDate(user?.createdAt)}</div>
          </div>
        </section>
        <hr className="border-slate-200 dark:border-slate-800" />
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick links</h3>
          <ul className="mt-2 text-xs list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Content/CMS editing lives under <strong>Site Content</strong>.</li>
            <li>Role permissions are enforced server-side too — the sidebar just hides what you can't access.</li>
            <li>Real-time updates are powered by socket.io — the green dot near the logo means you're connected.</li>
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}
