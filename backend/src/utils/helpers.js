import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d" },
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

/** Resolve relative image URLs to full backend URL (for Render/local). Use BACKEND_PUBLIC_URL e.g. https://last-piece-4l3u.onrender.com */
export const resolveImageUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (process.env.BACKEND_PUBLIC_URL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
  return base ? `${base}${url.startsWith("/") ? url : "/" + url}` : url;
};

/** Apply resolveImageUrl to product images and thumbnail. */
export const resolveProductImageUrls = (product) => {
  if (!product) return product;
  const resolved = product.toObject ? product.toObject() : { ...product };
  if (resolved.images && Array.isArray(resolved.images)) {
    resolved.images = resolved.images.map((img) =>
      typeof img === "string"
        ? { url: resolveImageUrl(img), alt: "" }
        : { ...img, url: resolveImageUrl(img.url) },
    );
  }
  if (resolved.thumbnail)
    resolved.thumbnail = resolveImageUrl(resolved.thumbnail);
  return resolved;
};

/** Resolve image URLs for an array of products. */
export const resolveProductsImageUrls = (products) => {
  if (!Array.isArray(products)) return products;
  return products.map((p) => resolveProductImageUrls(p));
};

export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const generateSKU = (categoryName, productName) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${categoryName.slice(0, 3).toUpperCase()}-${productName.slice(0, 3).toUpperCase()}-${timestamp}-${random}`;
};

export const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const calculatePagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  return { skip, limit: limitNum, page: pageNum };
};

export const calculateDiscount = (originalPrice, discountPercent) => {
  if (!originalPrice || !discountPercent) return originalPrice;
  return originalPrice - (originalPrice * discountPercent) / 100;
};

export const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.emailVerificationToken;
  delete userObj.passwordResetToken;
  return userObj;
};
