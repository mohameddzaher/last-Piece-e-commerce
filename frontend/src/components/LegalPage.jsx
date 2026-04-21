'use client';

import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import SEO from './SEO';
import { useSiteContent, pick } from '@/utils/useSiteContent';

/**
 * Renders a content page driven entirely by SiteContent CMS.
 * Pass a `cmsKey` (e.g. 'page.faq') and a `defaults` object with
 *   { title, intro, sections: [{ heading, body }] }
 * Editors update the entry in the admin CMS, the page reflows live.
 */
export default function LegalPage({ cmsKey, defaults, breadcrumb }) {
  const cms = useSiteContent();
  const data = cms[cmsKey] || {};
  const title = pick(data, 'title', defaults.title);
  const intro = pick(data, 'intro', defaults.intro);
  const sections = pick(data, 'sections', defaults.sections) || [];

  return (
    <>
      <SEO title={`${title} · Last Piece`} description={intro} />
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-10 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Link href="/" className="hover:text-slate-900 inline-flex items-center gap-1">
            <FiHome size={10} /> Home
          </Link>
          <FiChevronRight size={10} />
          <span className="text-slate-900">{breadcrumb || title}</span>
        </div>
      </nav>

      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-slate-900">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
          {intro && <p className="mt-3 text-sm text-slate-600 leading-relaxed">{intro}</p>}

          <div className="mt-8 space-y-6">
            {sections.map((s, i) => (
              <section key={i} className="border-t border-slate-200 pt-6">
                <h2 className="text-lg font-bold text-slate-900 mb-2">{s.heading}</h2>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 text-[11px] text-slate-400">
            Need more detail? <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
