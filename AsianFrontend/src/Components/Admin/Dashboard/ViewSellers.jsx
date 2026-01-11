// Components/Admin/Dashboard/ViewSellers.jsx
import React from "react";
//import styles from "../../../Styles/Admin/ViewSellers.module.css";

const ViewSellers = ({
  setActiveMenu,
  setSelectedSellerId,
  showOnlyPending,
}) => {
  return (
    <div className={styles.container}>
      <h1>{showOnlyPending ? "Pending Verification" : "Seller Management"}</h1>
      <p>Coming soon...</p>
    </div>
  );
};

export default ViewSellers;
