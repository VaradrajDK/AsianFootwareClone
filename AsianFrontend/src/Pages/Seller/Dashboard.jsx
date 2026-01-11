import React, { useState } from "react";
import styles from "../../Styles/Seller/Dashboard.module.css";
import TopBar from "../../Components/Seller/Dashboard/TopBar";
import VerticalNavbar from "../../Components/Seller/Dashboard/VerticalNavbar";
import MainContent from "../../Components/Seller/Dashboard/MainContent";

const Dashboard = () => {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  // Existing state for Products
  const [selectedProductId, setSelectedProductId] = useState(null);

  // ✅ NEW: Add state for Banners
  const [selectedBannerId, setSelectedBannerId] = useState(null);

  return (
    <div className={styles["dashboard"]}>
      <TopBar />
      <div className={styles["dashboard-body"]}>
        <VerticalNavbar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

        <MainContent
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          // Pass Product props
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          // ✅ NEW: Pass Banner props
          selectedBannerId={selectedBannerId}
          setSelectedBannerId={setSelectedBannerId}
        />
      </div>
    </div>
  );
};

export default Dashboard;
