// OrderConfirmation.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FiCheck,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiCopy,
  FiDownload,
  FiArrowLeft,
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { BsBox, BsReceipt } from "react-icons/bs";
import { MdLocalShipping } from "react-icons/md";
import api from "../../services/axiosConfig";
import styles from "../../Styles/Orders/OrderConfirmation.module.css";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order && orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/product/getOrderById/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order?.orderId || orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <FiPackage size={48} />
        <p>{error}</p>
        <button onClick={() => navigate("/orders")}>View All Orders</button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Success Header */}
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>
          <FiCheck size={32} />
        </div>
        <h1>Order Placed Successfully!</h1>
        <p>
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
      </div>

      <div className={styles.layout}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Order Info Card */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>
                <BsReceipt size={16} /> Order Details
              </h2>
              <span className={styles.orderStatus}>
                <FiClock size={12} />
                {order?.orderStatus || "Pending"}
              </span>
            </div>

            <div className={styles.orderInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Order ID</span>
                <span className={styles.value}>
                  {order?.orderId}
                  <button className={styles.copyBtn} onClick={copyOrderId}>
                    {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                  </button>
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Order Date</span>
                <span className={styles.value}>
                  {formatDate(order?.createdAt)} at{" "}
                  {formatTime(order?.createdAt)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Payment Method</span>
                <span className={styles.value}>{order?.paymentMethod}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Payment Status</span>
                <span className={`${styles.value} ${styles.paymentStatus}`}>
                  {order?.paymentStatus || "Pending"}
                </span>
              </div>
            </div>
          </section>

          {/* Delivery Address Card */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>
                <FiMapPin size={16} /> Delivery Address
              </h2>
            </div>

            <div className={styles.addressBox}>
              <p className={styles.name}>{order?.shippingAddress?.name}</p>
              <p className={styles.addr}>{order?.shippingAddress?.address}</p>
              <p className={styles.addr}>
                {order?.shippingAddress?.city}, {order?.shippingAddress?.state}{" "}
                - {order?.shippingAddress?.pincode}
              </p>
              <p className={styles.phone}>
                <FiPhone size={12} />
                {order?.shippingAddress?.phone}
              </p>
            </div>

            <div className={styles.deliveryEstimate}>
              <MdLocalShipping size={20} />
              <div>
                <span className={styles.estLabel}>Expected Delivery</span>
                <span className={styles.estDate}>
                  {order?.expectedDelivery
                    ? formatDate(order.expectedDelivery)
                    : "Within 7 days"}
                </span>
              </div>
            </div>
          </section>

          {/* Order Items Card */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>
                <BsBox size={16} /> Order Items ({order?.products?.length || 0})
              </h2>
            </div>

            <div className={styles.itemsList}>
              {order?.products?.map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <div className={styles.itemImage}>
                    <img
                      src={item.imgUrl || item.product?.imgUrl}
                      alt={item.title || item.product?.title}
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <h4>{item.title || item.product?.title}</h4>
                    <div className={styles.itemMeta}>
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                    <div className={styles.itemPrice}>
                      <span className={styles.price}>
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                      <span className={styles.itemStatus}>
                        {item.productStatus || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <aside className={styles.rightCol}>
          {/* Price Summary Card */}
          <div className={styles.sideCard}>
            <h3>
              <FiPackage size={14} /> Price Summary
            </h3>

            <div className={styles.priceDetails}>
              <div className={styles.priceRow}>
                <span>Subtotal</span>
                <span>₹{Number(order?.totalAmount || 0).toFixed(2)}</span>
              </div>
              {order?.couponDiscount > 0 && (
                <div className={styles.priceRow}>
                  <span>Coupon Discount</span>
                  <span className={styles.discount}>
                    -₹{Number(order.couponDiscount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className={styles.priceRow}>
                <span>Delivery Charges</span>
                <span
                  className={order?.deliveryCharges === 0 ? styles.free : ""}
                >
                  {order?.deliveryCharges === 0
                    ? "FREE"
                    : `₹${order?.deliveryCharges}`}
                </span>
              </div>
              <div className={styles.totalRow}>
                <span>Total Paid</span>
                <span>₹{Number(order?.finalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className={styles.sideCard}>
            <h3>Quick Actions</h3>
            <div className={styles.actionBtns}>
              <button
                className={styles.actionBtn}
                onClick={() => navigate("/orders")}
              >
                <FiPackage size={16} />
                View All Orders
              </button>
              <button className={styles.actionBtn}>
                <FiDownload size={16} />
                Download Invoice
              </button>
              <button
                className={styles.actionBtnPrimary}
                onClick={() => navigate("/products")}
              >
                <FiShoppingBag size={16} />
                Continue Shopping
              </button>
            </div>
          </div>

          {/* Help Card */}
          <div className={styles.helpCard}>
            <h4>Need Help?</h4>
            <p>Contact our support team for any order related queries.</p>
            <a href="mailto:support@example.com">support@example.com</a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OrderConfirmation;
