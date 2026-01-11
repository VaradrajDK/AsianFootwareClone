import React, { useState, useEffect } from "react";
import styles from "../../Styles/Home/BestSellers.module.css";
import api from "../../services/axiosConfig";

function BestSellers() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch best seller products from API
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setIsLoading(true);

        const response = await api.get("/public/products/tag/best-seller", {
          params: {
            limit: 10,
            page: 1,
          },
        });

        console.log("📦 Best Sellers Response:", response.data);

        if (response.data.success && response.data.products) {
          // Transform API data to match component format
          const formattedProducts = response.data.products.map((product) => ({
            name: product.title,
            price: `Rs. ${product.sellingPrice.toFixed(2)}`,
            image: getProductImage(product),
            _id: product._id,
            slug: product.slug,
          }));

          setProducts(formattedProducts);
          console.log("✅ Loaded", formattedProducts.length, "best sellers");
        }
      } catch (error) {
        console.error("❌ Error fetching best sellers:", error);
        // Keep empty array on error - component will show nothing
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  // Get product image from variants
  const getProductImage = (product) => {
    if (product.variants && product.variants[0]?.images?.[0]) {
      return product.variants[0].images[0];
    }
    return "https://via.placeholder.com/500x500?text=No+Image";
  };

  // Don't render anything while loading (maintains clean UI)
  if (isLoading) {
    return null;
  }

  // Don't render if no products (maintains clean UI)
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={styles.bestSellers}>
      <div className={styles.headerRow}>
        <h2>Best Seller</h2>
        <div className={styles.line}></div>
      </div>
      <p className={styles.subTitle}>
        Every Step Tells a Story — These Are the Favorites
      </p>

      <div className={styles.scrollRow}>
        {products.map((product, index) => (
          <div key={product._id || index} className={styles.card}>
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/500x500?text=No+Image";
              }}
            />
            <h3>{product.name}</h3>
            <p>{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BestSellers;
