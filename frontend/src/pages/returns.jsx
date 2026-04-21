import LegalPage from '@/components/LegalPage';

export default function Returns() {
  return (
    <LegalPage
      cmsKey="page.returns"
      defaults={{
        title: 'Returns & Exchanges',
        intro: 'A fair, simple policy that respects the limited nature of our pairs.',
        sections: [
          {
            heading: 'Return window',
            body: 'You can return any pair within 7 days of receiving it. The pair must be in the exact condition we shipped it — unworn, with original box and tags.',
          },
          {
            heading: 'Exchanges',
            body: 'Because every pair is one-of-one in our inventory, we cannot guarantee a like-for-like exchange. We will help you find another pair from our current collection or issue a refund.',
          },
          {
            heading: 'How to start a return',
            body: 'WhatsApp our team or use the contact form. Provide your order number and the reason for return. We schedule pickup within 1–2 working days.',
          },
          {
            heading: 'Refund timing',
            body: 'Once we receive the pair and verify its condition, refunds are issued within 3–5 working days, back to the original payment method.',
          },
          {
            heading: 'What we do not refund',
            body: 'Pairs that show signs of wear, damage, or missing original packaging. Any item bought at the boutique can be exchanged for store credit but not refunded in cash.',
          },
        ],
      }}
    />
  );
}
