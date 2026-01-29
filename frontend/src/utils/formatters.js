export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

export const truncateText = (text, length = 50) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Backend base URL (no /api) for resolving relative image paths
const getApiBase = () =>
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "")) ||
  "https://last-piece-4l3u.onrender.com";

const PLACEHOLDER_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#334155" width="200" height="200"/><text x="50%" y="50%" fill="#94a3b8" text-anchor="middle" dy=".3em" font-size="14">No image</text></svg>',
  );

/** Use for product images: full URL as-is, relative path (e.g. /uploads/...) resolved to backend. */
export const getProductImageUrl = (image) => {
  if (!image) return PLACEHOLDER_SVG;
  if (typeof image === "object" && image?.url)
    return getProductImageUrl(image.url);
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  const base = getApiBase();
  return `${base.replace(/\/$/, "")}${image.startsWith("/") ? image : "/" + image}`;
};

export const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};
