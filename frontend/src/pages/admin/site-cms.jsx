'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import { siteContentAPI } from '@/utils/endpoints';
import { FiSave, FiChevronDown, FiChevronRight } from 'react-icons/fi';

/**
 * Edit all homepage/site text & images. Each item has an `en` and `ar` value,
 * plus a base `value`. Content is stored as JSON so complex objects (hero with
 * title + subtitle + CTAs + image) are editable inline.
 */
export default function AdminSiteCMS() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    try {
      const r = await siteContentAPI.adminAll();
      setItems(r.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (item, patch) => {
    try {
      await siteContentAPI.upsert(item.key, { ...item, ...patch });
      toast.success('Saved');
      load();
    } catch (e) { toast.error('Failed'); }
  };

  const grouped = items.reduce((acc, it) => {
    acc[it.section || 'other'] = acc[it.section || 'other'] || [];
    acc[it.section || 'other'].push(it);
    return acc;
  }, {});

  return (
    <AdminLayout title="Site Content (CMS)" requiredRoles={['super-admin', 'admin']}>
      <p className="text-xs text-slate-500 mb-4">
        Every text and image on the public site lives here. Changes go live instantly for visitors.
      </p>
      {loading && <div className="text-xs text-slate-400">Loading...</div>}
      <div className="space-y-4">
        {Object.entries(grouped).map(([section, its]) => (
          <div key={section} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xs font-bold uppercase tracking-wider">{section}</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {its.map((it) => (
                <ContentItem
                  key={it._id}
                  item={it}
                  expanded={!!expanded[it._id]}
                  onToggle={() => setExpanded({ ...expanded, [it._id]: !expanded[it._id] })}
                  onSave={save}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

function ContentItem({ item, expanded, onToggle, onSave }) {
  const [en, setEn] = useState(JSON.stringify(item.i18n?.en ?? item.value ?? {}, null, 2));
  const [ar, setAr] = useState(JSON.stringify(item.i18n?.ar ?? {}, null, 2));
  const [busy, setBusy] = useState(false);

  const doSave = async () => {
    try {
      setBusy(true);
      const parsedEn = en.trim().startsWith('{') || en.trim().startsWith('[') ? JSON.parse(en) : en;
      const parsedAr = ar.trim().startsWith('{') || ar.trim().startsWith('[') ? JSON.parse(ar) : ar;
      await onSave(item, {
        i18n: { en: parsedEn, ar: parsedAr },
        value: parsedEn, // keep base value in sync with EN
      });
    } catch (err) {
      toast.error('Invalid JSON — check your braces.');
    } finally { setBusy(false); }
  };

  return (
    <div className="px-4 py-3">
      <button onClick={onToggle} className="flex items-center gap-2 w-full text-left">
        {expanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        <div className="flex-1">
          <div className="text-xs font-semibold">{item.label || item.key}</div>
          <div className="text-[10px] text-slate-500 font-mono">{item.key}</div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">English</div>
            <textarea
              value={en}
              onChange={(e) => setEn(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 text-xs font-mono rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">العربية</div>
            <textarea
              dir="rtl"
              value={ar}
              onChange={(e) => setAr(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 text-xs font-mono rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button onClick={doSave} disabled={busy} className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-md disabled:opacity-60">
              <FiSave size={12} /> {busy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

