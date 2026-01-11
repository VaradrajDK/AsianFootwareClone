import React from "react";
import Filters from "../Components/Filters";
import ProductCard from "../Components/ProductCard";
import styles from "../Styles/AllProducts.module.css";

const demoProducts = [
  {
    id: 1,
    name: "Gelon",
    subtitle: "Casual Shoes",
    price: 807,
    oldPrice: 4499,
    discount: 46,
    image:
      "https://cdn.asianlive.in/product_assets/tarzan-11/white-navy/primary-photo/primary%20photo_31840686291918569838.jpg",
    bestSeller: true,
    gender: "Mens",
    type: "Casual Shoes",
    size: "8 UK",
  },
  {
    id: 2,
    name: "Tarzan 11",
    subtitle: "Sports Shoes",
    price: 729,
    oldPrice: 4499,
    discount: 51,
    image:
      "https://cdn.asianlive.in/product_assets/boston-01/full-black/primary-photo/primary%20photo_33024931407031758063.jpg",
    bestSeller: true,
    gender: "Mens",
    type: "Sports Shoes",
    size: "9 UK",
  },
  {
    id: 3,
    name: "Mexico 11",
    subtitle: "Casual Shoes",
    price: 838,
    oldPrice: 4499,
    discount: 44,
    image:
      "https://cdn.asianlive.in/product_assets/mexico-11/beej-leaf-green/primary-photo/primary%20photo_24572989289198793306.jpg",
    bestSeller: true,
    gender: "Mens",
    type: "Casual Shoes",
    size: "7 UK",
  },
];

const AllProducts = () => {
  // You can replace these with real state/logic later
  const handleGenderChange = () => {};
  const handleSortChange = () => {};
  const handleSizeSelect = () => {};
  const handlePriceSelect = () => {};
  const handleTypeSelect = () => {};

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* LEFT FILTER SIDEBAR */}
        <div className={styles.sidebar}>
          <Filters
            onGenderChange={handleGenderChange}
            onSortChange={handleSortChange}
            onSizeSelect={handleSizeSelect}
            onPriceSelect={handlePriceSelect}
            onTypeSelect={handleTypeSelect}
            selectedGender={"Mens"}
          />
        </div>

        {/* RIGHT PRODUCT GRID AREA */}
        <div className={styles.mainContent}>
          <div className={styles.productsGrid}>
            {demoProducts.map((p) => (
              <div key={p.id} className={styles.productCardWrapper}>
                <ProductCard
                  product={p}
                  onAddToCart={() => console.log("Cart:", p.id)}
                  onAddToWishlist={() => console.log("Wishlist:", p.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
