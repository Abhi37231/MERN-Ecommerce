/**
 * categoryController.js — Category Controller
 *
 * GET    /                — getCategories (public, with tree structure)
 * POST   /                — createCategory (admin)
 * GET    /:slug           — getCategoryBySlug (public)
 * PUT    /:id             — updateCategory (admin)
 * DELETE /:id             — deleteCategory (admin)
 */

const Category = require('../models/Category');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get all categories (with optional tree structure)
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  const { tree, parent, active } = req.query;

  const filter = {};
  if (active !== 'false') filter.isActive = true;
  if (parent === 'null') filter.parent = null; // only top-level
  else if (parent) filter.parent = parent;

  const categoriesDocs = await Category.find(filter)
    .populate('children')
    .sort({ sortOrder: 1, name: 1 });

  const categories = await Promise.all(
    categoriesDocs.map(async (cat) => {
      const topProductsDocs = await Product.find({ category: cat._id, isActive: true })
        .limit(3)
        .select('images')
        .lean();
      return {
        ...cat.toObject(),
        topProducts: topProductsDocs.map(p => p.images?.[0]?.url).filter(Boolean)
      };
    })
  );

  sendSuccess(res, 200, 'Categories retrieved.', { categories });
});

/**
 * @desc    Get single category by slug with products count
 * @route   GET /api/v1/categories/:slug
 * @access  Public
 */
const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate('children')
    .populate('parent', 'name slug');

  if (!category) {
    return next(new AppError('Category not found.', 404));
  }

  const productCount = await Product.countDocuments({
    category: category._id,
    isActive: true,
  });

  sendSuccess(res, 200, 'Category retrieved.', { category, productCount });
});

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories
 * @access  Admin
 */
const createCategory = asyncHandler(async (req, res, next) => {
  const { name, description, parent, sortOrder, metaTitle, metaDescription } = req.body;

  // Handle image upload
  let image = { url: '', publicId: '', alt: '' };
  if (req.file) {
    image = {
      url: req.file.path,
      publicId: req.file.filename,
      alt: name,
    };
  }

  const category = await Category.create({
    name,
    description,
    parent: parent || null,
    sortOrder,
    image,
    metaTitle,
    metaDescription,
  });

  sendSuccess(res, 201, 'Category created successfully.', { category });
});

/**
 * @desc    Update a category
 * @route   PUT /api/v1/categories/:id
 * @access  Admin
 */
const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found.', 404));
  }

  // If a new image is uploaded, delete the old one from Cloudinary
  if (req.file && category.image.publicId) {
    await cloudinary.uploader.destroy(category.image.publicId);
    req.body.image = {
      url: req.file.path,
      publicId: req.file.filename,
      alt: req.body.name || category.name,
    };
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  sendSuccess(res, 200, 'Category updated.', { category: updatedCategory });
});

/**
 * @desc    Delete a category (and move children to parent)
 * @route   DELETE /api/v1/categories/:id
 * @access  Admin
 */
const deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError('Category not found.', 404));
  }

  // Check if products exist in this category
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return next(
      new AppError(
        `Cannot delete category. It has ${productCount} product(s). Reassign them first.`,
        400
      )
    );
  }

  // Move child categories to the parent of this category
  await Category.updateMany(
    { parent: category._id },
    { parent: category.parent }
  );

  // Delete image from Cloudinary
  if (category.image.publicId) {
    await cloudinary.uploader.destroy(category.image.publicId);
  }

  await category.deleteOne();
  sendSuccess(res, 200, 'Category deleted successfully.');
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
