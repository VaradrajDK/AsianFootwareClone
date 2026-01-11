// pages/Cart/components/EmptyCart.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../Styles/cart/EmptyCart.module.css";

const EmptyCart = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.cartIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>

        <h2 className={styles.title}>Your cart is empty</h2>
        <p className={styles.subtitle}>
          Looks like you haven't added anything to your cart yet.
          <br />
          Start shopping to fill it up!
        </p>

        <button className={styles.shopBtn} onClick={() => navigate("/")}>
          Continue Shopping
        </button>

        <button
          className={styles.wishlistLink}
          onClick={() => navigate("/wishlist")}
        >
          Check your wishlist
        </button>
      </div>
    </div>
  );
};

export default EmptyCart;
