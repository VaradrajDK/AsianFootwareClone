import React from "react";
import styles from "../../Styles/Home/ProductGrid.module.css";

function ProductGrid() {
  const products = [
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204031%20(1)_59255053384229558340.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204032_14734236262245506492.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204039_90672949196093539788.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204033%20(1)_13569047980330021022.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204034_61180296517429699468.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204040%20(1)_12235459126064199331.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204035_24874611420214631778.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204036_90879312842763896294.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204042_97342203085006566587.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204037_55338453093556825432.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204038_26902640741275172654.png?tr=w-300",
    },
    {
      image:
        "https://cdn.asianlive.in/digital-website/Frame%204041_85499601221222562457.png?tr=w-300",
    },
  ];

  return (
    <div className={styles.productGrid}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {products.map((product, index) => (
            <div key={index} className={styles.productCard}>
              <div className={styles.imageContainer}>
                <img
                  src={product.image}
                  alt="Product category"
                  className={styles.productImage}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductGrid;
