import express from 'express';
import Category from '../models/Category.js';
import { generateSlug } from '../utils/helpers.js';
import { protect, authorize } from '../middleware/auth.js';
import { requireDB } from '../middleware/dbCheck.js';

const router = express.Router();

// Get all categories (public)
router.get('/', requireDB, async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('order');
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// Get category by slug (public)
router.get('/:slug', requireDB, async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// Create category (admin only)
router.post('/', protect, authorize('admin', 'super-admin'), requireDB, async (req, res, next) => {
  try {
    const { name, description, image, icon, parent, order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const slug = generateSlug(name);
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      icon,
      parent,
      order: order || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// Update category (admin only)
router.put('/:id', protect, authorize('admin', 'super-admin'), requireDB, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// Delete category (admin only)
router.delete('/:id', protect, authorize('admin', 'super-admin'), requireDB, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
