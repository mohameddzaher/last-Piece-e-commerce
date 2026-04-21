/**
 * Role-based field stripping for product responses.
 *
 * Saudi staff must NEVER see selling prices for Egypt.
 * Egypt staff must NEVER see purchase price or supplier cost info.
 * Customers see only public-safe fields.
 * Super-admin and admin see everything.
 *
 * This runs server-side so the data never leaves the backend in the wrong shape —
 * UI hiding alone is not enough (browser devtools could see it).
 */

const SAUDI_HIDDEN_FIELDS = [
  'onlinePrice',
  'offlinePrice',
  'minSellPrice',
  'sellingCurrency',
  'landedCost',
  'allocatedShippingCost',
];

const EGYPT_HIDDEN_FIELDS = [
  'purchasePrice',
  'purchaseCurrency',
  'supplier',
  'purchaseDate',
  'landedCost',
  'allocatedShippingCost',
];

const CUSTOMER_HIDDEN_FIELDS = [
  'purchasePrice',
  'purchaseCurrency',
  'supplier',
  'purchaseDate',
  'batchCode',
  'qrCode',
  'minSellPrice',
  'landedCost',
  'allocatedShippingCost',
  'shipment',
  'locationHistory',
  'createdBy',
  'updatedBy',
];

const stripFields = (obj, fields) => {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map((o) => stripFields(o, fields));
  const plain = obj.toObject ? obj.toObject() : { ...obj };
  for (const f of fields) delete plain[f];
  return plain;
};

export const filterProductForRole = (product, role) => {
  if (!product) return product;
  switch (role) {
    case 'super-admin':
    case 'admin':
      return product.toObject ? product.toObject() : product;
    case 'saudi-staff':
      return stripFields(product, SAUDI_HIDDEN_FIELDS);
    case 'egypt-staff':
      return stripFields(product, EGYPT_HIDDEN_FIELDS);
    case 'customer':
    default:
      return stripFields(product, CUSTOMER_HIDDEN_FIELDS);
  }
};

export const filterProductsForRole = (products, role) =>
  (products || []).map((p) => filterProductForRole(p, role));

/**
 * Helper for Express handlers — wrap a product/products payload before sending.
 * Reads role from req.user (or 'customer' if unauthenticated).
 */
export const sendProduct = (res, product, req, extra = {}) => {
  const role = req.user?.role || 'customer';
  return res.json({ success: true, data: filterProductForRole(product, role), ...extra });
};

export const sendProducts = (res, products, req, extra = {}) => {
  const role = req.user?.role || 'customer';
  return res.json({ success: true, data: filterProductsForRole(products, role), ...extra });
};
