'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiFilter, FiX, FiChevronDown, FiSearch, FiGrid, FiList } from 'react-icons/fi';
import SEO from '@/components/SEO';
import ProductCard from '@/components/ProductCard';
import { productAPI, categoryAPI, brandAPI } from '@/utils/endpoints';
import { useSocketEvent } from '@/utils/socket';
import { useI18n } from '@/utils/i18n';

const GENDERS = [
  { value: '', labelKey: 'nav.products', labelFallback: 'All' },
  { value: 'men', labelKey: 'nav.men', labelFallback: 'Men' },
  { value: 'women', labelKey: 'nav.women', labelFallback: 'Women' },
  { value: 'kids', labelKey: 'nav.kids', labelFallback: 'Kids' },
];

const SORTS = [
  { value: '-createdAt', labelKey: 'product.newest', labelFallback: 'Newest' },
  { value: 'price', labelKey: 'product.priceLow', labelFallback: 'Price: Low to High' },
  { value: '-price', labelKey: 'product.priceHigh', labelFallback: 'Price: High to Low' },
  { value: '-viewCount', labelKey: 'product.popular', labelFallback: 'Most Viewed' },
  { value: 'name', labelKey: 'product.nameAz', labelFallback: 'Name: A to Z' },
];

export default function ProductsPage() {
  const router = useRouter();
  const t = useI18n((s) => s.t);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const filters = useMemo(
    () => ({
      gender: router.query.gender || '',
      category: router.query.category || '',
      brand: router.query.brand || '',
      search: router.query.q || '',
      sort: router.query.sort || '-createdAt',
      minPrice: router.query.minPrice || '',
      maxPrice: router.query.maxPrice || '',
    }),
    [router.query],
  );

  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 60, page: 1 };
      if (filters.gender) params.gender = filters.gender;
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      const r = await productAPI.getAll(params);
      setProducts(r.data.data || []);
      setTotal(r.data.pagination?.total || (r.data.data || []).length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    categoryAPI.getAll().then((r) => setCategories(r.data.data || [])).catch(() => {});
    brandAPI.getAll().then((r) => setBrands(r.data.data || [])).catch(() => {});
  }, []);

  // Debounce: coalesce bursts of catalog edits into a single refetch per tab.
  const DB = { debounceMs: 500 };
  useSocketEvent('product:created', load, [JSON.stringify(filters)], DB);
  useSocketEvent('product:updated', load, [JSON.stringify(filters)], DB);
  useSocketEvent('product:deleted', load, [JSON.stringify(filters)], DB);

  const setQuery = (patch) => {
    const next = { ...router.query, ...patch };
    Object.keys(next).forEach((k) => {
      if (!next[k]) delete next[k];
    });
    router.push({ pathname: '/products', query: next }, undefined, { shallow: false });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setQuery({ q: searchInput.trim() || undefined });
  };

  const activeFilterCount =
    (filters.gender ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  return (
    <>
      <SEO title={`${t('product.allProducts', 'All Products')} · Last Piece`} description="Luxury, authentic sneakers. Limited drops, curated for Egypt." />

      {/* COMBINED BANNER + TOOLBAR — title/count on the left, search + sort on the right, one row on desktop */}
      <section className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">{t('product.theCollection', 'THE COLLECTION')}</div>
            <h1 className="text-2xl md:text-[28px] font-bold leading-tight">
              {filters.gender ? t(`nav.${filters.gender}`, filters.gender) : t('product.allProducts', 'All Products')}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {total} {total === 1 ? t('product.pair', 'pair') : t('product.pairs', 'pairs')}
              {filters.search && <> · {t('product.matching', 'matching')} "{filters.search}"</>}
            </p>
          </div>
          <form onSubmit={submitSearch} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('product.searchPlaceholder', 'Search name, SKU, brand...')}
                className="w-full pl-9 pr-3 h-10 text-xs bg-slate-900 border border-slate-800 rounded-full text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={filters.sort}
              onChange={(e) => setQuery({ sort: e.target.value })}
              className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-full text-white focus:border-blue-500 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelKey, s.labelFallback)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden h-10 inline-flex items-center gap-1 px-3 text-xs font-semibold bg-white text-slate-900 rounded-full"
            >
              <FiFilter size={12} />
              {activeFilterCount > 0 && <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[9px]">{activeFilterCount}</span>}
            </button>
          </form>
        </div>
      </section>

      {/* STICKY gender tabs — thinner, just the tabs now */}
      <section className="bg-slate-900 border-b border-slate-800 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 h-11">
          <div className="flex overflow-x-auto no-scrollbar -mx-1">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                onClick={() => setQuery({ gender: g.value })}
                className={`mx-1 px-3 h-11 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  filters.gender === g.value
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {t(g.labelKey, g.labelFallback)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BODY — DARK sidebar (left) + card grid (right) */}
      <section className="bg-slate-950 min-h-screen text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
          {/* DARK SIDEBAR */}
          <aside
            className={`${
              mobileFilterOpen ? 'fixed inset-0 z-40 bg-slate-950 p-5 overflow-y-auto' : 'hidden'
            } lg:block lg:static lg:p-0`}
          >
            {mobileFilterOpen && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h2 className="text-sm font-bold">{t('product.filters', 'Filters')}</h2>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1">
                  <FiX size={16} />
                </button>
              </div>
            )}

            {/* Search (mobile) */}
            <form onSubmit={submitSearch} className="md:hidden mb-4">
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('product.searchShort', 'Search...')}
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-gray-500"
                />
              </div>
            </form>

            <FilterGroup
              title={t('product.brand', 'Brand')}
              items={[{ slug: '', name: t('product.allBrands', 'All Brands') }, ...brands.map((b) => ({ slug: b.slug, name: b.name }))]}
              value={filters.brand}
              onChange={(v) => setQuery({ brand: v })}
            />
            {categories.length > 0 && (
              <FilterGroup
                title={t('product.category', 'Category')}
                items={[{ slug: '', name: t('product.allCategories', 'All Categories') }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))]}
                value={filters.category}
                onChange={(v) => setQuery({ category: v })}
              />
            )}

            {/* Price */}
            <div className="mt-5 pt-5 border-t border-slate-800">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t('product.priceRangeLabel', 'Price (EGP)')}</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={t('product.min', 'Min')}
                  value={filters.minPrice}
                  onChange={(e) => setQuery({ minPrice: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder={t('product.max', 'Max')}
                  value={filters.maxPrice}
                  onChange={(e) => setQuery({ maxPrice: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => router.push('/products')}
                className="mt-5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {t('product.clearFilters', 'Clear all filters')}
              </button>
            )}
          </aside>

          {/* GRID */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-lg bg-slate-900 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-sm text-gray-400">{t('product.noResults', 'No products match your filters.')}</div>
                <Link href="/products" className="mt-3 inline-block text-xs text-blue-400 font-semibold">
                  {t('product.clearFiltersShort', 'Clear filters')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} variant="dark" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function FilterGroup({ title, items, value, onChange }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</h3>
        <FiChevronDown className={`transition-transform ${open ? '' : '-rotate-90'}`} size={12} />
      </button>
      {open && (
        <div className="space-y-0.5 max-h-60 overflow-y-auto">
          {items.map((it) => (
            <button
              key={it.slug || 'all'}
              onClick={() => onChange(it.slug)}
              className={`block w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                value === it.slug ? 'bg-blue-500/20 text-white font-semibold' : 'text-gray-400 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {it.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
