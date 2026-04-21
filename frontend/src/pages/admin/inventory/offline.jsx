import InventoryPage from '@/components/admin/InventoryPage';

export default function EgyptOffline() {
  return (
    <InventoryPage
      bucket="egypt-offline"
      title="Egypt — Boutique"
      description="Products available at the physical store in Egypt."
      requiredRoles={['super-admin', 'admin', 'egypt-staff']}
    />
  );
}
