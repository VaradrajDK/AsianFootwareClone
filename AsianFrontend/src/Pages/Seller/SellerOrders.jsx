import React, { useEffect, useState } from "react";
import api from "../../services/axiosConfig.js";
import styles from "../../Styles/Seller/SellerOrders.module.css";
import {
  FiPackage,
  FiDollarSign,
  FiRefreshCw,
  FiMapPin,
  FiPhone,
  FiUser,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiCheck,
  FiTruck,
  FiClock,
  FiX,
  FiBox,
  FiShoppingBag,
} from "react-icons/fi";

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [stats, setStats] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/seller/getSellerOrders");
      if (response.data.success) {
        setOrders(response.data.orders);
        if (response.data.orders.length > 0) {
          setExpandedOrders({ [response.data.orders[0]._id]: true });
        }
      }
    } catch (error) {
      console.error("Error fetching seller orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/seller/dashboard");
      if (response.data.success) {
        setStats(response.data.dashboard);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    }
  };

  const getProductId = (item) => {
    if (item.product && typeof item.product === "object" && item.product._id) {
      return item.product._id.toString();
    }
    if (item.product && typeof item.product === "string") {
      return item.product;
    }
    if (item.product && item.product.toString) {
      return item.product.toString();
    }
    return null;
  };

  const updateProductStatus = async (orderId, productId, newStatus) => {
    if (!productId) return;

    const updateKey = `${orderId}-${productId}`;
    setUpdating(updateKey);

    try {
      const response = await api.put("/seller/product-status", {
        orderId,
        productId,
        productStatus: newStatus,
      });

      if (response.data.success) {
        fetchSellerOrders();
      }
    } catch (error) {
      console.error("Error updating product status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  useEffect(() => {
    fetchSellerOrders();
    fetchDashboardStats();
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      Delivered: { color: "#059669", bg: "#ecfdf5", icon: FiCheck },
      Shipped: { color: "#2563eb", bg: "#eff6ff", icon: FiTruck },
      Confirmed: { color: "#7c3aed", bg: "#f5f3ff", icon: FiCheck },
      Pending: { color: "#d97706", bg: "#fffbeb", icon: FiClock },
      Cancelled: { color: "#dc2626", bg: "#fef2f2", icon: FiX },
    };
    return (
      configs[status] || { color: "#6b7280", bg: "#f9fafb", icon: FiClock }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculatedStats = {
    totalOrders: stats.totalOrders || orders.length,
    totalRevenue:
      stats.totalRevenue ||
      orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    pendingOrders: orders.filter((o) => o.orderStatus === "Pending").length,
    shippedOrders: orders.filter((o) => o.orderStatus === "Shipped").length,
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>
          <FiLoader className={styles.spinIcon} size={32} />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Orders</h1>
          <span className={styles.badge}>{orders.length}</span>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={fetchSellerOrders}
          disabled={loading}
        >
          <FiRefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <FiShoppingBag size={22} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Orders</p>
            <h3 className={styles.statValue}>{calculatedStats.totalOrders}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <FiDollarSign size={22} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Revenue</p>
            <h3 className={styles.statValue}>
              ₹{calculatedStats.totalRevenue.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <FiClock size={22} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Pending</p>
            <h3 className={styles.statValue}>
              {calculatedStats.pendingOrders}
            </h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <FiTruck size={22} />
          </div>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Shipped</p>
            <h3 className={styles.statValue}>
              {calculatedStats.shippedOrders}
            </h3>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <FiBox size={56} strokeWidth={1} />
          <h3>No orders yet</h3>
          <p>Orders will appear here when customers purchase your products.</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const isExpanded = expandedOrders[order._id];
            const statusConfig = getStatusConfig(order.orderStatus);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={order._id}
                className={`${styles.orderCard} ${
                  isExpanded ? styles.expanded : ""
                }`}
              >
                {/* Order Header */}
                <div
                  className={styles.orderHeader}
                  onClick={() => toggleOrderExpand(order._id)}
                >
                  <div className={styles.orderLeft}>
                    <div className={styles.orderIdRow}>
                      <span className={styles.orderId}>{order.orderId}</span>
                      <span
                        className={styles.statusTag}
                        style={{
                          color: statusConfig.color,
                          backgroundColor: statusConfig.bg,
                        }}
                      >
                        <StatusIcon size={12} />
                        <span>{order.orderStatus}</span>
                      </span>
                    </div>
                    <div className={styles.orderMeta}>
                      <span className={styles.metaItem}>
                        <FiCalendar size={14} />
                        <span>{formatDate(order.createdAt)}</span>
                      </span>
                      <span className={styles.metaItem}>
                        <FiUser size={14} />
                        <span>{order.user?.name || "Customer"}</span>
                      </span>
                      <span className={styles.metaItem}>
                        <FiPackage size={14} />
                        <span>
                          {order.products.length} item
                          {order.products.length > 1 ? "s" : ""}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className={styles.orderRight}>
                    <div className={styles.orderTotal}>
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </div>
                    <div className={styles.expandBtn}>
                      {isExpanded ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={styles.orderContent}>
                    {/* Products List */}
                    <div className={styles.productsContainer}>
                      <h4 className={styles.sectionTitle}>
                        <FiPackage size={15} />
                        <span>Products</span>
                      </h4>
                      <div className={styles.productsList}>
                        {order.products.map((item, index) => {
                          const productId = getProductId(item);
                          const isUpdating =
                            updating === `${order.orderId}-${productId}`;
                          const itemStatus = item.productStatus || "Pending";
                          const itemStatusConfig = getStatusConfig(itemStatus);

                          return (
                            <div key={index} className={styles.productItem}>
                              <img
                                src={
                                  item.imgUrl ||
                                  item.product?.imgUrl ||
                                  "/placeholder.png"
                                }
                                alt={item.title || "Product"}
                                className={styles.productImage}
                                onError={(e) => {
                                  e.target.src = "/placeholder.png";
                                }}
                              />
                              <div className={styles.productDetails}>
                                <h5 className={styles.productName}>
                                  {item.title ||
                                    item.product?.title ||
                                    "Product"}
                                </h5>
                                <div className={styles.productMeta}>
                                  <span className={styles.metaTag}>
                                    Size: {item.size || "N/A"}
                                  </span>
                                  <span className={styles.metaTag}>
                                    Qty: {item.quantity}
                                  </span>
                                  <span className={styles.priceTag}>
                                    ₹
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                              <div className={styles.statusWrapper}>
                                <div className={styles.selectContainer}>
                                  <select
                                    value={itemStatus}
                                    onChange={(e) =>
                                      updateProductStatus(
                                        order.orderId,
                                        productId,
                                        e.target.value
                                      )
                                    }
                                    disabled={isUpdating || !productId}
                                    className={styles.statusSelect}
                                    style={{
                                      borderColor: itemStatusConfig.color,
                                      color: itemStatusConfig.color,
                                    }}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                  {isUpdating && (
                                    <div className={styles.selectLoader}>
                                      <FiLoader
                                        className={styles.spinIcon}
                                        size={14}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className={styles.shippingContainer}>
                      <h4 className={styles.sectionTitle}>
                        <FiMapPin size={15} />
                        <span>Shipping Address</span>
                      </h4>
                      <div className={styles.addressCard}>
                        <p className={styles.addressName}>
                          {order.shippingAddress?.name}
                        </p>
                        <p className={styles.addressLine}>
                          {order.shippingAddress?.address}
                        </p>
                        <p className={styles.addressLine}>
                          {order.shippingAddress?.city},{" "}
                          {order.shippingAddress?.state} -{" "}
                          {order.shippingAddress?.pincode}
                        </p>
                        <p className={styles.addressPhone}>
                          <FiPhone size={14} />
                          <span>{order.shippingAddress?.phone}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
