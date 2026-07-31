/**
 * productController.js — Product Controller
 *
 * GET    /                — getProducts (public, with search/filter/sort/paginate)
 * GET    /featured        — getFeaturedProducts (public)
 * GET    /trending        — getTrendingProducts (public)
 * GET    /new-arrivals    — getNewArrivals (public)
 * GET    /:slug           — getProductBySlug (public)
 * GET    /:id/related     — getRelatedProducts (public)
 * POST   /                — createProduct (admin)
 * PUT    /:id             — updateProduct (admin)
 * DELETE /:id             — deleteProduct (admin)
 * PATCH  /:id/stock       — updateStock (admin)
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const RestockRequest = require('../models/RestockRequest');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess, paginate } = require('../utils/apiResponse');

// ─── Query Helper ─────────────────────────────────────────────────────────────

/**
 * Build a Mongoose filter query from URL query parameters.
 * Supports: search, category, brand, minPrice, maxPrice, inStock, rating, tags
 */
const buildProductFilter = (query) => {
  const filter = { isActive: true };

  // Full-text search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // Category filter
  if (query.category) {
    filter.category = query.category;
  }

  // Brand filter
  if (query.brand) {
    filter.brand = { $regex: query.brand, $options: 'i' };
  }

  // Price range
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  // In-stock filter
  if (query.inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  // Minimum rating filter
  if (query.rating) {
    filter.ratingsAverage = { $gte: Number(query.rating) };
  }

  // Tags filter
  if (query.tags) {
    const tagsArray = query.tags.split(',').map((t) => t.trim());
    filter.tags = { $in: tagsArray };
  }

  return filter;
};

/**
 * Build sort object from sortBy query param.
 * Supported: newest, oldest, price-asc, price-desc, rating, popular, featured
 */
const buildSortQuery = (sortBy) => {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { ratingsAverage: -1 },
    popular: { soldCount: -1 },
    featured: { isFeatured: -1, createdAt: -1 },
  };
  return sortMap[sortBy] || { createdAt: -1 };
};

// ─── Controller Functions ─────────────────────────────────────────────────────

/**
 * @desc    Get all products with filtering, sorting, and pagination
 * @route   GET /api/v1/products
 * @access  Public
 * @query   search, category, brand, minPrice, maxPrice, inStock, rating,
 *          tags, sortBy, page, limit
 */
const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const filter = buildProductFilter(req.query);
  const sort = buildSortQuery(req.query.sortBy);

  // Add text score to sort if text search is active
  let query = Product.find(filter)
    .populate('category', 'name slug')
    .select('-__v')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (req.query.search) {
    query = query.select({ score: { $meta: 'textScore' } });
  }

  const [products, total] = await Promise.all([
    query,
    Product.countDocuments(filter),
  ]);

  sendSuccess(
    res,
    200,
    'Products retrieved.',
    { products },
    paginate(page, limit, total)
  );
});

/**
 * @desc    Get featured products for homepage
 * @route   GET /api/v1/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const products = await Product.find({ isFeatured: true, isActive: true, stock: { $gt: 0 } })
    .populate('category', 'name slug')
    .select('-__v -description')
    .sort({ createdAt: -1 })
    .limit(limit);

  sendSuccess(res, 200, 'Featured products retrieved.', { products });
});

/**
 * @desc    Get trending products
 * @route   GET /api/v1/products/trending
 * @access  Public
 */
const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const products = await Product.find({ isTrending: true, isActive: true, stock: { $gt: 0 } })
    .populate('category', 'name slug')
    .select('-__v -description')
    .sort({ soldCount: -1 })
    .limit(limit);

  sendSuccess(res, 200, 'Trending products retrieved.', { products });
});

/**
 * @desc    Get new arrivals
 * @route   GET /api/v1/products/new-arrivals
 * @access  Public
 */
const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const products = await Product.find({ isNewArrival: true, isActive: true })
    .populate('category', 'name slug')
    .select('-__v -description')
    .sort({ createdAt: -1 })
    .limit(limit);

  sendSuccess(res, 200, 'New arrivals retrieved.', { products });
});

/**
 * @desc    Get a product by its slug
 * @route   GET /api/v1/products/:slug
 * @access  Public
 */
const getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug parent')
    .select('-__v');

  if (!product) {
    return next(new AppError('Product not found.', 404));
  }

  sendSuccess(res, 200, 'Product retrieved.', { product });
});

/**
 * @desc    Get related products (same category, exclude current)
 * @route   GET /api/v1/products/:id/related
 * @access  Public
 */
const getRelatedProducts = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .select('-__v -description')
    .populate('category', 'name slug')
    .sort({ ratingsAverage: -1 })
    .limit(6);

  sendSuccess(res, 200, 'Related products retrieved.', { products: related });
});

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Admin
 */
const createProduct = asyncHandler(async (req, res, next) => {
  const {
    name, description, shortDescription, price, discountPercentage,
    category, brand, stock, sku, tags, variants, isFeatured,
    isTrending, weight, dimensions, shippingInfo, metaTitle, metaDescription,
  } = req.body;

  // Validate category exists
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) {
    return next(new AppError('Category not found.', 404));
  }

  // Build images array from Cloudinary uploads
  const images = req.files
    ? req.files.map((file, index) => ({
        url: file.path,
        publicId: file.filename,
        alt: name,
        isPrimary: index === 0,
      }))
    : [];

  // Parse JSON strings from multipart form data
  const parsedVariants = variants ? JSON.parse(variants) : [];
  const parsedTags = tags ? JSON.parse(tags) : [];
  const parsedDimensions = dimensions ? JSON.parse(dimensions) : undefined;
  const parsedShippingInfo = shippingInfo ? JSON.parse(shippingInfo) : undefined;

  const product = await Product.create({
    name, description, shortDescription,
    price: Number(price),
    discountPercentage: Number(discountPercentage) || 0,
    category,
    brand,
    images,
    stock: Number(stock),
    sku: sku ? sku : undefined,
    tags: parsedTags,
    variants: parsedVariants,
    isFeatured: isFeatured === 'true',
    isTrending: isTrending === 'true',
    weight: weight ? Number(weight) : undefined,
    dimensions: parsedDimensions,
    shippingInfo: parsedShippingInfo,
    metaTitle,
    metaDescription,
  });

  await product.populate('category', 'name slug');
  sendSuccess(res, 201, 'Product created successfully.', { product });
});

/**
 * @desc    Update a product
 * @route   PUT /api/v1/products/:id
 * @access  Admin
 */
const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  // Handle retained images
  let finalImages = [...product.images];
  if (req.body.retainedImages) {
    const retainedIds = JSON.parse(req.body.retainedImages);
    
    // Find images to delete
    const imagesToDelete = product.images.filter(img => !retainedIds.includes(img.publicId) && img.publicId);
    
    // Delete from Cloudinary
    if (imagesToDelete.length > 0) {
      await Promise.all(
        imagesToDelete.map(img => cloudinary.uploader.destroy(img.publicId))
      );
    }
    
    // Keep only retained images
    finalImages = product.images.filter(img => retainedIds.includes(img.publicId) || !img.publicId);
  }

  // Handle new images — append to existing images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file, index) => ({
      url: file.path,
      publicId: file.filename,
      alt: req.body.name || product.name,
      isPrimary: finalImages.length === 0 && index === 0,
    }));
    finalImages = [...finalImages, ...newImages];
  }
  
  req.body.images = finalImages;

  // Parse JSON fields from multipart
  if (req.body.variants) req.body.variants = JSON.parse(req.body.variants);
  if (req.body.tags) req.body.tags = JSON.parse(req.body.tags);
  if (req.body.sku === '') req.body.sku = undefined;

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name slug');

  sendSuccess(res, 200, 'Product updated.', { product: updated });
});

/**
 * @desc    Delete a product (soft delete by setting isActive=false)
 * @route   DELETE /api/v1/products/:id
 * @access  Admin
 */
const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found.', 404));

  // Delete all images from Cloudinary
  if (product.images.length > 0) {
    await Promise.all(
      product.images
        .filter((img) => img.publicId)
        .map((img) => cloudinary.uploader.destroy(img.publicId))
    );
  }

  // Soft delete
  product.isActive = false;
  await product.save();

  sendSuccess(res, 200, 'Product deleted successfully.');
});

/**
 * @desc    Update product stock
 * @route   PATCH /api/v1/products/:id/stock
 * @access  Admin
 */
const updateStock = asyncHandler(async (req, res, next) => {
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    return next(new AppError('Valid stock quantity is required.', 400));
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: Number(stock) },
    { new: true }
  );

  if (!product) return next(new AppError('Product not found.', 404));

  sendSuccess(res, 200, 'Stock updated.', {
    product: { _id: product._id, name: product.name, stock: product.stock },
  });
});

/**
 * @desc    Get low stock products (admin)
 * @route   GET /api/v1/products/low-stock
 * @access  Admin
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;

  const products = await Product.find({
    stock: { $lte: threshold },
    isActive: true,
  })
    .select('name stock sku category images')
    .populate('category', 'name')
    .sort({ stock: 1 });

  sendSuccess(res, 200, 'Low stock products retrieved.', { products, threshold });
});

/**
 * @desc    Request a restock for a product
 * @route   POST /api/v1/products/:id/restock
 * @access  Private
 */
const requestRestock = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  if (product.stock > 0) {
    return next(new AppError('Product is already in stock', 400));
  }

  const existingRequest = await RestockRequest.findOne({
    product: product._id,
    user: req.user._id,
    status: 'pending'
  });

  if (existingRequest) {
    return next(new AppError('You have already requested a restock for this product', 400));
  }

  await RestockRequest.create({
    product: product._id,
    user: req.user._id
  });

  sendSuccess(res, 201, 'Restock request submitted successfully');
});

/**
 * @desc    Get all restock requests
 * @route   GET /api/v1/products/restock-requests
 * @access  Admin
 */
const getRestockRequests = asyncHandler(async (req, res) => {
  const requests = await RestockRequest.find()
    .populate('product', 'name images stock')
    .populate('user', 'firstName lastName email')
    .sort('-createdAt');

  sendSuccess(res, 200, 'Restock requests retrieved', { requests });
});

/**
 * @desc    Delete a restock request
 * @route   DELETE /api/v1/products/restock-requests/:id
 * @access  Admin
 */
const deleteRestockRequest = asyncHandler(async (req, res, next) => {
  const request = await RestockRequest.findByIdAndDelete(req.params.id);
  if (!request) return next(new AppError('Request not found', 404));

  sendSuccess(res, 200, 'Restock request deleted');
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getTrendingProducts,
  getNewArrivals,
  getProductBySlug,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  requestRestock,
  getRestockRequests,
  deleteRestockRequest,
};
