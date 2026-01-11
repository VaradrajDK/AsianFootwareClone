import React from "react";
import styles from "../../Styles/Home/ShopFor.module.css";

function ShopFor() {
  const categories = [
    {
      title: "Mens",
      image:
        "https://cdn.asianlive.in/digital-website/Mens-Desktop_12021641401241132036.png?tr=w-400",
    },
    {
      title: "Womens",
      image:
        "https://cdn.asianlive.in/digital-website/Women-Desktop_14809000520619963746.png?tr=w-400",
    },
    {
      title: "Kids",
      image:
        "https://cdn.asianlive.in/digital-website/Kids-Desktop_47204462255591426779.png?tr=w-400",
    },
  ];

  return (
    <div className={styles.shopFor}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>SHOP FOR</h2>
        <div className={styles.categoriesGrid}>
          {categories.map((category, index) => (
            <div key={index} className={styles.categoryCard}>
              <div className={styles.imageContainer}>
                <img
                  src={category.image}
                  alt={category.title}
                  className={styles.categoryImage}
                />
              </div>
              {/* Text below the image */}
              <h3 className={styles.categoryTitle}>{category.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShopFor;
