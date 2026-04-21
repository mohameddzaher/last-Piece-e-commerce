'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductForm from '@/components/admin/ProductForm';
import { productAPI } from '@/utils/endpoints';

export default function NewProduct() {
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const res = await productAPI.create(data);
      toast.success('Product registered');
      router.push(`/admin/products/${res.data.data._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <AdminLayout title="Register New Product" requiredRoles={['super-admin', 'admin', 'saudi-staff']}>
      <p className="text-xs text-slate-500 mb-4">
        Add a newly purchased pair. Saudi staff can fill the purchasing fields; super-admins set selling prices later.
      </p>
      <ProductForm onSubmit={onSubmit} />
    </AdminLayout>
  );
}
