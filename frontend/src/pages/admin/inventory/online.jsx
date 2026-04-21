import InventoryPage from '@/components/admin/InventoryPage';

export default function EgyptOnline() {
  return (
    <InventoryPage
      bucket="egypt-online"
      title="Egypt — Online"
      description="Products live on the website. Customers can buy these now."
      requiredRoles={['super-admin', 'admin', 'egypt-staff']}
    />
  );
}
