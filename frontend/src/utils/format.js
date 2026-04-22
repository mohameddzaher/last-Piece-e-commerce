export const fmtMoney = (v, currency) => {
  if (v == null || isNaN(v)) return '—';
  // Last Piece operates in EGP for everything customer-facing. Treat any
  // missing / falsy / accidentally-defaulted currency as EGP, and never
  // display "$" — show the ISO code instead so the screen is unambiguous
  // (a few legacy orders were saved with payment.currency='USD' from the
  // old schema default; we don't want their totals showing dollar signs).
  const cur = (currency || 'EGP').toUpperCase();
  const symbol = { EGP: 'EGP', SAR: 'SAR', USD: 'USD', EUR: 'EUR' }[cur] || cur;
  return `${symbol} ${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const fmtPct = (v) => (v == null || isNaN(v) ? '—' : `${Number(v).toFixed(1)}%`);

export const locationLabel = (loc) =>
  ({
    'saudi': 'Saudi Inventory',
    'transit': 'In Transit',
    'egypt-online': 'Egypt — Online',
    'egypt-offline': 'Egypt — Boutique',
    'egypt-both': 'Egypt — Online & Boutique',
    'sold': 'Sold',
  }[loc] || loc);

export const locationColor = (loc) =>
  ({
    'saudi': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    'transit': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    'egypt-online': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    'egypt-offline': 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    'egypt-both': 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
    'sold': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
  }[loc] || 'bg-slate-500/10 text-slate-600 border-slate-500/30');

export const roleLabel = (role) =>
  ({
    'super-admin': 'Super Admin',
    'admin': 'Admin',
    'saudi-staff': 'Saudi Staff',
    'egypt-staff': 'Egypt Staff',
    'customer': 'Customer',
  }[role] || role);
