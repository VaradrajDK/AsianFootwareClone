import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { setWishlistCount, decrementWishlist } from "../Redux/userStore";
import styles from "../Styles/Wishlist.module.css";
import api from "../services/axiosConfig";

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);

  console.log("Wishlist - User from Redux:", user);
  console.log("Wishlist - User ID:", user?.userId || user?._id || user?.id);

  const getUserId = () => {
    return user?.userId || user?._id || user?.id || null;
  };

  useEffect(() => {
    const userId = getUserId();

    if (!userId) {
      setError("Please login to view your wishlist");
      setLoading(false);
      return;
    }

    fetchWishlistItems(userId);
  }, [user]);

  const fetchWishlistItems = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/wishlist?userId=${userId}`);

      console.log("Wishlist API Response:", response.data);

      const formattedItems = response.data.items.map((item) => ({
        wishlistId: item._id,
        id: item._id,
        productId: item.productId._id,
        title: item.title || item.productId?.title,
        // USE THE STORED IMAGE FIRST, FALLBACK TO PRODUCT IMAGE
        image:
          item.image ||
          item.productId?.images?.[0] ||
          item.productId?.image ||
          "",
        color: item.color || "N/A",
        price: item.sellingPrice || item.productId?.sellingPrice,
        originalPrice: item.mrp || item.productId?.mrp,
        discount:
          item.offer ||
          calculateDiscount(
            item.mrp || item.productId?.mrp,
            item.sellingPrice || item.productId?.sellingPrice
          ),
      }));

      setItems(formattedItems);
      dispatch(setWishlistCount(formattedItems.length));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Failed to load wishlist");
      toast.error("Failed to load wishlist");
      setLoading(false);
    }
  };

  const calculateDiscount = (mrp, sellingPrice) => {
    if (!mrp || !sellingPrice || mrp <= sellingPrice) return 0;
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
  };

  const handleRemoveItem = async (wishlistId, productId) => {
    try {
      const userId = getUserId();

      if (!userId) {
        toast.error("Please login to remove items");
        return;
      }

      console.log("Removing wishlist item:", { wishlistId, productId, userId });

      await api.delete(`/wishlist/deleteWishlistItem/${productId}`, {
        data: { userId },
      });

      // Update local state
      setItems(items.filter((item) => item.wishlistId !== wishlistId));

      // Update Redux count
      dispatch(decrementWishlist());

      toast.success("Item removed from wishlist");
    } catch (err) {
      console.error("Error removing item:", err);
      toast.error("Failed to remove item from wishlist");
    }
  };

  const handleMoveToCart = async (item) => {
    console.log("Move to cart:", item);
    toast.info("Move to cart feature coming soon!");
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  if (loading) {
    return (
      <div className={styles.wishlistPage}>
        <div className={styles.loading}>Loading wishlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wishlistPage}>
        <div className={styles.errorContainer}>
          <div className={styles.error}>{error}</div>
          {!getUserId() && (
            <button className={styles.loginBtn} onClick={handleLoginRedirect}>
              Login Now
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <h1 className={styles.title}>MY WISHLIST ({items.length})</h1>
      <p className={styles.subtitle}>
        Proceed to checkout to apply coupons and avail discounts.
      </p>

      <div className={styles.list}>
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.wishlistId} className={styles.card}>
              <button
                className={styles.closeBtn}
                aria-label="Remove item"
                onClick={() =>
                  handleRemoveItem(item.wishlistId, item.productId)
                }
              >
                ✕
              </button>

              <div className={styles.imageBox}>
                <img src={item.image} alt={item.title} />
              </div>

              <div className={styles.details}>
                <h3 className={styles.productTitle}>{item.title}</h3>
                <p className={styles.color}>{item.color}</p>

                <div className={styles.priceRow}>
                  <span className={styles.currentPrice}>Rs.{item.price}</span>
                  <span className={styles.originalPrice}>
                    Rs.{item.originalPrice}
                  </span>
                </div>

                <span className={styles.discount}>{item.discount}% off</span>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.moveToCart}
                  onClick={() => handleMoveToCart(item)}
                >
                  Move to cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.emptyMessage}>Your wishlist is empty</p>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
