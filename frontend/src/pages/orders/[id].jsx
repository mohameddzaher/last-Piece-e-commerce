import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiPackage,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { useAuthStore } from "@/store";
import { orderAPI } from "@/utils/endpoints";
import { getProductImageUrl } from "@/utils/formatters";
import { toast } from "react-toastify";

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (id) {
      fetchOrder();
    }
  }, [id, isAuthenticated, router]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getById(id);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load order");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await orderAPI.cancel(id);
      toast.success("Order cancelled successfully");
      fetchOrder();
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      approved: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      dispatching: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      in_transit: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      delivered: "text-green-400 bg-green-400/10 border-green-400/20",
      completed: "text-green-400 bg-green-400/10 border-green-400/20",
      cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
    };
    return colors[status] || "text-gray-400 bg-gray-400/10 border-gray-400/20";
  };

  const orderStatuses = [
    "pending",
    "approved",
    "dispatching",
    "in_transit",
    "delivered",
    "completed",
  ];

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FiPackage className="mx-auto text-gray-600 mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Order not found</h2>
          <Link href="/orders" className="text-blue-400 hover:text-blue-300">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = orderStatuses.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FiArrowLeft size={18} />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-400 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize ${getStatusColor(order.status)}`}
              >
                {order.status.replace("_", " ")}
              </span>
              {order.status === "pending" && (
                <button
                  onClick={handleCancelOrder}
                  className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Progress */}
        {order.status !== "cancelled" && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-6">
            <h2 className="font-bold text-white mb-6">Order Progress</h2>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${(currentStatusIndex / (orderStatuses.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {orderStatuses.map((status, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  return (
                    <div key={status} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          isCompleted
                            ? "bg-blue-500 text-white"
                            : "bg-slate-800 text-gray-500"
                        } ${isCurrent ? "ring-4 ring-blue-500/30" : ""}`}
                      >
                        {isCompleted ? <FiCheckCircle size={16} /> : index + 1}
                      </div>
                      <span
                        className={`mt-2 text-xs capitalize ${isCompleted ? "text-blue-400" : "text-gray-500"}`}
                      >
                        {status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h2 className="font-bold text-white">Order Items</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {order.items?.map((item, index) => (
                  <div key={index} className="p-4 flex gap-4">
                    <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.thumbnail ? (
                        <img
                          src={getProductImageUrl(item.product.thumbnail)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <FiPackage size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">
                        {item.product?.name || "Product"}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-blue-400 font-bold mt-1">
                        ${item.price?.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Addresses */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="font-bold text-white mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">
                    ${order.totals?.subtotal?.toFixed(2)}
                  </span>
                </div>
                {order.totals?.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-${order.totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Tax</span>
                  <span className="text-white">
                    ${order.totals?.tax?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-white">
                    {order.totals?.shipping === 0
                      ? "Free"
                      : `$${order.totals?.shipping?.toFixed(2)}`}
                  </span>
                </div>
                <hr className="border-slate-800" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-white">
                    ${order.totals?.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="font-bold text-white mb-4">Shipping Address</h2>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-start gap-3">
                  <FiMapPin className="text-gray-500 mt-1" size={16} />
                  <div>
                    {order.shippingAddress?.street && (
                      <p className="text-white">
                        {order.shippingAddress.street}
                        <br />
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.zipCode}
                        <br />
                        {order.shippingAddress.country}
                      </p>
                    )}
                  </div>
                </div>
                {order.shippingAddress?.phone && (
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-gray-500" size={16} />
                    <span className="text-white">
                      {order.shippingAddress.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h2 className="font-bold text-white mb-4">Payment Method</h2>
              <p className="text-gray-400 capitalize">
                {order.payment?.method?.replace("_", " ") || "Credit Card"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Status:{" "}
                <span className="text-green-400 capitalize">
                  {order.payment?.status || "paid"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
