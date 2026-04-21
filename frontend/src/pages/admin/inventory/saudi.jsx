import InventoryPage from '@/components/admin/InventoryPage';

export default function SaudiInventory() {
  return (
    <InventoryPage
      bucket="saudi"
      title="Saudi Inventory"
      description="Products purchased in Saudi Arabia, awaiting shipment to Egypt."
    />
  );
}
