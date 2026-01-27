
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductCard from '@/components/ProductCard';
import { productAPI, categoryAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    category: '',
    sort: '-createdAt',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Get category from URL if present
    if (router.query.category) {
      setFilters((prev) => ({ ...prev, category: router.query.category }));
    }
  }, [router.query.category]);

  useEffect(() => {
    fetchProducts();
  }, [page, filters]);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sort: filters.sort,
      };

      if (filters.search) params.search = filters.search;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.category) params.category = filters.category;

      const res = await productAPI.getAll(params);

      if (res.data.success) {
        setProducts(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      category: '',
      sort: '-createdAt',
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = filters.search || filters.minPrice || filters.maxPrice || filters.category;

  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Header */}
      <div className='bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <h1 className='text-2xl font-bold text-white mb-2'>Our Collection</h1>
          <p className='text-gray-400 text-xs'>Discover unique pieces that tell a story</p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Top Bar */}
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6'>
          {/* Search */}
          <div className='relative flex-1 max-w-md'>
            <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={14} />
            <input
              type='text'
              placeholder='Search products...'
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              className='w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          <div className='flex items-center gap-3'>
            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='md:hidden flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white'
            >
              <FiFilter size={14} />
              Filters
            </button>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => {
                setFilters({ ...filters, sort: e.target.value });
                setPage(1);
              }}
              className='px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='-createdAt'>Newest First</option>
              <option value='price'>Price: Low to High</option>
              <option value='-price'>Price: High to Low</option>
              <option value='-rating.average'>Highest Rated</option>
            </select>

            {/* Results Count */}
            <span className='text-gray-400 text-xs hidden md:block'>
              {total} {total === 1 ? 'product' : 'products'}
            </span>
          </div>
        </div>

        <div className='flex gap-6'>
          {/* Filters Sidebar */}
          <AnimatePresence>
            {(showFilters || typeof window !== 'undefined' && window.innerWidth >= 768) && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`${
                  showFilters ? 'fixed inset-0 z-50 md:relative md:z-auto' : 'hidden md:block'
                } md:w-56 flex-shrink-0`}
              >
                {/* Mobile Overlay */}
                {showFilters && (
                  <div className='fixed inset-0 bg-black/50 md:hidden' onClick={() => setShowFilters(false)} />
                )}

                <div className='relative md:sticky md:top-20 bg-slate-900 border border-slate-800 rounded-lg p-4 h-fit max-h-[80vh] overflow-y-auto z-10'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='font-semibold text-sm text-white'>Filters</h3>
                    <div className='flex items-center gap-2'>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className='text-xs text-blue-400 hover:text-blue-300'>
                          Clear all
                        </button>
                      )}
                      <button onClick={() => setShowFilters(false)} className='md:hidden text-gray-400 hover:text-white'>
                        <FiX size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className='mb-5'>
                    <label className='text-xs font-medium text-gray-400 block mb-2'>Price Range</label>
                    <div className='flex flex-col gap-2'>
                      <input
                        type='number'
                        placeholder='Min Price'
                        value={filters.minPrice}
                        onChange={(e) => {
                          setFilters({ ...filters, minPrice: e.target.value });
                          setPage(1);
                        }}
                        className='w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                      <input
                        type='number'
                        placeholder='Max Price'
                        value={filters.maxPrice}
                        onChange={(e) => {
                          setFilters({ ...filters, maxPrice: e.target.value });
                          setPage(1);
                        }}
                        className='w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className='text-xs font-medium text-gray-400 block mb-2'>Category</label>
                    <div className='space-y-1'>
                      <button
                        onClick={() => {
                          setFilters({ ...filters, category: '' });
                          setPage(1);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                          !filters.category
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat._id}
                          onClick={() => {
                            setFilters({ ...filters, category: cat.slug });
                            setPage(1);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                            filters.category === cat.slug
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className='flex-1'>
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className='flex flex-wrap gap-2 mb-4'>
                {filters.search && (
                  <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs'>
                    Search: {filters.search}
                    <button onClick={() => setFilters({ ...filters, search: '' })}>
                      <FiX size={12} />
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs'>
                    Category: {filters.category}
                    <button onClick={() => setFilters({ ...filters, category: '' })}>
                      <FiX size={12} />
                    </button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs'>
                    Price: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
                    <button onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}>
                      <FiX size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className='flex items-center justify-center py-16'>
                <div className='w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : products.length === 0 ? (
              <div className='text-center py-16'>
                <div className='text-4xl mb-3'>🔍</div>
                <h3 className='text-base font-bold text-white mb-1'>No products found</h3>
                <p className='text-gray-400 text-xs mb-4'>Try adjusting your filters or search terms</p>
                <button onClick={clearFilters} className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors'>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8'>
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-center gap-1'>
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className='p-1.5 bg-slate-900 border border-slate-800 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors'
                    >
                      <FiChevronLeft size={16} />
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 border border-slate-800 text-white hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className='p-1.5 bg-slate-900 border border-slate-800 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors'
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
