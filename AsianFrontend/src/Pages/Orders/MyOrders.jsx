// Pages/Orders/MyOrders.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiPackage,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiCalendar,
  FiShoppingBag,
  FiMapPin,
  FiAlertCircle,
  FiFilter,
  FiEye,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { BsBoxSeam, BsCheckCircleFill } from "react-icons/bs";
import { MdDeliveryDining } from "react-icons/md";
import api from "../../services/axiosConfig";
import styles from "../../Styles/Orders/MyOrders.module.css";

const MyOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state) => state.user.userInfo);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [newOrderId, setNewOrderId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  const getUserId = useCallback(() => {
    return user?.userId || user?._id || user?.id || null;
  }, [user]);

  useEffect(() => {
    if (location.state?.orderSuccess) {
      setShowSuccessBanner(true);
      setNewOrderId(location.state.orderId);
      window.history.replaceState({}, document.title);
      setTimeout(() => {
        setShowSuccessBanner(false);
      }, 5000);
    }
  }, [location]);

  useEffect(() => {
    const userId = getUserId();

    if (!userId && !isAuthenticated) {
      setError("Please login to view your orders");
      setLoading(false);
      return;
    }

    if (userId) {
      fetchOrders();
    }
  }, [user, isAuthenticated, getUserId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/product/getOrders");

      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <FiClock size={13} />;
      case "confirmed":
        return <FiCheckCircle size={13} />;
      case "shipped":
        return <FiTruck size={13} />;
      case "out for delivery":
        return <MdDeliveryDining size={14} />;
      case "delivered":
        return <FiCheckCircle size={13} />;
      case "cancelled":
        return <FiXCircle size={13} />;
      default:
        return <FiClock size={13} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return styles.statusPending;
      case "confirmed":
        return styles.statusConfirmed;
      case "shipped":
        return styles.statusShipped;
      case "out for delivery":
        return styles.statusOutForDelivery;
      case "delivered":
        return styles.statusDelivered;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter !== "all" && order.orderStatus?.toLowerCase() !== filter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOrderId = order.orderId?.toLowerCase().includes(query);
      const matchesProduct = order.products?.some((p) =>
        (p.title || p.product?.title)?.toLowerCase().includes(query)
      );
      return matchesOrderId || matchesProduct;
    }
    return true;
  });

  const filterOptions = [
    { value: "all", label: "All Orders", count: orders.length },
    {
      value: "pending",
      label: "Pending",
      count: orders.filter((o) => o.orderStatus?.toLowerCase() === "pending")
        .length,
    },
    {
      value: "confirmed",
      label: "Confirmed",
      count: orders.filter((o) => o.orderStatus?.toLowerCase() === "confirmed")
        .length,
    },
    {
      value: "shipped",
      label: "Shipped",
      count: orders.filter((o) => o.orderStatus?.toLowerCase() === "shipped")
        .length,
    },
    {
      value: "delivered",
      label: "Delivered",
      count: orders.filter((o) => o.orderStatus?.toLowerCase() === "delivered")
        .length,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      count: orders.filter((o) => o.orderStatus?.toLowerCase() === "cancelled")
        .length,
    },
  ];

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (!getUserId()) {
    return (
      <div className={styles.errorWrapper}>
        <FiAlertCircle size={52} />
        <h3>Login Required</h3>
        <p>Please login to view your orders</p>
        <button
          onClick={() => navigate("/login", { state: { from: "/orders" } })}
        >
          Login Now
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <FiAlertCircle size={52} />
        <h3>Oops!</h3>
        <p>{error}</p>
        <button onClick={fetchOrders}>
          <FiRefreshCw size={15} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className={styles.successBanner}>
          <div className={styles.bannerIcon}>
            <BsCheckCircleFill size={22} />
          </div>
          <div className={styles.bannerContent}>
            <h4>Order Placed Successfully!</h4>
            <p>Your order #{newOrderId} has been confirmed.</p>
          </div>
          <button
            className={styles.bannerClose}
            onClick={() => setShowSuccessBanner(false)}
          >
            <FiXCircle size={20} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>
            <FiPackage size={26} /> My Orders
          </h1>
          <p>
            {orders.length} {orders.length !== 1 ? "orders" : "order"} placed
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchOrders}>
          <FiRefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch size={17} />
          <input
            type="text"
            placeholder="Search by Order ID or Product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchQuery("")}
            >
              <FiXCircle size={16} />
            </button>
          )}
        </div>

        <div className={styles.filterWrapper}>
          <div className={styles.filterLabel}>
            <FiFilter size={15} />
            <span>Filter:</span>
          </div>
          <div className={styles.filterTabs}>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.filterTab} ${
                  filter === opt.value ? styles.activeTab : ""
                }`}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
                {opt.count > 0 && (
                  <span className={styles.filterCount}>{opt.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BsBoxSeam size={68} />
          </div>
          <h3>No orders found</h3>
          <p>
            {filter !== "all"
              ? `You don't have any ${filter} orders`
              : searchQuery
              ? "No orders match your search"
              : "You haven't placed any orders yet"}
          </p>
          <button onClick={() => navigate("/products")}>
            <FiShoppingBag size={15} /> Start Shopping
          </button>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.has(order._id);
            const displayProducts = isExpanded
              ? order.products
              : order.products?.slice(0, 2);

            return (
              <div
                key={order._id}
                className={`${styles.orderCard} ${
                  order.orderId === newOrderId ? styles.newOrder : ""
                }`}
              >
                {/* Order Header */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderMeta}>
                    <div className={styles.orderId}>
                      <span className={styles.label}>Order ID:</span>
                      <span className={styles.value}>{order.orderId}</span>
                    </div>
                    <div className={styles.orderDate}>
                      <FiCalendar size={13} />
                      <span>Placed on {formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div
                    className={`${styles.orderStatus} ${getStatusClass(
                      order.orderStatus
                    )}`}
                  >
                    {getStatusIcon(order.orderStatus)}
                    <span>{order.orderStatus}</span>
                  </div>
                </div>

                {/* Products List */}
                <div className={styles.productsSection}>
                  {displayProducts?.map((item, index) => (
                    <div key={index} className={styles.productItem}>
                      <div className={styles.productImage}>
                        {item.imgUrl || item.product?.imgUrl ? (
                          <img
                            src={item.imgUrl || item.product?.imgUrl}
                            alt={item.title || item.product?.title}
                            onError={(e) => {
                              e.target.src = "/placeholder-product.png";
                            }}
                          />
                        ) : (
                          <div className={styles.imagePlaceholder}>
                            <FiPackage size={24} />
                          </div>
                        )}
                        {item.quantity > 1 && (
                          <span className={styles.quantityBadge}>
                            ×{item.quantity}
                          </span>
                        )}
                      </div>

                      <div className={styles.productDetails}>
                        <h4 className={styles.productTitle}>
                          {item.title || item.product?.title || "Product"}
                        </h4>
                        <div className={styles.productMeta}>
                          {item.size && (
                            <span className={styles.metaItem}>
                              <strong>Size:</strong> {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className={styles.metaItem}>
                              <strong>Color:</strong> {item.color}
                            </span>
                          )}
                        </div>
                        <div className={styles.productPrice}>
                          {formatCurrency(item.price)}
                          {item.quantity > 1 && (
                            <span className={styles.priceNote}>
                              {" "}
                              × {item.quantity} ={" "}
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.productStatus}>
                        <div
                          className={`${styles.statusBadge} ${getStatusClass(
                            item.productStatus || order.orderStatus
                          )}`}
                        >
                          {getStatusIcon(
                            item.productStatus || order.orderStatus
                          )}
                          <span>{item.productStatus || order.orderStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Show More/Less Button */}
                  {order.products?.length > 2 && (
                    <button
                      className={styles.showMoreBtn}
                      onClick={() => toggleOrderExpansion(order._id)}
                    >
                      {isExpanded ? (
                        <>
                          <FiChevronUp size={16} />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <FiChevronDown size={16} />
                          <span>
                            Show {order.products.length - 2} More{" "}
                            {order.products.length - 2 === 1 ? "Item" : "Items"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Order Summary */}
                <div className={styles.orderSummary}>
                  <div className={styles.summaryRow}>
                    <div className={styles.summaryItem}>
                      <FiMapPin size={14} />
                      <span>
                        {order.shippingAddress?.city},{" "}
                        {order.shippingAddress?.state} -{" "}
                        {order.shippingAddress?.pincode}
                      </span>
                    </div>
                  </div>
                  {order.expectedDelivery &&
                    order.orderStatus?.toLowerCase() !== "delivered" &&
                    order.orderStatus?.toLowerCase() !== "cancelled" && (
                      <div className={styles.summaryRow}>
                        <div className={styles.summaryItem}>
                          <FiTruck size={14} />
                          <span>
                            Expected Delivery:{" "}
                            {formatDate(order.expectedDelivery)}
                          </span>
                        </div>
                      </div>
                    )}
                  {order.orderStatus?.toLowerCase() === "delivered" && (
                    <div className={styles.summaryRow}>
                      <div className={styles.summaryItem}>
                        <FiCheckCircle size={14} />
                        <span className={styles.deliveredText}>
                          Delivered on {formatDate(order.updatedAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Footer */}
                <div className={styles.orderFooter}>
                  <div className={styles.footerLeft}>
                    <div className={styles.totalAmount}>
                      <span className={styles.totalLabel}>Total Amount:</span>
                      <span className={styles.totalValue}>
                        {formatCurrency(order.finalAmount)}
                      </span>
                    </div>
                    <div className={styles.paymentMethod}>
                      {order.paymentMethod || "COD"}
                    </div>
                  </div>
                  <div className={styles.footerRight}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => navigate(`/order/${order._id}`)}
                    >
                      <span>View Full Details</span>
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
