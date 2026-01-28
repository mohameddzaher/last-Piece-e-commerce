
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiArrowLeft,
  FiUpload,
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiTag,
  FiBox,
  FiImage,
  FiLink,
  FiStar,
} from 'react-icons/fi';
import { useAuthStore } from '@/store';
import { productAPI, categoryAPI, uploadAPI } from '@/utils/endpoints';
import { toast } from 'react-toastify';

export default function NewProduct() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' or 'url'
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: '',
    stock: '1',
    status: 'active',
    images: [],
    features: [''],
    tags: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin' && user?.role !== 'super-admin') {
      router.push('/dashboard');
      toast.error('Access denied. Admin privileges required.');
      return;
    }

    // Fetch categories from API
    fetchCategories();
  }, [isAuthenticated, user, router]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  const handleImageUrl = (e) => {
    e.preventDefault();
    const url = e.target.imageUrl.value.trim();
    if (url && !formData.images.includes(url)) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
      e.target.imageUrl.value = '';
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        const res = await uploadAPI.uploadSingle(formDataUpload);
        if (res.data.success) {
          const imageUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://last-piece-4l3u.onrender.com'}${res.data.data.url}`;
          setFormData((prev) => ({ ...prev, images: [...prev.images, imageUrl] }));
          toast.success(`Uploaded: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.description || !formData.description.trim()) {
      toast.error('Please provide a product description');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        category: formData.category,
        stock: parseInt(formData.stock) || 1,
        status: formData.status,
        images: formData.images.map(url => ({ url, alt: formData.name })),
        thumbnail: formData.images[0] || '',
        features: formData.features.filter((f) => f.trim()),
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const res = await productAPI.create(productData);
      if (res.data.success) {
        toast.success('Product created successfully');
        router.push('/admin/products');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: FiHome, current: false },
    { name: 'Products', href: '/admin/products', icon: FiPackage, current: true },
    { name: 'Orders', href: '/admin/orders', icon: FiShoppingBag, current: false },
    { name: 'Users', href: '/admin/users', icon: FiUsers, current: false },
    { name: 'Reviews', href: '/admin/reviews', icon: FiStar, current: false },
    ...(user?.role === 'super-admin' ? [{ name: 'Financial', href: '/admin/financial', icon: FiDollarSign, current: false }] : []),
    { name: 'Settings', href: '/admin/settings', icon: FiSettings, current: false },
  ];

  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col h-full'>
          <div className='flex items-center justify-between px-6 py-5 border-b border-slate-800'>
            <Link href='/admin' className='flex items-center gap-2'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-xl'>L</span>
              </div>
              <span className='text-xl font-bold text-white'>Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className='lg:hidden text-gray-400 hover:text-white'>
              <FiX size={24} />
            </button>
          </div>

          <nav className='flex-1 px-4 py-6 space-y-1'>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.current
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className='font-medium'>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className='p-4 border-t border-slate-800'>
            <div className='flex items-center gap-3 px-4 py-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
                <span className='text-white font-bold'>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className='flex-1'>
                <p className='text-white font-medium text-sm'>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className='text-gray-500 text-xs'>{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className='flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all mt-2'
            >
              <FiLogOut size={20} />
              <span className='font-medium'>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className='lg:pl-64'>
        {/* Top Bar */}
        <header className='sticky top-0 z-30 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800'>
          <div className='flex items-center justify-between px-4 lg:px-8 py-4'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => setSidebarOpen(true)}
                className='lg:hidden text-gray-400 hover:text-white'
              >
                <FiMenu size={24} />
              </button>
              <Link
                href='/admin/products'
                className='flex items-center gap-2 text-gray-400 hover:text-white transition-colors'
              >
                <FiArrowLeft size={20} />
                <span>Back to Products</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className='p-4 lg:p-8'>
          <div className='max-w-4xl mx-auto'>
            <h1 className='text-2xl font-bold text-white mb-8'>Add New Product</h1>

            <form onSubmit={handleSubmit} className='space-y-8'>
              {/* Basic Info */}
              <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                <h2 className='text-lg font-semibold text-white mb-6 flex items-center gap-2'>
                  <FiBox className='text-blue-400' />
                  Basic Information
                </h2>

                <div className='space-y-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Product Name *
                    </label>
                    <input
                      type='text'
                      name='name'
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter product name'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Description
                    </label>
                    <textarea
                      name='description'
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                      placeholder='Describe your product...'
                    />
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Category *
                      </label>
                      <select
                        name='category'
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value=''>Select category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-300 mb-2'>
                        Status
                      </label>
                      <select
                        name='status'
                        value={formData.status}
                        onChange={handleChange}
                        className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='active'>Active</option>
                        <option value='draft'>Draft</option>
                        <option value='archived'>Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                <h2 className='text-lg font-semibold text-white mb-6 flex items-center gap-2'>
                  <FiDollarSign className='text-green-400' />
                  Pricing & Inventory
                </h2>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Price *
                    </label>
                    <div className='relative'>
                      <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>$</span>
                      <input
                        type='number'
                        name='price'
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min='0'
                        step='0.01'
                        className='w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='0.00'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Compare Price
                    </label>
                    <div className='relative'>
                      <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>$</span>
                      <input
                        type='number'
                        name='comparePrice'
                        value={formData.comparePrice}
                        onChange={handleChange}
                        min='0'
                        step='0.01'
                        className='w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='0.00'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Stock *
                    </label>
                    <input
                      type='number'
                      name='stock'
                      value={formData.stock}
                      onChange={handleChange}
                      required
                      min='1'
                      max='1'
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='1'
                    />
                    <p className='text-xs text-gray-500 mt-1'>Last Piece - Only 1 item available</p>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                <h2 className='text-lg font-semibold text-white mb-6 flex items-center gap-2'>
                  <FiImage className='text-purple-400' />
                  Product Images
                </h2>

                {/* Image Mode Toggle */}
                <div className='flex gap-2 mb-6'>
                  <button
                    type='button'
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      imageMode === 'upload'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <FiUpload size={18} />
                    Upload Files
                  </button>
                  <button
                    type='button'
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      imageMode === 'url'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <FiLink size={18} />
                    Add URL
                  </button>
                </div>

                {imageMode === 'upload' ? (
                  <div className='mb-6'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
                      multiple
                      onChange={handleFileUpload}
                      className='hidden'
                      id='image-upload'
                    />
                    <label
                      htmlFor='image-upload'
                      className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 transition-colors ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading ? (
                        <>
                          <div className='w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3'></div>
                          <p className='text-gray-400'>Uploading...</p>
                        </>
                      ) : (
                        <>
                          <FiUpload className='text-gray-500 mb-3' size={32} />
                          <p className='text-gray-400'>Click to upload images</p>
                          <p className='text-gray-600 text-sm mt-1'>JPG, PNG, GIF, WebP (max 5MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <form onSubmit={handleImageUrl} className='flex gap-4 mb-6'>
                    <input
                      type='url'
                      name='imageUrl'
                      className='flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter image URL...'
                    />
                    <button
                      type='submit'
                      className='flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors'
                    >
                      <FiPlus size={18} />
                      Add
                    </button>
                  </form>
                )}

                {formData.images.length > 0 ? (
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                    {formData.images.map((img, idx) => (
                      <div key={idx} className='relative group'>
                        <div className='aspect-square bg-slate-800 rounded-xl overflow-hidden'>
                          <Image
                            src={img}
                            alt={`Product image ${idx + 1}`}
                            width={200}
                            height={200}
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <button
                          type='button'
                          onClick={() => removeImage(idx)}
                          className='absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <FiTrash2 size={14} />
                        </button>
                        {idx === 0 && (
                          <span className='absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-lg'>
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='border-2 border-dashed border-slate-700 rounded-xl p-8 text-center'>
                    <FiImage className='mx-auto text-gray-600 mb-3' size={32} />
                    <p className='text-gray-400'>No images added yet</p>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6'>
                <h2 className='text-lg font-semibold text-white mb-6 flex items-center gap-2'>
                  <FiTag className='text-orange-400' />
                  Features & Tags
                </h2>

                <div className='space-y-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Features
                    </label>
                    <div className='space-y-3'>
                      {formData.features.map((feature, idx) => (
                        <div key={idx} className='flex gap-3'>
                          <input
                            type='text'
                            value={feature}
                            onChange={(e) => handleFeatureChange(idx, e.target.value)}
                            className='flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            placeholder='Enter feature...'
                          />
                          {formData.features.length > 1 && (
                            <button
                              type='button'
                              onClick={() => removeFeature(idx)}
                              className='p-3 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors'
                            >
                              <FiTrash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type='button'
                      onClick={addFeature}
                      className='flex items-center gap-2 mt-3 text-blue-400 hover:text-blue-300 font-medium'
                    >
                      <FiPlus size={18} />
                      Add Feature
                    </button>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Tags
                    </label>
                    <input
                      type='text'
                      name='tags'
                      value={formData.tags}
                      onChange={handleChange}
                      className='w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter tags separated by commas...'
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className='flex gap-4'>
                <Link
                  href='/admin/products'
                  className='flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-center transition-colors'
                >
                  Cancel
                </Link>
                <button
                  type='submit'
                  disabled={loading}
                  className='flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50'
                >
                  {loading ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiPlus size={18} />
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
