import React from "react";
import ProductGrid from "./sections/ProductGrid";
import Filters from "./sections/Filters";
import styles from "../../../Styles/Seller/GetProducts.module.css";

const GetProducts = () => {
  return (
    <div className={styles["main"]}>
      <div className={styles["offer-label"]}>
        <p>
          Mid Season Sale! Save Upto 70% OFF + extra 10% off Use Code: MIDSALE10
        </p>
      </div>
      <div className={styles["main-content"]}>
        <p className={styles["page-map"]}>
          Home / Mens /{" "}
          <span className={styles["active-page"]}>Casual Shoes</span>
        </p>
        <div className={styles["products"]}>
          <Filters />
          <ProductGrid />
        </div>
      </div>
    </div>
  );
};

export default GetProducts;
