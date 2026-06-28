import {
  calculatePagination,
  generateSlug,
  generateOrderNumber,
  generateSKU,
  calculateDiscount,
  sanitizeUser,
  resolveImageUrl,
} from '../src/utils/helpers.js';

describe('calculatePagination', () => {
  it('caps limit at 100 to stop unbounded queries', () => {
    // The single most important scaling guard: a client asking for ?limit=100000
    // must not be able to pull the whole collection.
    expect(calculatePagination(1, 100000).limit).toBe(100);
    expect(calculatePagination(1, 999).limit).toBe(100);
  });

  it('floors page and limit at 1 for garbage input', () => {
    expect(calculatePagination(0, 0)).toMatchObject({ page: 1, limit: 1 });
    expect(calculatePagination(-5, -5)).toMatchObject({ page: 1, limit: 1 });
    // garbage input falls back to safe defaults, never NaN
    expect(calculatePagination('abc', 'xyz')).toMatchObject({ page: 1, limit: 10 });
  });

  it('computes skip correctly', () => {
    expect(calculatePagination(1, 10).skip).toBe(0);
    expect(calculatePagination(3, 10).skip).toBe(20);
    expect(calculatePagination(2, 25).skip).toBe(25);
  });

  it('defaults to page 1, limit 10', () => {
    expect(calculatePagination()).toMatchObject({ page: 1, limit: 10, skip: 0 });
  });
});

describe('generateSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(generateSlug('Air Max 90')).toBe('air-max-90');
  });
  it('strips special characters', () => {
    expect(generateSlug('Nike® Air! (Limited)')).toBe('nike-air-limited');
  });
  it('trims leading/trailing hyphens and collapses spaces/underscores', () => {
    expect(generateSlug('  hello___world  ')).toBe('hello-world');
  });
});

describe('generateOrderNumber / generateSKU', () => {
  it('order numbers are prefixed and reasonably unique', () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/);
    expect(a).not.toBe(b);
  });
  it('SKUs are prefixed from category + product', () => {
    expect(generateSKU('Shoes', 'AirMax')).toMatch(/^SHO-AIR-\d{6}-[A-Z0-9]{3}$/);
  });
});

describe('calculateDiscount', () => {
  it('applies a percentage discount', () => {
    expect(calculateDiscount(1000, 10)).toBe(900);
    expect(calculateDiscount(1000, 0)).toBe(1000);
  });
  it('returns original when inputs missing', () => {
    expect(calculateDiscount(0, 10)).toBe(0);
    expect(calculateDiscount(1000, undefined)).toBe(1000);
  });
});

describe('sanitizeUser', () => {
  it('strips password and token fields', () => {
    const out = sanitizeUser({
      email: 'a@b.com',
      password: 'secret',
      emailVerificationToken: 't1',
      passwordResetToken: 't2',
    });
    expect(out.password).toBeUndefined();
    expect(out.emailVerificationToken).toBeUndefined();
    expect(out.passwordResetToken).toBeUndefined();
    expect(out.email).toBe('a@b.com');
  });
});

describe('resolveImageUrl', () => {
  const OLD = process.env.BACKEND_PUBLIC_URL;
  afterAll(() => { process.env.BACKEND_PUBLIC_URL = OLD; });

  it('passes through absolute URLs untouched', () => {
    expect(resolveImageUrl('https://cdn.x/y.png')).toBe('https://cdn.x/y.png');
  });
  it('prefixes relative paths with the backend base (stripping /api)', () => {
    process.env.BACKEND_PUBLIC_URL = 'https://api.example.com/api';
    expect(resolveImageUrl('/uploads/a.png')).toBe('https://api.example.com/uploads/a.png');
  });
  it('returns the path unchanged when no base configured', () => {
    delete process.env.BACKEND_PUBLIC_URL;
    expect(resolveImageUrl('/uploads/a.png')).toBe('/uploads/a.png');
  });
});
