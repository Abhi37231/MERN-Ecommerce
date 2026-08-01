/**
 * Product.js — Product Mongoose Model
 *
 * Why this model exists:
 *  The central entity of the e-commerce platform. Every item for sale
 *  lives here with full commercial metadata.
 *
 * Key design decisions:
 *  - slug: SEO-friendly URL identifier (auto-generated from name)
 *  - images[]: array of Cloudinary objects, first image is the primary
 *  - variants[]: size/color combinations each with their own stock count
 *  - ratingsAverage + ratingsCount: denormalized from reviews for
 *    fast product listing queries (no $lookup needed)
 *  - discountedPrice: virtual computed from price + discountPercentage
 *  - tags[]: flexible keyword array for search
 *  - isFeatured: admin can manually feature products on homepage
 *  - stock: top-level stock for non-variant products
 *
 * Indexes:
 *  - slug: unique (route params)
 *  - category: for category filtering
 *  - text index on name/description: full-text search
 *  - ratingsAverage + price: for sorting
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true },
    color: { type: String, trim: true },
    colorHex: { type: String, trim: true },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: { type: String, trim: true },
    priceAdjustment: { type: Number, default: 0 }, // +/- from base price
  },
  { _id: true }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      // Note: `unique: true` auto-creates an index, no need for explicit `index: true`
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'A product can have at most 10 images',
      },
    },
    variants: [variantSchema],
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows multiple null values
    },
    tags: {
      type: [String],
      index: true,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10, // 4.666... → 4.7
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    codAvailable: {
      type: Boolean,
      default: true,
    },
    isNewArrival: {
      type: Boolean,
      default: true,
    },
    weight: {
      type: Number, // in grams
      min: [0, 'Weight cannot be negative'],
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ['cm', 'in'], default: 'cm' },
    },
    shippingInfo: {
      isFreeShipping: { type: Boolean, default: false },
      estimatedDays: { type: Number, default: 5 },
    },
    metaTitle: {
      type: String,
      maxlength: [70, 'Meta title cannot exceed 70 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    soldCount: {
      type: Number,
      default: 0, // incremented on each order
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Full-text search
productSchema.index({ ratingsAverage: -1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isTrending: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });

// ─── Virtuals ────────────────────────────────────────────────────────────────

/** Discounted price — computed from price and discountPercentage */
productSchema.virtual('discountedPrice').get(function () {
  if (!this.discountPercentage) return this.price;
  return Math.round(this.price * (1 - this.discountPercentage / 100));
});

/** Discount amount in rupees */
productSchema.virtual('discountAmount').get(function () {
  return Math.round(this.price * (this.discountPercentage / 100));
});

/** Primary image (first image with isPrimary=true, or first image) */
productSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;
  return this.images.find((img) => img.isPrimary) || this.images[0];
});

/** isInStock — true if top-level stock > 0 */
productSchema.virtual('isInStock').get(function () {
  return this.stock > 0;
});

// ─── Pre-save Hook — Auto-generate slug ──────────────────────────────────────
productSchema.pre('save', async function () {
  if (!this.isModified('name')) return;

  let baseSlug = slugify(this.name, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let count = 1;

  // Ensure uniqueness by appending a number if slug already exists
  while (await Product.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${count++}`;
  }

  this.slug = slug;
});

/** Auto-set first image as primary if none is marked */
productSchema.pre('save', function () {
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some((img) => img.isPrimary);
    if (!hasPrimary) this.images[0].isPrimary = true;
  }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
