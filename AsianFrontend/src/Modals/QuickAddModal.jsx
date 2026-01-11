// components/QuickAddModal.jsx
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { incrementCart } from "../Redux/userStore";
import { decrementWishlist } from "../Redux/userStore";
import api from "../services/axiosConfig";
import styles from "./QuickAddModal.module.css";

export default function QuickAddModal({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Correct Redux selector
  const user = useSelector((state) => state.user.userInfo);

  const getUserId = () => user?.userId || user?._id || user?.id || null;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        toast.error("No product ID provided");
        onClose();
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(
          `/public-products/products/${productId}`
        );

        if (response.data.success && response.data.data) {
          const productData = response.data.data;
          setProduct(productData);

          if (productData.variants && productData.variants.length > 0) {
            setSelectedColor(productData.variants[0].colorName);
            if (productData.variants[0].images?.length > 0) {
              setCurrentImage(productData.variants[0].images[0]);
            }
          }
        } else {
          throw new Error(response.data.message || "Failed to fetch product");
        }

        const userId = getUserId();
        if (userId) {
          try {
            const wishlistRes = await api.get("/wishlist/check", {
              params: { userId, productId },
            });
            setIsInWishlist(wishlistRes.data.isInWishlist);
          } catch (err) {
            console.log("Wishlist check failed");
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    setSelectedSize(null);

    const selectedVariant = product.variants?.find(
      (v) => v.colorName === colorName
    );
    if (selectedVariant?.images?.length > 0) {
      setCurrentImage(selectedVariant.images[0]);
    }
  };

  const getSizesForSelectedColor = () => {
    if (!product?.variants || !selectedColor) return [];

    const selectedVariant = product.variants.find(
      (v) => v.colorName === selectedColor
    );
    if (!selectedVariant?.sizes) return [];

    return selectedVariant.sizes.map((s) => ({
      size: s.size,
      stock: s.stock,
      inStock: s.inStock || s.stock > 0,
      price: s.price || product.sellingPrice,
    }));
  };

  const handleRemoveFromWishlist = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        toast.warning("Please login to manage wishlist");
        return;
      }

      await api.delete(`/wishlist/deleteWishlistItem/${productId}`, {
        data: { userId },
      });

      dispatch(decrementWishlist());
      setIsInWishlist(false);
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.warning("Please select a size");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      toast.warning("Please login to add items to cart");
      navigate("/login");
      onClose();
      return;
    }

    try {
      setAddingToCart(true);

      await api.post("/product/addToCart", {
        productId: product.id || productId,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
      });

      dispatch(incrementCart());
      toast.success("Added to cart!");
      onClose();
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const availableSizes = getSizesForSelectedColor();
  const hasAnySizeInStock = availableSizes.some((s) => s.inStock);

  const displayImage =
    currentImage || product.variants?.[0]?.images?.[0] || "/placeholder.png";
  const displayTitle = product.title || "Untitled Product";
  const displayPrice = product.sellingPrice || 0;
  const displayMrp = product.mrp || 0;
  const displayDiscount = product.discountPercentage || 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>Quick Add</span>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.imageWrapper}>
            <img
              src={displayImage}
              alt={displayTitle}
              className={styles.productImage}
              onError={(e) => {
                e.target.src = "/placeholder.png";
              }}
            />
            {displayDiscount > 0 && (
              <span className={styles.discountBadge}>
                {displayDiscount}% OFF
              </span>
            )}
          </div>

          <div className={styles.infoSection}>
            <h2 className={styles.productTitle}>{displayTitle}</h2>

            {product.category && (
              <p className={styles.category}>
                {product.gender} • {product.category}
              </p>
            )}

            <div className={styles.priceRow}>
              <span className={styles.price}>
                ₹{displayPrice.toLocaleString()}
              </span>
              {displayMrp > displayPrice && (
                <>
                  <span className={styles.mrp}>
                    ₹{displayMrp.toLocaleString()}
                  </span>
                  <span className={styles.discountText}>
                    {displayDiscount}% off
                  </span>
                </>
              )}
            </div>

            {isInWishlist && (
              <button
                className={styles.wishlistBtn}
                onClick={handleRemoveFromWishlist}
              >
                ♥ Remove from Wishlist
              </button>
            )}
          </div>
        </div>

        {/* Color Selection */}
        {product.availableColors && product.availableColors.length > 1 && (
          <div className={styles.optionSection}>
            <div className={styles.optionHeader}>
              <span>Color: {selectedColor}</span>
            </div>
            <div className={styles.colorGrid}>
              {product.availableColors.map((color) => (
                <button
                  key={color.name}
                  className={`${styles.colorBtn} ${
                    selectedColor === color.name ? styles.colorSelected : ""
                  }`}
                  onClick={() =>
                    color.hasStock && handleColorSelect(color.name)
                  }
                  disabled={!color.hasStock}
                  style={{ backgroundColor: color.hexCode }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div className={styles.optionSection}>
          <div className={styles.optionHeader}>
            <span>Select Size</span>
            <span className={styles.sizeGuide}>Size Guide</span>
          </div>
          <div className={styles.sizeGrid}>
            {availableSizes.length > 0 ? (
              availableSizes.map((sizeObj) => (
                <button
                  key={sizeObj.size}
                  className={`${styles.sizeBtn} ${
                    !sizeObj.inStock ? styles.sizeDisabled : ""
                  } ${
                    selectedSize === sizeObj.size ? styles.sizeSelected : ""
                  }`}
                  disabled={!sizeObj.inStock}
                  onClick={() => setSelectedSize(sizeObj.size)}
                >
                  {sizeObj.size}
                </button>
              ))
            ) : (
              <p className={styles.noSizes}>No sizes available</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.addToCartBtn}
            onClick={handleAddToCart}
            disabled={!selectedSize || addingToCart || !hasAnySizeInStock}
          >
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
