import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { generateSlug, calculatePagination, generateSKU } from '../utils/helpers.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search, sort = '-createdAt', minPrice, maxPrice } = req.query;
    const { skip, limit: pageLimit } = calculatePagination(page, limit);

    // Include both active and draft products (draft is default for new products)
    let filter = { status: { $in: ['active', 'draft'] } };

    if (category) {
      // Check if category is an ObjectId or a name/slug
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        // Find category by name or slug (case-insensitive)
        const categoryDoc = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: category.toLowerCase().replace(/\s+/g, '-') },
          ],
        });
        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          // No matching category, return empty results
          return res.status(200).json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              pages: 0,
              currentPage: parseInt(page),
              pageSize: pageLimit,
            },
          });
        }
      }
    }

    if (search) {
      // Use regex for partial matching from first character
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(filter)
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(pageLimit);

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        pages: Math.ceil(total / pageLimit),
        currentPage: parseInt(page),
        pageSize: pageLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Also try to find by ID if slug looks like an ObjectId
    let product;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: slug, status: { $in: ['active', 'draft'] } })
        .populate('category');
    } else {
      product = await Product.findOne({ slug, status: { $in: ['active', 'draft'] } })
        .populate('category');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      originalPrice,
      category,
      images,
      thumbnail,
      model3D,
      brand,
      materials,
      dimensions,
      weight,
      tags,
      collection,
      promotion,
      seo,
    } = req.body;

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if product name already exists
    const productExists = await Product.findOne({ name });
    if (productExists) {
      return res.status(409).json({
        success: false,
        message: 'Product with this name already exists',
      });
    }

    const slug = generateSlug(name);
    const sku = generateSKU(name, name);

    const product = await Product.create({
      name,
      slug,
      description,
      shortDescription,
      price,
      originalPrice,
      sku,
      category,
      images,
      thumbnail,
      model3D,
      brand,
      materials,
      dimensions,
      weight,
      tags,
      collection,
      promotion,
      seo,
      createdBy: req.user.id,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { status: 'discontinued' },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Use regex for partial matching from first character
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
      ],
      status: { $in: ['active', 'draft'] },
    })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const relatedProducts = await Product.find({
      $or: [{ category: product.category }, { tags: { $in: product.tags } }],
      _id: { $ne: id },
      status: { $in: ['active', 'draft'] },
    })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};
