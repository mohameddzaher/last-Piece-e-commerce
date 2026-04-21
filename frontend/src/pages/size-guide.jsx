import LegalPage from '@/components/LegalPage';

export default function SizeGuide() {
  return (
    <LegalPage
      cmsKey="page.sizeGuide"
      defaults={{
        title: 'Size Guide',
        intro: 'Sneaker sizing varies by brand. Use this as a starting point, then check the product page for any model-specific notes.',
        sections: [
          {
            heading: 'Men (EU → US → UK)',
            body: 'EU 40 = US 7 = UK 6\nEU 41 = US 8 = UK 7\nEU 42 = US 8.5 = UK 7.5\nEU 43 = US 9.5 = UK 8.5\nEU 44 = US 10 = UK 9\nEU 45 = US 11 = UK 10\nEU 46 = US 12 = UK 11',
          },
          {
            heading: 'Women (EU → US → UK)',
            body: 'EU 36 = US 5 = UK 3\nEU 37 = US 6 = UK 4\nEU 38 = US 7 = UK 5\nEU 39 = US 8 = UK 6\nEU 40 = US 9 = UK 7',
          },
          {
            heading: 'Kids',
            body: 'Kids sizes vary widely by brand. Check the product description on each pair. Common range: EU 28–35.',
          },
          {
            heading: 'Brand-specific notes',
            body: '• Yeezy: runs half a size small. We recommend going up half a size.\n• Air Jordan 1: true to size.\n• Balenciaga Triple S: runs one full size large. Go down one size.',
          },
          {
            heading: 'Not sure? WhatsApp us.',
            body: 'We will pull the exact pair from our boutique, measure the insole, and send you a photo.',
          },
        ],
      }}
    />
  );
}
