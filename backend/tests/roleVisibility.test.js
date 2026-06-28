import { filterProductForRole, filterProductsForRole } from '../src/utils/roleVisibility.js';

// Security-critical: the wrong field leaking to the wrong role is a real-money
// problem (cost data, supplier, margins). These lock the masking contract.
const fullProduct = () => ({
  name: 'Air Max',
  price: 5000,
  onlinePrice: 5000,
  offlinePrice: 4800,
  minSellPrice: 4000,
  sellingCurrency: 'EGP',
  purchasePrice: 1200,
  purchaseCurrency: 'SAR',
  supplier: { name: 'Riyadh Kicks' },
  purchaseDate: new Date(),
  landedCost: 1500,
  allocatedShippingCost: 100,
  batchCode: 'B-001',
  qrCode: 'QR',
  locationHistory: [{ location: 'saudi' }],
  createdBy: 'u1',
});

describe('filterProductForRole', () => {
  it('super-admin and admin see every field', () => {
    for (const role of ['super-admin', 'admin']) {
      const out = filterProductForRole(fullProduct(), role);
      expect(out.purchasePrice).toBe(1200);
      expect(out.onlinePrice).toBe(5000);
      expect(out.supplier).toBeDefined();
    }
  });

  it('saudi-staff never sees selling prices or landed cost', () => {
    const out = filterProductForRole(fullProduct(), 'saudi-staff');
    expect(out.onlinePrice).toBeUndefined();
    expect(out.offlinePrice).toBeUndefined();
    expect(out.minSellPrice).toBeUndefined();
    expect(out.landedCost).toBeUndefined();
    // but keeps purchase-side data they own
    expect(out.purchasePrice).toBe(1200);
    expect(out.supplier).toBeDefined();
  });

  it('egypt-staff never sees purchase price or supplier', () => {
    const out = filterProductForRole(fullProduct(), 'egypt-staff');
    expect(out.purchasePrice).toBeUndefined();
    expect(out.purchaseCurrency).toBeUndefined();
    expect(out.supplier).toBeUndefined();
    expect(out.landedCost).toBeUndefined();
    // but keeps selling-side data they own
    expect(out.onlinePrice).toBe(5000);
  });

  it('customer (and unauthenticated default) sees only public-safe fields', () => {
    for (const role of ['customer', undefined, 'anything-else']) {
      const out = filterProductForRole(fullProduct(), role);
      expect(out.purchasePrice).toBeUndefined();
      expect(out.supplier).toBeUndefined();
      expect(out.minSellPrice).toBeUndefined();
      expect(out.locationHistory).toBeUndefined();
      expect(out.createdBy).toBeUndefined();
      expect(out.batchCode).toBeUndefined();
      // public price stays visible
      expect(out.price).toBe(5000);
      expect(out.name).toBe('Air Max');
    }
  });

  it('does not mutate the original object', () => {
    const original = fullProduct();
    filterProductForRole(original, 'customer');
    expect(original.purchasePrice).toBe(1200);
  });

  it('handles null/undefined safely', () => {
    expect(filterProductForRole(null, 'customer')).toBeNull();
    expect(filterProductsForRole(null, 'customer')).toEqual([]);
    expect(filterProductsForRole(undefined, 'admin')).toEqual([]);
  });

  it('filters arrays element-by-element', () => {
    const out = filterProductsForRole([fullProduct(), fullProduct()], 'customer');
    expect(out).toHaveLength(2);
    out.forEach((p) => expect(p.purchasePrice).toBeUndefined());
  });
});
