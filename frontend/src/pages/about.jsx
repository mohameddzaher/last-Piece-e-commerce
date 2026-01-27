
import { FiCheckCircle, FiAward, FiUsers, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function About() {
  return (
    <div className='min-h-screen bg-slate-950'>
      {/* Header */}
      <div className='bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <h1 className='text-2xl font-bold text-white mb-2'>About Us</h1>
          <p className='text-gray-400 text-xs'>The story behind Last Piece</p>
        </div>
      </div>

      <div className='max-w-5xl mx-auto px-4 py-10'>
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center mb-12'
        >
          <h2 className='text-3xl font-bold text-white mb-4'>One Pair. One Owner.</h2>
          <p className='text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed'>
            At Last Piece, we believe every sneaker tells a story. We curate exclusive, one-of-a-kind pairs
            for collectors who appreciate authenticity and uniqueness. When you buy from us, you're getting
            the only pair in existence.
          </p>
        </motion.section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-12'
        >
          {[
            { value: '500+', label: 'Unique Pairs Sold' },
            { value: '100%', label: 'Authentic Products' },
            { value: '24/7', label: 'Customer Support' },
            { value: '5K+', label: 'Happy Collectors' },
          ].map((stat, idx) => (
            <div key={idx} className='text-center p-4 bg-slate-900 border border-slate-800 rounded-lg'>
              <p className='text-2xl font-bold text-blue-400'>{stat.value}</p>
              <p className='text-gray-500 text-xs'>{stat.label}</p>
            </div>
          ))}
        </motion.section>

        {/* Story */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12'
        >
          <div>
            <h3 className='text-xl font-bold text-white mb-4'>Our Story</h3>
            <p className='text-gray-400 text-sm mb-4 leading-relaxed'>
              Last Piece was born from a passion for sneaker culture and the frustration of seeing
              mass-produced shoes everywhere. We wanted to create something different - a place where
              each pair is truly special.
            </p>
            <p className='text-gray-400 text-sm leading-relaxed'>
              Every sneaker in our collection is carefully sourced, verified for authenticity, and
              available in limited quantities. Most items are literally the last piece in existence.
            </p>
          </div>
          <div className='bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-slate-800 rounded-xl h-48 flex items-center justify-center'>
            <span className='text-4xl'>👟</span>
          </div>
        </motion.section>

        {/* Values */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='mb-12'
        >
          <h3 className='text-xl font-bold text-white text-center mb-6'>Our Values</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {[
              {
                icon: FiShield,
                title: 'Authenticity',
                desc: 'Every item is verified and guaranteed 100% authentic',
                color: 'blue'
              },
              {
                icon: FiAward,
                title: 'Quality',
                desc: 'Premium sneakers from trusted sources worldwide',
                color: 'green'
              },
              {
                icon: FiUsers,
                title: 'Community',
                desc: 'Building a community of passionate collectors',
                color: 'purple'
              },
            ].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className='bg-slate-900 border border-slate-800 p-5 rounded-xl'
              >
                <div className={`p-2 bg-${value.color}-500/10 rounded-lg w-fit mb-3`}>
                  <value.icon className={`text-${value.color}-400`} size={20} />
                </div>
                <h4 className='text-base font-semibold text-white mb-2'>{value.title}</h4>
                <p className='text-gray-500 text-xs'>{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='text-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-slate-800 rounded-xl p-8'
        >
          <h3 className='text-xl font-bold text-white mb-2'>Ready to Find Your Last Piece?</h3>
          <p className='text-gray-400 text-sm mb-4'>Browse our exclusive collection of one-of-a-kind sneakers</p>
          <a
            href='/products'
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors'
          >
            Shop Now
          </a>
        </motion.section>
      </div>
    </div>
  );
}
