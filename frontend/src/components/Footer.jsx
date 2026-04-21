'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  FiInstagram, FiMail, FiMapPin, FiTruck, FiShield,
  FiRefreshCw, FiCreditCard, FiClock, FiMessageCircle,
} from 'react-icons/fi';
import { useSiteContent, pick } from '@/utils/useSiteContent';
import { useI18n } from '@/utils/i18n';

export default function Footer() {
  const cms = useSiteContent();
  const config = cms['contact.config'] || {};
  const footerAbout = cms['footer.about'] || {};
  const t = useI18n((s) => s.t);

  const currentYear = new Date().getFullYear();
  const supportEmail = pick(config, 'email', 'support@lastpiece.com');
  const whatsapp = pick(config, 'whatsapp', '+20 100 000 0001');
  const instagram = pick(config, 'instagram', '@lastpiece');
  const hours = pick(config, 'hours', '24/7 · Online support every day');

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      {/* Trust Badges */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { Icon: FiTruck, color: 'text-blue-400 bg-blue-500/10', title: t('footer.trust.shipping.title', 'Egypt-wide shipping'), sub: t('footer.trust.shipping.sub', 'Fast & insured') },
              { Icon: FiShield, color: 'text-emerald-400 bg-emerald-500/10', title: t('footer.trust.authentic.title', '100% Authentic'), sub: t('footer.trust.authentic.sub', 'Verified by hand') },
              { Icon: FiRefreshCw, color: 'text-purple-400 bg-purple-500/10', title: t('footer.trust.returns.title', '7-day Returns'), sub: t('footer.trust.returns.sub', 'Boutique exchanges') },
              { Icon: FiCreditCard, color: 'text-amber-400 bg-amber-500/10', title: t('footer.trust.secure.title', 'Secure Checkout'), sub: t('footer.trust.secure.sub', 'SSL encrypted') },
            ].map(({ Icon, color, title, sub }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${color}`}><Icon size={14} /></div>
                <div>
                  <p className="text-white text-xs font-semibold">{title}</p>
                  <p className="text-gray-500 text-[10px]">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-3" aria-label="Last Piece home">
              <Image
                src="/images/logo.png"
                alt="Last Piece"
                width={160}
                height={80}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-400 text-xs leading-relaxed mb-4 max-w-sm">
              {pick(footerAbout, 'body', t('footer.aboutBody', 'A Khaleeji luxury sneaker boutique. Born in Riyadh, now serving Egypt.'))}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <a
                href={`https://instagram.com/${instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Instagram"
              >
                <FiInstagram size={14} />
              </a>
              <a
                href={`https://wa.me/${whatsapp.replace(/[^\d+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="WhatsApp"
              >
                <FiMessageCircle size={14} />
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="p-2 bg-slate-800 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
                aria-label="Email"
              >
                <FiMail size={14} />
              </a>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
              <FiClock size={10} /> {hours}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-white mb-3">{t('footer.shop', 'Shop')}</h4>
            <ul className="space-y-2">
              {[
                { href: '/products', label: t('footer.links.allProducts', 'All Products') },
                { href: '/products?gender=men', label: t('footer.links.men', 'Men') },
                { href: '/products?gender=women', label: t('footer.links.women', 'Women') },
                { href: '/products?gender=kids', label: t('footer.links.kids', 'Kids') },
                { href: '/products?sort=-createdAt', label: t('footer.links.newArrivals', 'New Arrivals') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-xs">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-white mb-3">{t('footer.help', 'Help')}</h4>
            <ul className="space-y-2">
              {[
                { href: '/contact', label: t('footer.links.contact', 'Contact Us') },
                { href: '/track-order', label: t('footer.links.trackOrder', 'Track My Order') },
                { href: '/faq', label: t('footer.links.faq', 'FAQ') },
                { href: '/shipping', label: t('footer.links.shipping', 'Shipping & Delivery') },
                { href: '/returns', label: t('footer.links.returns', 'Returns & Exchanges') },
                { href: '/size-guide', label: t('footer.links.sizeGuide', 'Size Guide') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-xs">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-white mb-3">{t('footer.company', 'Company')}</h4>
            <ul className="space-y-2">
              {[
                { href: '/about', label: t('footer.links.ourStory', 'Our Story') },
                { href: '/contact', label: t('footer.links.locations', 'Locations') },
                { href: '/privacy', label: t('footer.links.privacy', 'Privacy Policy') },
                { href: '/terms', label: t('footer.links.terms', 'Terms of Service') },
                { href: '/cookies', label: t('footer.links.cookies', 'Cookies') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-xs">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Locations strip */}
        <div className="mt-10 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            { city: `${t('nav.riyadh', 'Riyadh')} 🇸🇦`, detail: t('footer.branch', 'Branch') },
            { city: `${t('nav.jeddah', 'Jeddah')} 🇸🇦`, detail: t('footer.branch', 'Branch') },
            { city: `${t('nav.cairo', 'Cairo')} 🇪🇬`, detail: t('footer.branchCairo', 'Branch · Delivery everywhere in Cairo') },
          ].map((l) => (
            <div key={l.city} className="flex items-center gap-2 text-gray-400">
              <FiMapPin size={11} className="text-amber-400" />
              <span className="text-white font-semibold">{l.city}</span>
              <span className="text-gray-500">· {l.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-gray-500 text-xs">
            &copy; {currentYear} Last Piece. {t('footer.rights', 'All rights reserved.')}
          </p>
          <p className="text-gray-500 text-[10px]">
            {t('footer.madeWith', 'Made with care between the Khaleej and Cairo.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
