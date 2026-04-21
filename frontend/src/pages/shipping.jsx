import LegalPage from '@/components/LegalPage';

export default function Shipping() {
  return (
    <LegalPage
      cmsKey="page.shipping"
      defaults={{
        title: 'Shipping & Delivery',
        intro: 'How and when your pair reaches you.',
        sections: [
          {
            heading: 'Where we ship',
            body: 'Egypt: nationwide. Saudi Arabia & GCC: contact us via WhatsApp for arrangement.',
          },
          {
            heading: 'Delivery times',
            body: '• Cairo & Giza: 1–2 working days\n• Other Egyptian governorates: 2–4 working days\n• Cross-border (KSA → Egypt): handled per pair, ETA provided per shipment',
          },
          {
            heading: 'Shipping costs',
            body: 'Free shipping on orders above 5,000 EGP within Egypt. Otherwise, 80–150 EGP depending on city.',
          },
          {
            heading: 'Tracking',
            body: 'You receive a tracking number by email and SMS as soon as your order is dispatched.',
          },
          {
            heading: 'Boutique pickup',
            body: 'Pick up your pair in person at our New Cairo boutique. Choose "Boutique pickup" at checkout.',
          },
        ],
      }}
    />
  );
}
