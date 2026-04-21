import LegalPage from '@/components/LegalPage';

export default function Privacy() {
  return (
    <LegalPage
      cmsKey="page.privacy"
      defaults={{
        title: 'Privacy Policy',
        intro: 'How Last Piece collects, uses, and protects your data.',
        sections: [
          {
            heading: 'What we collect',
            body: 'Your name, email, phone, shipping address, order history, and basic browsing analytics. We do not store full payment card numbers — those are handled directly by our payment processor (Stripe).',
          },
          {
            heading: 'How we use it',
            body: 'To process your orders, deliver your pairs, contact you about your account, and improve the site. We never sell your data.',
          },
          {
            heading: 'Marketing',
            body: 'If you opt in to our newsletter, we use your email to send drop announcements. You can unsubscribe at any time from any email we send.',
          },
          {
            heading: 'Cookies',
            body: 'We use first-party cookies to keep you logged in and to remember your cart. We use third-party analytics cookies (anonymised) to understand site usage.',
          },
          {
            heading: 'Your rights',
            body: 'You can request your data, correct it, or delete it by emailing privacy@lastpiece.com.',
          },
        ],
      }}
    />
  );
}
