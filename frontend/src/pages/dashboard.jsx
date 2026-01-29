import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiUser,
  FiPackage,
  FiHeart,
  FiSettings,
  FiLogOut,
  FiEdit2,
  FiMapPin,
  FiMail,
  FiPhone,
  FiShoppingBag,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiShoppingCart,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiShield,
} from "react-icons/fi";
import { useAuthStore, useCartStore } from "@/store";
import { authAPI, orderAPI, wishlistAPI, cartAPI } from "@/utils/endpoints";
import { getProductImageUrl } from "@/utils/formatters";
import { toast } from "react-toastify";

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const { cart, setCart, updateQuantity, removeItem } = useCartStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        address: user.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
      });
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, wishlistRes] = await Promise.all([
        orderAPI.getAll({ limit: 5 }),
        wishlistAPI.get(),
      ]);

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data || []);
      }
      if (wishlistRes.data.success) {
        setWishlist(wishlistRes.data.data?.items || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile(formData);
      if (res.data.success) {
        setUser(res.data.data);
        setEditMode(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-400 bg-yellow-400/10",
      approved: "text-blue-400 bg-blue-400/10",
      dispatching: "text-purple-400 bg-purple-400/10",
      in_transit: "text-orange-400 bg-orange-400/10",
      delivered: "text-green-400 bg-green-400/10",
      completed: "text-green-400 bg-green-400/10",
      cancelled: "text-red-400 bg-red-400/10",
    };
    return colors[status] || "text-gray-400 bg-gray-400/10";
  };

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: FiUser },
    { id: "orders", label: "Orders", icon: FiPackage },
    { id: "cart", label: "Cart", icon: FiShoppingCart },
    { id: "wishlist", label: "Wishlist", icon: FiHeart },
    { id: "settings", label: "Settings", icon: FiSettings },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Account</h1>
          <p className="text-gray-400">
            Manage your account and view your orders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              {/* Profile Card */}
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs capitalize">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-gray-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
                {(user?.role === "admin" || user?.role === "super-admin") && (
                  <>
                    <hr className="my-3 border-slate-800" />
                    <Link
                      href="/admin"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
                    >
                      <FiShield size={18} />
                      Admin Panel
                    </Link>
                  </>
                )}
                <hr className="my-3 border-slate-800" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <FiLogOut size={18} />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <FiShoppingBag className="text-blue-400" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {orders.length}
                        </p>
                        <p className="text-sm text-gray-400">Total Orders</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <FiHeart className="text-purple-400" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {wishlist.length}
                        </p>
                        <p className="text-sm text-gray-400">Wishlist Items</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <FiCheckCircle className="text-green-400" size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {
                            orders.filter((o) => o.status === "completed")
                              .length
                          }
                        </p>
                        <p className="text-sm text-gray-400">Completed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white">Recent Orders</h3>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      View All
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <FiPackage
                        className="mx-auto text-gray-600 mb-3"
                        size={40}
                      />
                      <p className="text-gray-400">No orders yet</p>
                      <Link
                        href="/products"
                        className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden">
                              {order.items?.[0]?.product?.thumbnail ? (
                                <img
                                  src={getProductImageUrl(
                                    order.items[0].product.thumbnail,
                                  )}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  <FiPackage size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                Order #{order.orderNumber}
                              </p>
                              <p className="text-sm text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">
                              ${order.totals?.total?.toFixed(2)}
                            </p>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs capitalize ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account Info */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white">
                      Account Information
                    </h3>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <FiMail className="text-gray-500" size={18} />
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="text-white">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FiPhone className="text-gray-500" size={18} />
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="text-white">
                          {user?.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 md:col-span-2">
                      <FiMapPin className="text-gray-500 mt-1" size={18} />
                      <div>
                        <p className="text-sm text-gray-400">Address</p>
                        <p className="text-white">
                          {user?.address?.street
                            ? `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}, ${user.address.country}`
                            : "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-xl border border-slate-800 p-6"
              >
                <h3 className="font-bold text-white mb-6">My Orders</h3>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FiPackage
                      className="mx-auto text-gray-600 mb-3"
                      size={48}
                    />
                    <p className="text-gray-400 mb-4">
                      You haven't placed any orders yet
                    </p>
                    <Link
                      href="/products"
                      className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Link
                        key={order._id}
                        href={`/orders/${order._id}`}
                        className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-white">
                              Order #{order.orderNumber}
                            </p>
                            <p className="text-sm text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm capitalize ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400">
                            {order.items?.length}{" "}
                            {order.items?.length === 1 ? "item" : "items"}
                          </p>
                          <p className="font-bold text-white">
                            ${order.totals?.total?.toFixed(2)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Cart Tab */}
            {activeTab === "cart" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-xl border border-slate-800 p-6"
              >
                <h3 className="font-bold text-white mb-6">My Cart</h3>
                {!cart?.items || cart.items.length === 0 ? (
                  <div className="text-center py-12">
                    <FiShoppingCart
                      className="mx-auto text-gray-600 mb-3"
                      size={48}
                    />
                    <p className="text-gray-400 mb-4">Your cart is empty</p>
                    <Link
                      href="/products"
                      className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg"
                      >
                        <div className="w-20 h-20 bg-slate-700 rounded-lg overflow-hidden">
                          {item.product?.thumbnail ? (
                            <img
                              src={getProductImageUrl(item.product.thumbnail)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <FiShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Link
                            href={`/products/${item.product?.slug || item.productId}`}
                            className="font-medium text-white hover:text-blue-400 transition-colors"
                          >
                            {item.product?.name || "Product"}
                          </Link>
                          {item.size && (
                            <p className="text-sm text-gray-400">
                              Size: {item.size}
                            </p>
                          )}
                          <p className="text-blue-400 font-bold">
                            ${item.price?.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (item.quantity > 1) {
                                try {
                                  await cartAPI.updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                  );
                                  updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                  );
                                } catch (error) {
                                  toast.error("Failed to update quantity");
                                }
                              }
                            }}
                            disabled={item.quantity <= 1}
                            className="p-1 bg-slate-700 rounded text-white disabled:opacity-50"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="text-white w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await cartAPI.updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                );
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                );
                              } catch (error) {
                                toast.error("Failed to update quantity");
                              }
                            }}
                            className="p-1 bg-slate-700 rounded text-white"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await cartAPI.remove(item.productId);
                              removeItem(item.productId);
                              toast.success("Item removed from cart");
                            } catch (error) {
                              toast.error("Failed to remove item");
                            }
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    ))}

                    {/* Cart Summary */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-white font-medium">
                          $
                          {cart.items
                            .reduce(
                              (sum, item) => sum + item.price * item.quantity,
                              0,
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between mb-4">
                        <span className="text-gray-400">Items</span>
                        <span className="text-white">
                          {cart.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0,
                          )}
                        </span>
                      </div>
                      <Link
                        href="/checkout"
                        className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
                      >
                        Proceed to Checkout
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-xl border border-slate-800 p-6"
              >
                <h3 className="font-bold text-white mb-6">My Wishlist</h3>
                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <FiHeart className="mx-auto text-gray-600 mb-3" size={48} />
                    <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                    <Link
                      href="/products"
                      className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Discover Products
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlist.map((item) => (
                      <Link
                        key={item.productId}
                        href={`/products/${item.product?.slug || item.productId}`}
                        className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden">
                          {item.product?.thumbnail ? (
                            <img
                              src={getProductImageUrl(item.product.thumbnail)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <FiHeart size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-blue-400 font-bold">
                            ${item.product?.price?.toFixed(2)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-xl border border-slate-800 p-6"
              >
                <h3 className="font-bold text-white mb-6">Account Settings</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            street: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: {
                              ...formData.address,
                              city: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: {
                              ...formData.address,
                              state: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: {
                              ...formData.address,
                              zipCode: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: {
                              ...formData.address,
                              country: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
