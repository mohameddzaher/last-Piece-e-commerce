import LegalPage from '@/components/LegalPage';

export default function Terms() {
  return (
    <LegalPage
      cmsKey="page.terms"
      defaults={{
        title: 'Terms of Service',
        intro: 'The terms that govern your use of Last Piece.',
        sections: [
          {
            heading: 'Account',
            body: 'You are responsible for keeping your password safe and for all activity under your account. Tell us immediately if you believe your account has been compromised.',
          },
          {
            heading: 'Orders & pricing',
            body: 'Prices on the website are in EGP unless stated otherwise. We reserve the right to cancel an order if a pricing or stock error is identified.',
          },
          {
            heading: 'Authenticity guarantee',
            body: 'Every pair we sell is 100% authentic. If you ever doubt the authenticity of a pair you bought from us, contact us — we will arrange independent verification at no cost to you.',
          },
          {
            heading: 'Intellectual property',
            body: 'All branding, photos, and copy on this site are the property of Last Piece. The brand logos of carried houses (Nike, Air Jordan, Yeezy, Balenciaga, etc.) belong to their respective owners.',
          },
          {
            heading: 'Limitation of liability',
            body: 'Last Piece is not liable for indirect or consequential damages. Our maximum liability is limited to the value of the order in question.',
          },
          {
            heading: 'Governing law',
            body: 'These terms are governed by the laws of the Arab Republic of Egypt for Egypt-based transactions, and the laws of the Kingdom of Saudi Arabia for KSA-based transactions.',
          },
        ],
      }}
    />
  );
}
