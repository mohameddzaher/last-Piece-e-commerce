import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import {
  generateSlug,
  calculatePagination,
  generateSKU,
  resolveProductImageUrls,
  resolveProductsImageUrls,
} from "../utils/helpers.js";
import {
  filterProductForRole,
  filterProductsForRole,
} from "../utils/roleVisibility.js";
import { emitProductChange } from "../realtime/io.js";

/**
 * Build the location filter based on the requester's role.
 * - Public/customer: only egypt-online or egypt-both, status=active
 * - Egypt staff: any Egypt-side stock
 * - Saudi staff: only Saudi-side or in-transit
 * - Admin/super-admin: no filter
 */
const buildLocationFilter = (role) => {
  switch (role) {
    case "super-admin":
    case "admin":
      return {};
    case "saudi-staff":
      return { location: { $in: ["saudi", "transit"] } };
    case "egypt-staff":
      return { location: { $in: ["egypt-online", "egypt-offline", "egypt-both"] } };
    default:
      // Public — only active, online-available pairs. Reject anything with no
      // selling price (would render as "EGP 0" on the storefront).
      return {
        location: { $in: ["egypt-online", "egypt-both"] },
        status: "active",
        price: { $gt: 0 },
      };
  }
};

const isStaffRole = (role) =>
  ["admin", "super-admin", "saudi-staff", "egypt-staff"].includes(role);

export const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      brand,
      gender,
      location,
      search,
      sort = "-createdAt",
      minPrice,
      maxPrice,
    } = req.query;
    const { skip, limit: pageLimit } = calculatePagination(page, limit);

    const role = req.user?.role || "customer";

    // Base filter from role
    let filter = buildLocationFilter(role);

    // Staff/admin can request a specific location explicitly
    if (location && isStaffRole(role)) {
      filter.location = location;
    }

    // For staff/admin we still want to exclude discontinued by default
    if (isStaffRole(role) && !filter.status) {
      filter.status = { $in: ["active", "draft", "inactive"] };
    }

    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        const categoryDoc = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, "i") } },
            { slug: category.toLowerCase().replace(/\s+/g, "-") },
          ],
        });
        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          return res.status(200).json({
            success: true,
            data: [],
            pagination: { total: 0, pages: 0, currentPage: parseInt(page), pageSize: pageLimit },
          });
        }
      }
    }

    if (brand) {
      if (brand.match(/^[0-9a-fA-F]{24}$/)) {
        filter.brandRef = brand;
      } else {
        const brandDoc = await Brand.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${brand}$`, "i") } },
            { slug: brand.toLowerCase().replace(/\s+/g, "-") },
          ],
        });
        if (brandDoc) filter.brandRef = brandDoc._id;
        else filter.brand = { $regex: brand, $options: "i" };
      }
    }

    if (gender) filter.gender = gender;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { batchCode: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const products = await Product.find(filter)
      .populate("category")
      .populate("brandRef")
      .sort(sort)
      .skip(skip)
      .limit(pageLimit);

    const total = await Product.countDocuments(filter);

    const resolved = resolveProductsImageUrls(products);
    const data = filterProductsForRole(resolved, role);

    res.status(200).json({
      success: true,
      data,
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
    const role = req.user?.role || "customer";

    const baseFilter = buildLocationFilter(role);
    const queryFilter = slug.match(/^[0-9a-fA-F]{24}$/)
      ? { ...baseFilter, _id: slug }
      : { ...baseFilter, slug };

    const product = await Product.findOne(queryFilter)
      .populate("category")
      .populate("brandRef");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!isStaffRole(role)) {
      product.viewCount += 1;
      await product.save();
    }

    const resolved = resolveProductImageUrls(product);
    const data = filterProductForRole(resolved, role);

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync the public `price` field with the appropriate selling price
 * so customer-facing endpoints keep working without role filtering.
 */
const syncPublicPrice = (data) => {
  const out = { ...data };
  if (out.location === "egypt-online" || out.location === "egypt-both") {
    if (out.onlinePrice && out.onlinePrice > 0) out.price = out.onlinePrice;
  } else if (out.location === "egypt-offline") {
    if (out.offlinePrice && out.offlinePrice > 0) out.price = out.offlinePrice;
  }
  return out;
};

export const createProduct = async (req, res, next) => {
  try {
    const role = req.user.role;
    const body = { ...req.body };

    if (!body.name || !body.description || !body.category) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Saudi staff: registering a new purchased product. Default location=saudi.
    // They are NOT allowed to set selling prices.
    if (role === "saudi-staff") {
      delete body.onlinePrice;
      delete body.offlinePrice;
      delete body.minSellPrice;
      body.location = "saudi";
      body.status = body.status || "draft";
      if (!body.price) body.price = 0; // public price set later by super-admin
    }

    // Egypt staff: cannot create new products (purchasing is Saudi-side).
    if (role === "egypt-staff") {
      return res
        .status(403)
        .json({ success: false, message: "Egypt staff cannot create products" });
    }

    const productExists = await Product.findOne({ name: body.name });
    if (productExists) {
      return res
        .status(409)
        .json({ success: false, message: "Product with this name already exists" });
    }

    body.slug = generateSlug(body.name);
    body.sku = generateSKU(body.name, body.name);
    body.createdBy = req.user.id;

    if (body.purchasePrice && !body.purchaseDate) body.purchaseDate = new Date();

    const synced = syncPublicPrice(body);
    const product = await Product.create(synced);

    const resolved = resolveProductImageUrls(product);
    emitProductChange("product:created", resolved);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: filterProductForRole(resolved, role),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const update = { ...req.body, updatedBy: req.user.id };

    // Saudi staff cannot change selling-side fields.
    if (role === "saudi-staff") {
      delete update.onlinePrice;
      delete update.offlinePrice;
      delete update.minSellPrice;
      delete update.location; // staging changes happen via shipment flow
    }

    // Egypt staff cannot change purchase-side fields.
    if (role === "egypt-staff") {
      delete update.purchasePrice;
      delete update.purchaseCurrency;
      delete update.supplier;
      delete update.purchaseDate;
      delete update.batchCode;
    }

    const synced = syncPublicPrice(update);
    const product = await Product.findByIdAndUpdate(id, synced, {
      new: true,
      runValidators: true,
    })
      .populate("category")
      .populate("brandRef");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const resolved = resolveProductImageUrls(product);
    emitProductChange("product:updated", resolved);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: filterProductForRole(resolved, role),
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
      { status: "discontinued" },
      { new: true },
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    emitProductChange("product:deleted", product);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;
    const role = req.user?.role || "customer";

    if (!query) return res.status(200).json({ success: true, data: [] });

    const baseFilter = buildLocationFilter(role);
    const products = await Product.find({
      ...baseFilter,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { sku: { $regex: query, $options: "i" } },
      ],
    }).limit(parseInt(limit));

    const resolved = resolveProductsImageUrls(products);
    res.status(200).json({ success: true, data: filterProductsForRole(resolved, role) });
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    const role = req.user?.role || "customer";

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const baseFilter = buildLocationFilter(role);
    const relatedProducts = await Product.find({
      ...baseFilter,
      $or: [{ category: product.category }, { tags: { $in: product.tags || [] } }],
      _id: { $ne: id },
    }).limit(parseInt(limit));

    const resolved = resolveProductsImageUrls(relatedProducts);
    res.status(200).json({ success: true, data: filterProductsForRole(resolved, role) });
  } catch (error) {
    next(error);
  }
};

/* ---------- New endpoints for the Last Piece pipeline ---------- */

/**
 * Bulk update: super-admin selects products → Send to Online / Offline / Both.
 * Body: { productIds: [], location: 'egypt-online'|'egypt-offline'|'egypt-both', onlinePrice?, offlinePrice?, minSellPrice? }
 */
export const bulkUpdateLocation = async (req, res, next) => {
  try {
    const { productIds, location, onlinePrice, offlinePrice, minSellPrice } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "productIds required" });
    }
    if (!["egypt-online", "egypt-offline", "egypt-both", "transit", "saudi"].includes(location)) {
      return res.status(400).json({ success: false, message: "Invalid location" });
    }

    const update = { location, updatedBy: req.user.id, status: "active" };
    if (onlinePrice != null) update.onlinePrice = onlinePrice;
    if (offlinePrice != null) update.offlinePrice = offlinePrice;
    if (minSellPrice != null) update.minSellPrice = minSellPrice;

    // Sync public price
    if (location === "egypt-online" || location === "egypt-both") {
      if (onlinePrice != null) update.price = onlinePrice;
    } else if (location === "egypt-offline") {
      if (offlinePrice != null) update.price = offlinePrice;
    }

    const products = await Product.find({ _id: { $in: productIds } });
    const historyEntry = {
      location,
      changedAt: new Date(),
      changedBy: req.user.id,
      notes: req.body.notes || "Bulk location update",
    };

    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: update, $push: { locationHistory: historyEntry } },
    );

    const updated = await Product.find({ _id: { $in: productIds } })
      .populate("category")
      .populate("brandRef");

    updated.forEach((p) => emitProductChange("product:updated", resolveProductImageUrls(p)));

    res.status(200).json({
      success: true,
      message: `${updated.length} products moved to ${location}`,
      data: filterProductsForRole(resolveProductsImageUrls(updated), req.user.role),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/inventory/:bucket
 * bucket = 'saudi' | 'transit' | 'egypt-online' | 'egypt-offline' | 'sold'
 * Staff-scoped list for the new sidebar pages.
 */
export const getInventoryByLocation = async (req, res, next) => {
  try {
    const { bucket } = req.params;
    const role = req.user.role;
    const valid = ["saudi", "transit", "egypt-online", "egypt-offline", "egypt-both", "sold"];
    if (!valid.includes(bucket)) {
      return res.status(400).json({ success: false, message: "Invalid bucket" });
    }

    // Enforce role boundaries
    if (role === "saudi-staff" && !["saudi", "transit"].includes(bucket)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (
      role === "egypt-staff" &&
      !["egypt-online", "egypt-offline", "egypt-both"].includes(bucket)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const filter =
      bucket === "egypt-online"
        ? { location: { $in: ["egypt-online", "egypt-both"] } }
        : bucket === "egypt-offline"
          ? { location: { $in: ["egypt-offline", "egypt-both"] } }
          : { location: bucket };

    const products = await Product.find(filter)
      .populate("category")
      .populate("brandRef")
      .sort("-createdAt");

    const resolved = resolveProductsImageUrls(products);
    res.status(200).json({
      success: true,
      data: filterProductsForRole(resolved, role),
      total: products.length,
    });
  } catch (error) {
    next(error);
  }
};
