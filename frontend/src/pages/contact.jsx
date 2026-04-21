'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock, FiInstagram, FiMessageCircle, FiAward } from 'react-icons/fi';
import SEO from '@/components/SEO';
import { useSiteContent, pick } from '@/utils/useSiteContent';
import { useI18n } from '@/utils/i18n';

export default function Contact() {
  const cms = useSiteContent();
  const config = cms['contact.config'] || {};
  const t = useI18n((s) => s.t);

  const defaultLocations = [
    { city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', role: 'Branch', address: 'King Fahd Rd, Riyadh', phone: '+966 50 000 0001' },
    { city: 'Jeddah', country: 'Saudi Arabia', flag: '🇸🇦', role: 'Branch', address: 'Tahlia St, Jeddah', phone: '+966 50 000 0002' },
    { city: 'Cairo', country: 'Egypt', flag: '🇪🇬', role: 'Branch · Online HQ', address: 'New Cairo (address on request)', phone: '+20 100 000 0001' },
  ];

  const locations = pick(config, 'locations', defaultLocations);
  const supportEmail = pick(config, 'email', 'support@lastpiece.com');
  const instagram = pick(config, 'instagram', '@lastpiece');
  const whatsapp = pick(config, 'whatsapp', '+20 100 000 0001');
  const hours = pick(config, 'hours', 'Open 24/7 · Reply within minutes');

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.warn(t('contact.fillRequired', 'Please fill in name, email and message'));
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      toast.success(t('contact.messageSent', "Got it — we'll get back to you shortly."));
      setForm({ name: '', email: '', subject: '', message: '' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SEO title={`${t('contact.seoTitle', 'Contact')} · Last Piece`} description={t('contact.seoDesc', 'Talk to Last Piece.')} />

      {/* HERO */}
      <section className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-1.5">{t('contact.eyebrow', 'SAY HELLO')}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{t('contact.heroTitle', 'Get in Touch')}</h1>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
            {t('contact.heroSubtitle', "Looking for a unique pair you can't find anywhere else? You're in the right place.")}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[11px] font-semibold">
            <FiClock size={11} /> {hours}
          </div>
        </div>
      </section>

      {/* QUICK CONTACT */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { Icon: FiMail, label: t('contact.email', 'Email'), value: supportEmail, href: `mailto:${supportEmail}`, color: 'text-blue-600 bg-blue-500/10' },
            { Icon: FiMessageCircle, label: t('contact.whatsapp', 'WhatsApp'), value: whatsapp, href: `https://wa.me/${whatsapp.replace(/[^\d+]/g, '')}`, color: 'text-emerald-600 bg-emerald-500/10' },
            { Icon: FiInstagram, label: t('contact.instagram', 'Instagram'), value: instagram, href: `https://instagram.com/${instagram.replace('@', '')}`, color: 'text-pink-600 bg-pink-500/10' },
          ].map(({ Icon, label, value, href, color }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
                <Icon size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                <div className="text-[11px] font-bold text-slate-900 truncate">{value}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mb-1">{t('contact.branchesEyebrow', 'OUR BRANCHES')}</div>
            <h2 className="text-xl md:text-2xl font-bold">{t('contact.branchesTitle', 'Saudi Arabia & Egypt')}</h2>
            <p className="text-[11px] text-gray-400 mt-1">
              {t('contact.branchesSubtitle', 'Three branches. We deliver anywhere in Cairo and across Egypt.')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {locations.map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg leading-none">{l.flag}</span>
                  <h3 className="text-sm font-bold">{l.city}</h3>
                </div>
                <p className="text-[10px] text-gray-500">{l.country}</p>
                <div className="mt-1.5 space-y-1 text-[11px] text-gray-300">
                  {l.address && (
                    <div className="flex items-start gap-1.5">
                      <FiMapPin className="mt-0.5 text-gray-500 shrink-0" size={10} />
                      <span>{l.address}</span>
                    </div>
                  )}
                  {l.phone && (
                    <div className="flex items-center gap-1.5">
                      <FiPhone className="text-gray-500 shrink-0" size={10} />
                      <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="hover:text-white">{l.phone}</a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* UNIQUENESS BANNER */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-700 text-[11px] font-semibold">
            <FiAward size={11} /> {t('contact.uniquenessBanner', "Each pair is the only one in our boutique. You won't find it anywhere else.")}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-5 md:p-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-1">{t('contact.formEyebrow', 'SEND A MESSAGE')}</div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">{t('contact.formTitle', 'We read every one')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                placeholder={t('contact.yourName', 'Your name')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 h-9 text-xs rounded-md bg-slate-50 border border-slate-200 focus:border-slate-900 focus:outline-none"
              />
              <input
                type="email"
                placeholder={t('contact.emailAddress', 'Email')}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-3 h-9 text-xs rounded-md bg-slate-50 border border-slate-200 focus:border-slate-900 focus:outline-none"
              />
            </div>
            <input
              placeholder={t('contact.subject', 'Subject')}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 h-9 text-xs rounded-md bg-slate-50 border border-slate-200 focus:border-slate-900 focus:outline-none mb-2"
            />
            <textarea
              placeholder={t('contact.messagePlaceholder', 'What can we help with?')}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 text-xs rounded-md bg-slate-50 border border-slate-200 focus:border-slate-900 focus:outline-none mb-3"
            />
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-5 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              <FiSend size={12} />
              {sending ? t('contact.sending', 'Sending...') : t('contact.sendMessage', 'Send Message')}
            </button>
            <p className="text-[10px] text-slate-400 mt-2">
              {t('contact.responseNote', 'We respond within hours. WhatsApp is fastest.')}
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
