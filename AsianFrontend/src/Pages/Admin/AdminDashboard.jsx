// Pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from "../../Styles/Admin/AdminDashboard.module.css";
import AdminTopBar from "../../Components/Admin/Dashboard/AdminTopBar";
import AdminVerticalNavbar from "../../Components/Admin/Dashboard/AdminVerticalNavbar";
import AdminMainContent from "../../Components/Admin/Dashboard/AdminMainContent";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // State management for different entities
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedBannerId, setSelectedBannerId] = useState(null);

  // ✅ Protection: Check if user is admin
  useEffect(() => {
    console.log("AdminDashboard - Current user:", user);

    if (!user) {
      console.log("No user found, redirecting to login");
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== "admin") {
      console.log("User is not admin, role:", user.role);
      navigate("/", { replace: true });
      return;
    }

    console.log("User is admin, showing dashboard");
    setLoading(false);
  }, [user, navigate]);

  // ✅ Show loading screen while checking
  if (loading) {
    return (
      <div className={styles["loading-container"]}>
        <div className={styles["spinner"]}></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  // ✅ Only render if user is admin
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className={styles["admin-dashboard"]}>
      <AdminTopBar />
      <div className={styles["dashboard-body"]}>
        <AdminVerticalNavbar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <AdminMainContent
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          selectedSellerId={selectedSellerId}
          setSelectedSellerId={setSelectedSellerId}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          selectedOrderId={selectedOrderId}
          setSelectedOrderId={setSelectedOrderId}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          selectedBannerId={selectedBannerId}
          setSelectedBannerId={setSelectedBannerId}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
