import React, { useState, useEffect } from "react";
import styles from "../../Styles/Home/NewArrivals.module.css";
import api from "../../services/axiosConfig";

function NewArrivals() {
  const [selectedColors, setSelectedColors] = useState({});
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch new arrival products from API
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setIsLoading(true);

        // Fetch products with 'new-arrival' tag
        const response = await api.get("/public/products/tag/new-arrival", {
          params: {
            limit: 10, // Adjust as needed
            page: 1,
          },
        });

        console.log("📦 New Arrivals Response:", response.data);

        if (response.data.success && response.data.products) {
          setProducts(response.data.products);
          console.log(
            "✅ Loaded",
            response.data.products.length,
            "new arrival products"
          );
        }
      } catch (error) {
        console.error("❌ Error fetching new arrivals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  const handleColorClick = (productIndex, variantIndex) => {
    setSelectedColors((prev) => ({
      ...prev,
      [productIndex]: variantIndex,
    }));
  };

  const getProductImage = (product, index) => {
    const selectedVariantIndex = selectedColors[index] ?? 0; // Default to first variant

    if (product.variants && product.variants[selectedVariantIndex]) {
      const variant = product.variants[selectedVariantIndex];
      // Get the first image from the variant
      if (variant.images && variant.images.length > 0) {
        return variant.images[0];
      }
    }

    // Fallback to first variant's first image
    if (product.variants && product.variants[0]?.images?.[0]) {
      return product.variants[0].images[0];
    }

    return ""; // Placeholder if no image
  };

  const calculateDiscount = (mrp, sellingPrice) => {
    if (!mrp || !sellingPrice) return "0% off";
    const discount = Math.round(((mrp - sellingPrice) / mrp) * 100);
    return `${discount}% off`;
  };

  const getBadgeText = (product) => {
    // You can customize badge logic based on tags or other criteria
    if (product.tags?.includes("new-arrival")) return "NEW LAUNCH";
    if (product.tags?.includes("best-seller")) return "BEST SELLER";
    if (product.tags?.includes("featured")) return "FEATURED";
    return null;
  };

  if (isLoading) {
    return (
      <div className={styles.newArrivals}>
        <div className={styles.container}>
          <div className={styles.header}>
            <img
              src="https://cdn.asianlive.in/digital-website/New-Arrivals-%20desk_66827427184677116380.png"
              alt="New Arrivals"
              className={styles.headerImage}
            />
          </div>
          <div className={styles.loadingContainer}>
            <p>Loading new arrivals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.newArrivals}>
      <div className={styles.container}>
        {/* Header Section with Image */}
        <div className={styles.header}>
          <img
            src="https://cdn.asianlive.in/digital-website/New-Arrivals-%20desk_66827427184677116380.png"
            alt="New Arrivals"
            className={styles.headerImage}
          />
        </div>

        {/* Horizontal Scroll Container */}
        <div className={styles.horizontalScrollContainer}>
          <div className={styles.productsGrid}>
            {products.map((product, index) => (
              <div key={product._id} className={styles.productCard}>
                <div className={styles.productImageContainer}>
                  {/* Badge */}
                  {getBadgeText(product) && (
                    <div className={styles.badge}>{getBadgeText(product)}</div>
                  )}
                  <img
                    src={getProductImage(product, index)}
                    alt={product.title}
                    className={styles.productImage}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/320x320?text=No+Image";
                    }}
                  />
                </div>

                {/* Color/Variant Options */}
                {product.variants && product.variants.length > 0 && (
                  <div className={styles.colorOptions}>
                    {product.variants.map((variant, variantIndex) => (
                      <button
                        key={variantIndex}
                        className={`${styles.colorButton} ${
                          (selectedColors[index] ?? 0) === variantIndex
                            ? styles.colorButtonActive
                            : ""
                        }`}
                        onClick={() => handleColorClick(index, variantIndex)}
                        title={variant.colorName}
                      >
                        <img
                          src={variant.images?.[0] || ""}
                          alt={variant.colorName}
                          className={styles.colorImage}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/80x80?text=N/A";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.title}</h3>
                  <p className={styles.productDescription}>
                    {product.description || "No description available"}
                  </p>

                  <div className={styles.pricing}>
                    <span className={styles.discountedPrice}>
                      Rs. {product.sellingPrice.toFixed(2)}
                    </span>
                    <span className={styles.originalPrice}>
                      Rs. {product.mrp.toFixed(2)}
                    </span>
                    <span className={styles.discountBadge}>
                      {calculateDiscount(product.mrp, product.sellingPrice)}
                    </span>
                  </div>

                  <button
                    className={styles.addToCartBtn}
                    onClick={() => {
                      console.log("Add to cart:", product);
                      // Add your cart logic here
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className={styles.viewAllContainer}>
          <button
            className={styles.viewAllBtn}
            onClick={() => {
              // Navigate to all new arrivals page
              console.log("View all new arrivals");
            }}
          >
            View All
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewArrivals;
