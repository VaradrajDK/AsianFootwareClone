import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { incrementWishlist, decrementWishlist } from "../Redux/userStore";
import QuickAddModal from "../Modals/QuickAddModal";
import styles from "../Styles/ProductCard.module.css";
import api from "../services/axiosConfig";

const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.userInfo);

  const placeholderImage = "https://via.placeholder.com/300x300?text=No+Image";

  const getProductId = () => {
    return product._id || product.id || null;
  };

  const getUserId = () => {
    return user?.userId || user?._id || user?.id || null;
  };

  const getProductImage = () => {
    return (
      product.image ||
      product.images?.[0] ||
      product.imageUrl ||
      product.thumbnail ||
      null
    );
  };

  const getProductColor = () => {
    return product.colorName || product.color || product.colorVariant || null;
  };

  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const userId = getUserId();
        const productId = getProductId();

        if (!userId || !productId) {
          return;
        }

        const response = await api.get("/wishlist/check", {
          params: { userId, productId },
        });

        if (response.data.isInWishlist) {
          setIsLiked(true);
        }
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };

    if (user) {
      checkWishlistStatus();
    } else {
      setIsLiked(false);
    }
  }, [product, user]);

  const handleLikeClick = async (e) => {
    e.stopPropagation();

    if (isLoading) return;

    const userId = getUserId();
    const productId = getProductId();

    if (!userId) {
      toast.info("Please login to add items to wishlist", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate("/login");
      return;
    }

    if (!productId) {
      toast.error("Product information is missing", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const newLiked = !isLiked;

    if (newLiked) {
      dispatch(incrementWishlist());
    } else {
      dispatch(decrementWishlist());
    }

    setIsLiked(newLiked);
    setIsLoading(true);

    if (onAddToWishlist) {
      onAddToWishlist();
    }

    try {
      const color = getProductColor();
      const image = getProductImage();

      if (newLiked) {
        await api.post("/wishlist/addWishlistItem", {
          userId,
          productId,
          color,
          image,
        });

        toast.success("Added to wishlist!", {
          position: "top-right",
          autoClose: 2000,
        });
      } else {
        await api.delete(`/wishlist/deleteWishlistItem/${productId}`, {
          data: { userId, color },
        });

        toast.success("Removed from wishlist", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);

      if (newLiked) {
        dispatch(decrementWishlist());
      } else {
        dispatch(incrementWishlist());
      }

      setIsLiked(!newLiked);

      toast.error("Failed to update wishlist. Please try again.", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCartClick = (e) => {
    e.stopPropagation();

    console.log("Cart clicked!"); // DEBUG

    const userId = getUserId();
    const productId = getProductId();

    console.log("User ID:", userId, "Product ID:", productId); // DEBUG

    if (!userId) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (!productId) {
      toast.error("Product ID is missing");
      return;
    }

    console.log("Setting showQuickAdd to true"); // DEBUG
    setShowQuickAdd(true);
  };

  const handleCloseModal = () => {
    console.log("Closing modal"); // DEBUG
    setShowQuickAdd(false);
  };

  const handleCardClick = () => {
    const productId = getProductId();
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN").format(price || 0);
  };

  console.log("showQuickAdd:", showQuickAdd); // DEBUG

  return (
    <>
      <div className={styles.container} onClick={handleCardClick}>
        {product.bestSeller && (
          <div className={styles.topLeftIcon}>
            <img
              src="https://cdn.asianlive.in/digital-website/BS%20(1)_54828215073027878508.png"
              className={styles.iconImage}
              alt="Best Seller"
            />
          </div>
        )}

        {product.discount > 0 && (
          <div className={styles.discountBadge}>{product.discount}% OFF</div>
        )}

        <div
          className={`${styles.likeIcon} ${isLoading ? styles.loading : ""}`}
          onClick={handleLikeClick}
          title={
            user
              ? isLiked
                ? "Remove from wishlist"
                : "Add to wishlist"
              : "Login to add to wishlist"
          }
        >
          <svg
            className={styles.heartIcon}
            viewBox="0 0 24 24"
            fill={isLiked ? "#e74c3c" : "none"}
            stroke={isLiked ? "#e74c3c" : "#666"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {isLoading && <div className={styles.loadingSpinner}></div>}
        </div>

        <div className={styles.productImageContainer}>
          <img
            src={
              imageError
                ? placeholderImage
                : getProductImage() || placeholderImage
            }
            className={styles.productImage}
            alt={product.name || "Product"}
            onError={handleImageError}
            loading="lazy"
          />
        </div>

        <div className={styles.productTitle}>
          <h3 className={styles.productName}>
            {product.name || product.title || "Untitled Product"}
          </h3>
          <p className={styles.productSubtitle}>
            {product.subtitle || "Shoes"}
          </p>
        </div>

        <div className={styles.priceCartSection}>
          <div className={styles.priceSection}>
            <h3 className={styles.currentPrice}>
              ₹{formatPrice(product.price || product.sellingPrice)}
            </h3>
            <div className={styles.priceComparison}>
              {(product.oldPrice || product.mrp) >
                (product.price || product.sellingPrice) && (
                <>
                  <span className={styles.oldPrice}>
                    ₹{formatPrice(product.oldPrice || product.mrp)}
                  </span>
                  {product.discount > 0 && (
                    <span className={styles.discount}>
                      ({product.discount}% off)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={styles.cartButton} onClick={handleCartClick}>
            <svg className={styles.cartIcon} viewBox="0 0 24 24" fill="white">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {showQuickAdd && (
        <QuickAddModal productId={getProductId()} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default ProductCard;
