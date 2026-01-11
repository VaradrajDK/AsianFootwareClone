// components/ProductSidebar.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  incrementWishlist,
  decrementWishlist,
  incrementCart,
} from "../../Redux/userStore";
import api from "../../services/axiosConfig";
import styles from "../../Styles/SingleProduct/ProductSidebar.module.css";

const ProductSidebar = ({
  product,
  selectedColorIndex,
  setSelectedColorIndex,
}) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Correct Redux selector for user
  const user = useSelector((state) => state.user.userInfo);

  const getUserId = () => user?.userId || user?._id || user?.id || null;

  const getProductId = () => product?._id || product?.id || null;

  const getProductImage = () => {
    return (
      product?.image ||
      product?.images?.[0] ||
      product?.colors?.[selectedColorIndex]?.img ||
      product?.variants?.[selectedColorIndex]?.images?.[0] ||
      product?.imageUrl ||
      null
    );
  };

  const getProductColor = () => {
    return (
      product?.colors?.[selectedColorIndex]?.name ||
      product?.variants?.[selectedColorIndex]?.colorName ||
      product?.colorName ||
      product?.color ||
      null
    );
  };

  // Check wishlist status
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const userId = getUserId();
        const productId = getProductId();
        if (!userId || !productId) return;

        const response = await api.get("/wishlist/check", {
          params: { userId, productId },
        });
        setIsLiked(response.data.isInWishlist);
      } catch (error) {
        console.error("Error checking wishlist:", error);
      }
    };

    if (user && product) {
      checkWishlistStatus();
    } else {
      setIsLiked(false);
    }
  }, [product, user]);

  // Reset size on color change
  useEffect(() => {
    setSelectedSize(null);
  }, [selectedColorIndex]);

  const handleWishlistClick = async () => {
    if (isLoading) return;

    const userId = getUserId();
    const productId = getProductId();

    if (!userId) {
      toast.info("Please login to add items to wishlist");
      navigate("/login");
      return;
    }

    if (!productId) {
      toast.error("Product information is missing");
      return;
    }

    const newLiked = !isLiked;
    dispatch(newLiked ? incrementWishlist() : decrementWishlist());
    setIsLiked(newLiked);
    setIsLoading(true);

    try {
      if (newLiked) {
        await api.post("/wishlist/addWishlistItem", {
          userId,
          productId,
          color: getProductColor(),
          image: getProductImage(),
        });
        toast.success("Added to wishlist!");
      } else {
        await api.delete(`/wishlist/deleteWishlistItem/${productId}`, {
          data: { userId, color: getProductColor() },
        });
        toast.success("Removed from wishlist");
      }
    } catch (error) {
      dispatch(newLiked ? decrementWishlist() : incrementWishlist());
      setIsLiked(!newLiked);
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.warning("Please select a size");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const productId = getProductId();
    if (!productId) {
      toast.error("Product information is missing");
      return;
    }

    if (isAddingToCart) return;
    setIsAddingToCart(true);

    try {
      const response = await api.post("/product/addToCart", {
        productId,
        quantity: 1,
        size: selectedSize,
        color: getProductColor(),
      });

      if (response.data.success) {
        dispatch(incrementCart());
        toast.success("Added to cart!");
      } else {
        throw new Error(response.data.message || "Failed to add to cart");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (!product) return null;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const availableSizes =
    product?.variants?.[selectedColorIndex]?.sizes?.filter(
      (s) => s.stock > 0
    ) || [];
  const hasAvailableSizes = availableSizes.length > 0;

  const fullDescription = product.description || product.subCategory || "";

  return (
    <div className={styles.sidebar}>
      <h1 className={styles.title}>{product.title}</h1>

      <p
        className={styles.subtitle}
        title={fullDescription}
        data-fulltext={fullDescription}
      >
        {fullDescription}
      </p>

      <div className={styles.priceRow}>
        <span className={styles.currentPrice}>
          {formatCurrency(product.currentPrice || product.sellingPrice)}
        </span>
        <span className={styles.originalPrice}>
          {formatCurrency(product.originalPrice || product.mrp)}
        </span>
        <span className={styles.discount}>
          ({product.discountPercentage}% OFF)
        </span>

        <button
          className={`${styles.wishlistBtn} ${
            isLiked ? styles.wishlistActive : ""
          } ${isLoading ? styles.wishlistLoading : ""}`}
          onClick={handleWishlistClick}
          disabled={isLoading}
          title={
            user
              ? isLiked
                ? "Remove from wishlist"
                : "Add to wishlist"
              : "Login to add to wishlist"
          }
        >
          {isLiked ? "♥" : "♡"}
        </button>
      </div>

      <div className={styles.divider} />

      {product.colors && product.colors.length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>
            SELECT COLOUR ({product.colors.length})
          </h3>

          <div className={styles.colorRow}>
            {product.colors.map((color, index) => (
              <div
                key={index}
                className={`${styles.colorBox} ${
                  index === selectedColorIndex ? styles.activeColor : ""
                }`}
                onClick={() => {
                  if (color.hasStock) {
                    setSelectedColorIndex(index);
                  }
                }}
                style={{
                  opacity: color.hasStock ? 1 : 0.4,
                  cursor: color.hasStock ? "pointer" : "not-allowed",
                }}
                title={color.name || `Color ${index + 1}`}
              >
                <img src={color.img} alt={color.name || ""} />
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.sizeHeader}>
        <h3 className={styles.sectionTitle}>SELECT SIZE (UK)</h3>
        <span className={styles.sizeChart}>Size chart</span>
      </div>

      <div className={styles.sizeRow}>
        {hasAvailableSizes ? (
          availableSizes.map((sizeObj) => (
            <button
              key={sizeObj.size}
              className={`${styles.sizeBtn} ${
                selectedSize === sizeObj.size ? styles.activeSize : ""
              }`}
              onClick={() => setSelectedSize(sizeObj.size)}
            >
              {sizeObj.size}
            </button>
          ))
        ) : (
          <span style={{ color: "#878787", fontSize: "13px" }}>
            No sizes available for this color
          </span>
        )}
      </div>

      <button
        className={styles.addToCart}
        onClick={handleAddToCart}
        disabled={!selectedSize || isAddingToCart || !hasAvailableSizes}
      >
        {isAddingToCart ? "ADDING..." : "ADD TO CART"}
      </button>

      <div className={styles.delivery}>
        <p>
          <strong>FREE 7 DAYS RETURN</strong>
          <br />
          Choose to return or exchange for a different product
        </p>
      </div>
    </div>
  );
};

export default ProductSidebar;
