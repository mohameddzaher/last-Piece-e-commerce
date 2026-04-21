import LegalPage from '@/components/LegalPage';

export default function FAQ() {
  return (
    <LegalPage
      cmsKey="page.faq"
      defaults={{
        title: 'Frequently Asked Questions',
        intro: 'Quick answers to the questions our customers ask most.',
        sections: [
          {
            heading: 'Are your sneakers 100% authentic?',
            body: 'Yes. Every pair is verified by hand by our team in Riyadh and Cairo before it goes on sale. We only buy directly from authenticated channels and trusted resellers.',
          },
          {
            heading: 'How is "Last Piece" different from other sneaker stores?',
            body: 'We carry one pair per item. When you buy a pair from us, you are buying the only one in our inventory — there is no "restock". This is part of the brand promise.',
          },
          {
            heading: 'Where do you ship?',
            body: 'We ship anywhere in Egypt. For customers in Saudi Arabia or other GCC countries, please contact us on WhatsApp.',
          },
          {
            heading: 'Can I visit a physical boutique?',
            body: 'Yes — our boutique is in New Cairo. Address available on request. We also operate from Riyadh and Jeddah for sourcing and curation.',
          },
          {
            heading: 'How long does delivery take?',
            body: 'Within Cairo: 1-2 working days. Other governorates in Egypt: 2-4 working days.',
          },
          {
            heading: 'What payment methods do you accept?',
            body: 'Credit/debit card (Visa, Mastercard), Cash on Delivery, and bank transfer. In-boutique we also accept cash.',
          },
        ],
      }}
    />
  );
}
