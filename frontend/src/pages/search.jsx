
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiSearch, FiX } from 'react-icons/fi';
import ProductCard from '@/components/ProductCard';
import { productAPI } from '@/utils/endpoints';

export default function Search() {
  const router = useRouter();
  const { q } = router.query;
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q) {
      setQuery(q);
      searchProducts(q);
    }
  }, [q]);

  const searchProducts = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await productAPI.search(searchQuery, 20);
      if (res.data.success) {
        setProducts(res.data.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setProducts([]);
    router.push('/search');
  };

  return (
    <div className='min-h-screen bg-slate-950'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Search Header */}
        <div className='mb-12'>
          <h1 className='text-3xl font-bold text-white mb-6'>Search Products</h1>

          <form onSubmit={handleSearch} className='relative max-w-2xl'>
            <FiSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
            <input
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search for products...'
              className='w-full pl-12 pr-12 py-4 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg'
              autoFocus
            />
            {query && (
              <button
                type='button'
                onClick={clearSearch}
                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'
              >
                <FiX size={20} />
              </button>
            )}
          </form>
        </div>

        {/* Results */}
        {q && (
          <div className='mb-6'>
            <p className='text-gray-400'>
              {loading ? (
                'Searching...'
              ) : (
                <>
                  Found <span className='text-white font-medium'>{products.length}</span> results for{' '}
                  <span className='text-white font-medium'>"{q}"</span>
                </>
              )}
            </p>
          </div>
        )}

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
          </div>
        ) : products.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : q ? (
          <div className='text-center py-20'>
            <div className='text-6xl mb-4'>🔍</div>
            <h3 className='text-xl font-bold text-white mb-2'>No results found</h3>
            <p className='text-gray-400 mb-6'>Try different keywords or browse our products</p>
            <Link
              href='/products'
              className='inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className='text-center py-20'>
            <div className='text-6xl mb-4'>✨</div>
            <h3 className='text-xl font-bold text-white mb-2'>Start searching</h3>
            <p className='text-gray-400'>Enter a keyword to find unique products</p>
          </div>
        )}
      </div>
    </div>
  );
}
