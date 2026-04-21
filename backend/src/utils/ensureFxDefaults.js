import FxReference from '../models/FxReference.js';

/**
 * On first boot, make sure the reference rates the UI asks about actually
 * exist — otherwise the Dashboard cards for SAR and USD render blank until
 * the super-admin manually clicks into each pair. We seed with conservative
 * static rates that match the frontend fallbacks; the super-admin can pull
 * live or override from the admin panel at any time.
 */
const DEFAULTS = [
  { from: 'SAR', to: 'EGP', rate: 13.25 },
  { from: 'USD', to: 'EGP', rate: 49 },
  { from: 'EUR', to: 'EGP', rate: 53 },
];

export const ensureFxDefaults = async () => {
  try {
    for (const d of DEFAULTS) {
      const existing = await FxReference.findOne({ from: d.from, to: d.to });
      if (existing) continue;
      await FxReference.create({
        from: d.from,
        to: d.to,
        rate: d.rate,
        source: 'manual',
        note: 'Seed default — replace via admin panel when needed',
      });
      console.log(`💱 Seeded FX reference ${d.from}→${d.to} @ ${d.rate}`);
    }
  } catch (err) {
    // Non-fatal: app still runs, just without seeded defaults.
    console.error('ensureFxDefaults failed:', err.message);
  }
};
