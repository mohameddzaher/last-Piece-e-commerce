import LegalPage from '@/components/LegalPage';

export default function Cookies() {
  return (
    <LegalPage
      cmsKey="page.cookies"
      defaults={{
        title: 'Cookie Policy',
        intro: 'How we use cookies on lastpiece.com.',
        sections: [
          {
            heading: 'What are cookies?',
            body: 'Cookies are small text files stored in your browser. They allow the site to remember information about you between visits.',
          },
          {
            heading: 'Cookies we use',
            body: '• Essential: keep you logged in, remember your cart, store your language preference.\n• Analytics: help us understand which products are popular and where the site can be improved.\n• Marketing: occasionally used to deliver relevant ads off-site.',
          },
          {
            heading: 'Your control',
            body: 'You can clear cookies any time from your browser settings. Note that essential cookies are required for checkout to work.',
          },
        ],
      }}
    />
  );
}
