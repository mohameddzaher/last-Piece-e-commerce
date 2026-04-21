'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';
import { productAPI } from '@/utils/endpoints';

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    productAPI.getBySlug(id)
      .then((r) => setProduct(r.data.data))
      .catch((e) => toast.error(e.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data) => {
    try {
      await productAPI.update(id, data);
      toast.success('Saved');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <AdminLayout title={product ? `Edit: ${product.name}` : 'Edit Product'} requiredRoles={['super-admin', 'admin']}>
      {loading ? <div className="text-xs text-slate-400">Loading...</div> : product ? (
        <ProductForm initial={product} onSubmit={onSubmit} editing />
      ) : (
        <div className="text-xs text-slate-400">Not found.</div>
      )}
    </AdminLayout>
  );
}
