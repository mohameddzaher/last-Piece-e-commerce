'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiAward, FiUsers, FiShield, FiArrowRight } from 'react-icons/fi';
import SEO from '@/components/SEO';
import { useSiteContent, pick } from '@/utils/useSiteContent';
import { useI18n } from '@/utils/i18n';

export default function About() {
  const cms = useSiteContent();
  const story = cms['about.story'] || {};
  const t = useI18n((s) => s.t);

  const locations = [
    { city: t('contact.locations.riyadh', 'Riyadh'), country: t('contact.saudi', 'Saudi Arabia'), role: t('about.branchRole', 'Branch'), flag: '🇸🇦' },
    { city: t('contact.locations.jeddah', 'Jeddah'), country: t('contact.saudi', 'Saudi Arabia'), role: t('about.branchRole', 'Branch'), flag: '🇸🇦' },
    { city: t('contact.locations.cairo', 'Cairo'), country: t('contact.egypt', 'Egypt'), role: t('about.branchRoleCairo', 'Branch · Delivery across Cairo'), flag: '🇪🇬' },
  ];

  return (
    <>
      <SEO title={`${t('about.seoTitle', 'About Us')} · Last Piece`} description={t('about.seoDesc', 'A Khaleeji luxury sneaker boutique.')} />

      {/* HERO */}
      <section className="relative bg-slate-950 border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-10 md:py-14 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-2">{t('about.eyebrow', 'OUR STORY')}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {t('about.heroTitle', 'One Pair. One Owner.')}
          </h1>
          <p className="text-xs md:text-sm text-gray-300 max-w-xl mx-auto mt-2 leading-relaxed">
            {t('about.heroSubtitle', 'A Khaleeji luxury sneaker boutique.')}
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { value: '500+', label: t('about.stats.pairs', 'Pairs Curated') },
            { value: '100%', label: t('about.stats.authentic', 'Authentic') },
            { value: '3', label: t('about.stats.branches', 'Branches') },
            { value: '24/7', label: t('about.stats.support', 'Customer Care') },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-center p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <p className="text-lg md:text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch">
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[280px]">
            <Image
              src={pick(story, 'image', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=85')}
              alt="Our story"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="p-5 md:p-8 flex flex-col justify-center text-slate-900">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-2">
              {pick(story, 'eyebrow', t('about.storyEyebrow', 'OUR STORY'))}
            </div>
            <h2 className="text-lg md:text-xl font-bold mb-2 leading-tight">
              {pick(story, 'title', t('about.storyTitle', 'Born in the Khaleej. Curated for Cairo.'))}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              {pick(story, 'p1', t('about.storyP1', 'Last Piece started as a private collection in Riyadh.'))}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {pick(story, 'p2', t('about.storyP2', 'Today, we bring the same standards to Egypt.'))}
            </p>
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-1">{t('about.branchesEyebrow', 'OUR BRANCHES')}</div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">{t('about.branchesTitle', 'In the Khaleej & in Cairo')}</h2>
            <p className="text-[11px] text-slate-500 mt-1">{t('about.branchesSubtitle', 'Three branches. Delivery anywhere in Cairo.')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {locations.map((l) => (
              <div key={l.city} className="p-4 bg-white border border-slate-200 rounded-lg text-center">
                <div className="text-xl mb-1">{l.flag}</div>
                <h3 className="text-sm font-bold text-slate-900">{l.city}</h3>
                <p className="text-[10px] text-slate-500">{l.country}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider font-semibold text-blue-600">{l.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-5">{t('about.valuesTitle', 'Our Values')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { icon: FiShield, title: t('about.values.authenticity.title', 'Authenticity'), desc: t('about.values.authenticity.desc', 'Every pair verified by hand.'), color: 'text-blue-400 bg-blue-500/10' },
              { icon: FiAward, title: t('about.values.unique.title', 'Unique pieces'), desc: t('about.values.unique.desc', "Pieces you won't find anywhere else."), color: 'text-amber-400 bg-amber-500/10' },
              { icon: FiUsers, title: t('about.values.trust.title', 'Trust'), desc: t('about.values.trust.desc', 'Relationships first.'), color: 'text-emerald-400 bg-emerald-500/10' },
            ].map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="p-4 bg-slate-900 border border-slate-800 rounded-lg"
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${v.color}`}>
                  <v.icon size={14} />
                </div>
                <h3 className="text-sm font-bold mb-0.5">{v.title}</h3>
                <p className="text-[11px] text-gray-400">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{t('about.ctaTitle', 'Ready to find your Last Piece?')}</h2>
          <p className="text-xs text-slate-500 mb-4">{t('about.ctaSubtitle', 'Browse our curated, one-of-a-kind collection.')}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 h-9 px-5 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800"
          >
            {t('about.ctaButton', 'Shop the Collection')} <FiArrowRight size={12} className='rtl:rotate-180' />
          </Link>
        </div>
      </section>
    </>
  );
}
