// pages/Cart/components/CartSummary.jsx
import React, { useState } from "react";
import styles from "../../Styles/cart/CartSummary.module.css";

const CartSummary = ({ totals, onPlaceOrder, isLoading }) => {
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;

    // Simulate coupon validation
    if (couponCode.toUpperCase() === "SAVE10") {
      const discount = totals.cartTotal * 0.1;
      setCouponDiscount(discount);
      setCouponApplied(true);
    } else {
      setCouponApplied(false);
      setCouponDiscount(0);
      alert("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setCouponDiscount(0);
  };

  const finalTotal = totals.orderTotal - couponDiscount;

  return (
    <div className={styles.container}>
      {/* Coupon Section */}
      <div className={styles.couponSection}>
        <h3 className={styles.couponHeading}>Discount & Coupons</h3>
        <p className={styles.couponSubText}>
          Apply coupon code to get additional discounts.
        </p>

        {!couponApplied ? (
          <div className={styles.couponInput}>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className={styles.input}
            />
            <button onClick={handleApplyCoupon} className={styles.applyBtn}>
              Apply
            </button>
          </div>
        ) : (
          <div className={styles.couponApplied}>
            <span className={styles.couponTag}>
              {couponCode}
              <button onClick={handleRemoveCoupon} className={styles.removeTag}>
                ✕
              </button>
            </span>
            <span className={styles.couponSaved}>
              You save {formatCurrency(couponDiscount)}
            </span>
          </div>
        )}
      </div>

      {/* Price Details */}
      <div className={styles.priceCard}>
        <h3 className={styles.priceHeading}>PRICE DETAILS</h3>

        <div className={styles.priceLine}>
          <span>Cart Total ({totals.itemCount} items)</span>
          <span>{formatCurrency(totals.mrpTotal)}</span>
        </div>

        {totals.discount > 0 && (
          <div className={styles.priceLine}>
            <span>Product Discount</span>
            <span className={styles.green}>
              - {formatCurrency(totals.discount)}
            </span>
          </div>
        )}

        {couponDiscount > 0 && (
          <div className={styles.priceLine}>
            <span>Coupon Discount</span>
            <span className={styles.green}>
              - {formatCurrency(couponDiscount)}
            </span>
          </div>
        )}

        <div className={styles.priceLine}>
          <span>Delivery Charges</span>
          <span className={totals.deliveryCharges === 0 ? styles.green : ""}>
            {totals.deliveryCharges === 0
              ? "Free"
              : formatCurrency(totals.deliveryCharges)}
          </span>
        </div>

        {totals.deliveryCharges > 0 && (
          <p className={styles.freeDeliveryHint}>
            Add {formatCurrency(999 - totals.cartTotal)} more for free delivery
          </p>
        )}

        <div className={styles.divider}></div>

        <div className={styles.totalLine}>
          <span>Order Total</span>
          <span className={styles.total}>{formatCurrency(finalTotal)}</span>
        </div>

        {totals.discount > 0 && (
          <p className={styles.savings}>
            You will save {formatCurrency(totals.discount + couponDiscount)} on
            this order
          </p>
        )}

        <button
          className={styles.orderBtn}
          onClick={onPlaceOrder}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Place Order"}
        </button>

        {/* Trust Badges */}
        <div className={styles.trustBadges}>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>🔒</span>
            <span>Secure Checkout</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>↩️</span>
            <span>Easy Returns</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
