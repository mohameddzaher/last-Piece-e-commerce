import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiHome,
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiLogOut,
  FiSettings,
  FiArrowLeft,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiCalendar,
} from "react-icons/fi";
import { useAuthStore } from "@/store";
import { adminAPI } from "@/utils/endpoints";
import { getProductImageUrl } from "@/utils/formatters";
import { toast } from "react-toastify";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusIcons = {
  pending: FiClock,
  processing: FiPackage,
  shipped: FiTruck,
  delivered: FiCheckCircle,
  cancelled: FiXCircle,
};

export default function AdminOrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "admin" && user?.role !== "super-admin") {
      router.push("/dashboard");
      toast.error("Access denied. Admin privileges required.");
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getOrderById(id);
      if (res.data.success) {
        setOrder(res.data.data);
        setNewStatus(res.data.data.status);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === order.status) return;

    try {
      setUpdating(true);
      const res = await adminAPI.updateOrderStatus(order._id, newStatus);
      if (res.data.success) {
        toast.success("Order status updated");
        fetchOrder();
      }
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: FiHome, current: false },
    {
      name: "Products",
      href: "/admin/products",
      icon: FiPackage,
      current: false,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: FiShoppingBag,
      current: true,
    },
    { name: "Users", href: "/admin/users", icon: FiUsers, current: false },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: FiSettings,
      current: false,
    },
  ];

  const statuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-white mb-4">Order not found</h1>
        <Link href="/admin/orders" className="text-blue-500 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const StatusIcon = statusIcons[order.status] || FiClock;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-xl font-bold text-white">Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.current
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500 text-xs">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all mt-2"
            >
              <FiLogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <FiMenu size={24} />
              </button>
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiArrowLeft size={20} />
                <span>Back to Orders</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Order Content */}
        <main className="p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Order Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Order #{order.orderNumber || order._id.slice(-8)}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${
                      statusColors[order.status]
                    }`}
                  >
                    <StatusIcon size={14} />
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 text-sm">
                    <FiCalendar size={14} />
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Update Status */}
              <div className="flex items-center gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === order.status}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Items */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiPackage className="text-blue-400" />
                    Order Items
                  </h2>

                  <div className="space-y-4">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl"
                      >
                        <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productId?.thumbnail ||
                          item.productId?.images?.[0]?.url ? (
                            <img
                              src={getProductImageUrl(
                                item.productId?.thumbnail ||
                                  item.productId?.images?.[0]?.url,
                              )}
                              alt={item.productId?.name || item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiPackage className="text-gray-500" size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {item.productId?.name || item.name || "Product"}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Qty: {item.quantity} × $
                            {item.priceAtTime?.toFixed(2) ||
                              item.price?.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-white font-medium">
                          $
                          {(
                            (item.priceAtTime || item.price || 0) *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="mt-6 pt-6 border-t border-slate-700 space-y-2">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>
                        ${order.pricing?.subtotal?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    {(order.pricing?.discount > 0 ||
                      order.coupon?.code ||
                      order.pricing?.couponCode) && (
                      <div className="flex justify-between text-green-400">
                        <span className="flex items-center gap-2">
                          Discount
                          {(order.coupon?.code ||
                            order.pricing?.couponCode) && (
                            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-xs">
                              {order.coupon?.code || order.pricing?.couponCode}
                              {order.coupon?.discountPercent &&
                                ` (${order.coupon.discountPercent}%)`}
                            </span>
                          )}
                        </span>
                        <span>
                          -$
                          {(
                            order.pricing?.discount ||
                            order.coupon?.discountAmount ||
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-400">
                      <span>Shipping</span>
                      <span>
                        $
                        {order.pricing?.shipping?.toFixed(2) ||
                          order.shipping?.cost?.toFixed(2) ||
                          "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Tax</span>
                      <span>${order.pricing?.tax?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between text-white text-lg font-bold pt-2 border-t border-slate-700">
                      <span>Total Paid</span>
                      <span>${order.pricing?.total?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiUser className="text-blue-400" />
                    Customer
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {order.userId?.firstName?.[0]}
                          {order.userId?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {order.userId?.firstName} {order.userId?.lastName}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {order.userId?.email}
                        </p>
                      </div>
                    </div>
                    {order.userId?.phone && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiPhone size={14} />
                        <span>{order.userId?.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiMapPin className="text-blue-400" />
                    Shipping Address
                  </h2>

                  {order.shipping?.address ? (
                    <div className="text-gray-400 space-y-1">
                      <p className="text-white font-medium">
                        {order.shipping.address.firstName}{" "}
                        {order.shipping.address.lastName}
                      </p>
                      <p>{order.shipping.address.street}</p>
                      {order.shipping.address.apartment && (
                        <p>{order.shipping.address.apartment}</p>
                      )}
                      <p>
                        {order.shipping.address.city},{" "}
                        {order.shipping.address.state}{" "}
                        {order.shipping.address.zipCode}
                      </p>
                      <p>{order.shipping.address.country}</p>
                      {order.shipping.address.phone && (
                        <p className="flex items-center gap-2 mt-2">
                          <FiPhone size={14} />
                          {order.shipping.address.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No shipping address provided
                    </p>
                  )}
                </div>

                {/* Payment Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiCreditCard className="text-blue-400" />
                    Payment
                  </h2>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method</span>
                      <span className="text-white capitalize">
                        {order.payment?.method || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span
                        className={`capitalize ${
                          order.payment?.status === "completed"
                            ? "text-green-400"
                            : order.payment?.status === "failed"
                              ? "text-red-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {order.payment?.status || "N/A"}
                      </span>
                    </div>
                    {order.payment?.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transaction</span>
                        <span className="text-white text-sm font-mono">
                          {order.payment?.transactionId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
