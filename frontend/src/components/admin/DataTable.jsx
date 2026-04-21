'use client';

import { useState, useMemo } from 'react';
import { FiDownload, FiSearch } from 'react-icons/fi';
import { exportToExcel } from '@/utils/excel';

/**
 * Reusable admin table.
 *  - columns: [{ key, label, render?, accessor?, exportValue?, sortable? }]
 *  - rows: array of objects
 *  - searchKeys: which columns to search
 *  - exportFilename: enables the export button
 *  - onRowClick: optional click handler
 *  - selectable + onSelectionChange: enables bulk-select checkboxes
 */
export default function DataTable({
  columns,
  rows = [],
  searchKeys = [],
  exportFilename,
  onRowClick,
  selectable = false,
  onSelectionChange,
  emptyMessage = 'No records yet.',
  toolbar,
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => {
        const v = k.split('.').reduce((o, key) => (o == null ? o : o[key]), r);
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [rows, search, searchKeys]);

  const toggle = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    setSelectedIds(next);
    onSelectionChange?.(next);
  };
  const toggleAll = () => {
    const ids = filtered.map((r) => r._id);
    const next = selectedIds.length === ids.length ? [] : ids;
    setSelectedIds(next);
    onSelectionChange?.(next);
  };

  const handleExport = () => {
    const exportRows = filtered.map((row) => {
      const out = {};
      for (const c of columns) {
        const fn = c.exportValue || c.accessor;
        out[c.label] = fn ? fn(row) : row[c.key];
      }
      return out;
    });
    exportToExcel(exportFilename || 'export', exportRows);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          {searchKeys.length > 0 && (
            <div className="relative flex-1 max-w-sm">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-md border border-transparent focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
          {toolbar}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{filtered.length} of {rows.length}</span>
          {exportFilename && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
            >
              <FiDownload size={12} /> Export
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
            <tr>
              {selectable && (
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr
                key={row._id}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}`}
              >
                {selectable && (
                  <td className="px-3 py-2 align-middle" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row._id)}
                      onChange={() => toggle(row._id)}
                      className="cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 align-middle">
                    {c.render ? c.render(row) : c.accessor ? c.accessor(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
