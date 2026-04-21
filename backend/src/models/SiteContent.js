import mongoose from 'mongoose';

/**
 * CMS for the public website. Every text/image/section the user can edit
 * from the admin panel lives here as a key/value or structured block.
 *
 * Convention: `key` is namespaced like "home.hero.title", "home.categories.heading".
 * `value` is JSON — could be a string, an object, an array of slides, etc.
 * `i18n` holds per-language overrides: { en: ..., ar: ... }.
 */
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    section: { type: String, index: true }, // e.g., "home", "about", "footer"
    label: String,
    type: {
      type: String,
      enum: ['text', 'rich-text', 'image', 'image-list', 'cta', 'slides', 'json'],
      default: 'text',
    },
    value: mongoose.Schema.Types.Mixed,
    i18n: {
      en: mongoose.Schema.Types.Mixed,
      ar: mongoose.Schema.Types.Mixed,
    },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

siteContentSchema.index({ section: 1, order: 1 });

export default mongoose.model('SiteContent', siteContentSchema);
