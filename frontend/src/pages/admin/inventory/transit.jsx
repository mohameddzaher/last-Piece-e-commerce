import InventoryPage from '@/components/admin/InventoryPage';

export default function InTransit() {
  return (
    <InventoryPage
      bucket="transit"
      title="In Transit"
      description="Products in the Saudi → Egypt shipping pipeline."
      requiredRoles={['super-admin', 'admin', 'saudi-staff']}
    />
  );
}
