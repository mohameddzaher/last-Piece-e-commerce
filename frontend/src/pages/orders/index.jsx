import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiPackage,
  FiChevronRight,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { useAuthStore } from "@/store";
import { orderAPI } from "@/utils/endpoints";
import { getProductImageUrl } from "@/utils/formatters";
import { toast } from "react-toastify";

export default function Orders() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/orders");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAll();
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: FiClock,
      approved: FiCheckCircle,
      dispatching: FiPackage,
      in_transit: FiTruck,
      delivered: FiCheckCircle,
      completed: FiCheckCircle,
      cancelled: FiXCircle,
    };
    return icons[status] || FiPackage;
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

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
        <p className="text-gray-400 mb-8">Track and manage your orders</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            "all",
            "pending",
            "approved",
            "in_transit",
            "delivered",
            "completed",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-gray-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              {status === "all" ? "All Orders" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <FiPackage className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">
              {filter === "all"
                ? "No orders yet"
                : `No ${filter.replace("_", " ")} orders`}
            </h3>
            <p className="text-gray-400 mb-6">
              {filter === "all"
                ? "When you place an order, it will appear here"
                : "Try selecting a different filter"}
            </p>
            {filter === "all" && (
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/orders/${order._id}`}
                    className="block bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <p className="font-bold text-white">
                            Order #{order.orderNumber}
                          </p>
                          <span
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm capitalize ${getStatusColor(order.status)}`}
                          >
                            <StatusIcon size={14} />
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>

                        {/* Order Items Preview */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {order.items?.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 bg-slate-800 rounded-lg border-2 border-slate-900 overflow-hidden"
                              >
                                {item.product?.thumbnail ? (
                                  <img
                                    src={getProductImageUrl(
                                      item.product.thumbnail,
                                    )}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    <FiPackage size={14} />
                                  </div>
                                )}
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <div className="w-10 h-10 bg-slate-800 rounded-lg border-2 border-slate-900 flex items-center justify-center text-xs text-gray-400">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-400">
                            {order.items?.length}{" "}
                            {order.items?.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-xl font-bold text-white">
                            ${order.totals?.total?.toFixed(2)}
                          </p>
                        </div>
                        <FiChevronRight className="text-gray-500" size={20} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
