/**
 * Category.js — Category Mongoose Model
 *
 * Why this model exists:
 *  Products are organized into categories (Electronics, Clothing, etc.).
 *  Categories support nesting: a "Laptops" sub-category under "Electronics".
 *
 * Key design decisions:
 *  - slug: URL-friendly identifier generated from name (e.g. "men-s-clothing")
 *    Used in frontend URLs instead of MongoDB ObjectId for SEO
 *  - parent: self-referential ref enables unlimited nesting depth
 *  - isActive: soft disable without deleting (admin can toggle)
 *  - sortOrder: for manual ordering on homepage
 *
 * Indexes:
 *  - slug: unique (used in API routes /categories/:slug)
 *  - parent: indexed for fast child category lookups
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      // Note: `unique: true` auto-creates an index, no need for explicit `index: true`
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // null = top-level category
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0, // Lower number = appears first
    },
    metaTitle: {
      type: String,
      maxlength: [70, 'Meta title cannot exceed 70 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

// ─── Virtuals ────────────────────────────────────────────────────────────────

/** Virtual to populate child categories */
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// ─── Pre-save Hook — Auto-generate slug ──────────────────────────────────────
categorySchema.pre('save', function () {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true, // remove special chars
      trim: true,
    });
  }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
