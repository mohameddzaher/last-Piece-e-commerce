
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setFormData({ name: '', email: '', message: '' });
      toast.success('Message sent successfully!');
    }, 1000);
  };

  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Header */}
      <div className='bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <h1 className='text-2xl font-bold text-white mb-2'>Contact Us</h1>
          <p className='text-gray-400 text-xs'>We'd love to hear from you</p>
        </div>
      </div>

      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className='text-xl font-bold text-white mb-6'>Get in Touch</h2>
            <div className='space-y-4'>
              <div className='flex gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg'>
                <div className='p-2 bg-blue-500/10 rounded-lg'>
                  <FiMail className='text-blue-400' size={18} />
                </div>
                <div>
                  <h3 className='font-semibold text-white text-sm'>Email</h3>
                  <a href='mailto:info@lastpiece.com' className='text-gray-400 text-xs hover:text-blue-400 transition-colors'>
                    Info@lastpiece.com
                  </a>
                </div>
              </div>
              <div className='flex gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg'>
                <div className='p-2 bg-green-500/10 rounded-lg'>
                  <FiPhone className='text-green-400' size={18} />
                </div>
                <div>
                  <h3 className='font-semibold text-white text-sm'>Phone</h3>
                  <a href='tel:+15551234567' className='text-gray-400 text-xs hover:text-green-400 transition-colors'>
                    +966 53 848 6109
                  </a>
                </div>
              </div>
              <div className='flex gap-3 p-4 bg-slate-900 border border-slate-800 rounded-lg'>
                <div className='p-2 bg-purple-500/10 rounded-lg'>
                  <FiMapPin className='text-purple-400' size={18} />
                </div>
                <div>
                  <h3 className='font-semibold text-white text-sm'>Address</h3>
                  <p className='text-gray-400 text-xs'>
                    Jeddah, Saudi Arabia
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className='mt-6 p-4 bg-slate-900 border border-slate-800 rounded-lg'>
              <h3 className='font-semibold text-white text-sm mb-3'>Business Hours</h3>
              <div className='space-y-1 text-xs text-gray-400'>
                <div className='flex justify-between'>
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className='flex justify-between'>
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className='flex justify-between'>
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit}
            className='bg-slate-900 border border-slate-800 rounded-xl p-6'
          >
            <h2 className='text-xl font-bold text-white mb-6'>Send a Message</h2>
            <div className='space-y-4'>
              <div>
                <label className='block text-xs font-medium text-gray-400 mb-1.5'>Name</label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  placeholder='Your name'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-400 mb-1.5'>Email</label>
                <input
                  type='email'
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  placeholder='you@example.com'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-400 mb-1.5'>Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className='w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none'
                  placeholder='How can we help you?'
                ></textarea>
              </div>
              <button
                type='submit'
                disabled={loading}
                className='w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors'
              >
                {loading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend size={14} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
