// pages/Cart/components/CartItem.jsx
import React, { useState } from "react";
import styles from "../../Styles/cart/CartItem.module.css";

const CartItem = ({
  item,
  onRemove,
  onUpdateQuantity,
  onMoveToWishlist,
  isRemoving,
}) => {
  const [updating, setUpdating] = useState(false);

  const productId = item.product?._id || item.product;
  const title = item.title || item.product?.title || "Product";
  const image = item.imgUrl || item.product?.imgUrl || "/placeholder.png";
  const price = item.discountedprice || item.product?.sellingPrice || 0;
  const mrp = item.ogprice || item.product?.mrp || price;
  const size = item.size || "N/A";
  const color = item.color || "";
  const quantity = item.quantity || 1;

  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const handleQuantityChange = async (newQty) => {
    if (newQty < 1 || newQty > 10 || updating) return;
    setUpdating(true);
    await onUpdateQuantity(productId, size, color, newQty);
    setUpdating(false);
  };

  return (
    <div className={`${styles.card} ${isRemoving ? styles.removing : ""}`}>
      <div className={styles.productRow}>
        {/* Product Image */}
        <div className={styles.imageWrapper}>
          <img
            src={image}
            alt={title}
            className={styles.productImg}
            onError={(e) => {
              e.target.src = "/placeholder.png";
            }}
          />
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          <h3 className={styles.productName}>{title}</h3>

          <div className={styles.metaRow}>
            <span className={styles.meta}>Size: {size}</span>
            {color && <span className={styles.meta}>Color: {color}</span>}
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(price)}</span>
            {mrp > price && (
              <>
                <span className={styles.mrp}>{formatCurrency(mrp)}</span>
                <span className={styles.off}>{discount}% off</span>
              </>
            )}
          </div>

          {/* Quantity Selector */}
          <div className={styles.quantityRow}>
            <span className={styles.qtyLabel}>Qty:</span>
            <div className={styles.qtySelector}>
              <button
                className={styles.qtyBtn}
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1 || updating}
              >
                −
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button
                className={styles.qtyBtn}
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 10 || updating}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          className={styles.removeBtn}
          onClick={() => onRemove(productId, size, color)}
          disabled={isRemoving}
          title="Remove item"
        >
          ✕
        </button>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.wishlistBtn}
          onClick={() => onMoveToWishlist(item)}
        >
          Move to Wishlist
        </button>
      </div>
    </div>
  );
};

export default CartItem;
