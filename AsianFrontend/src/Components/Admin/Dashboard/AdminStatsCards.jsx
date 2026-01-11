// Components/Admin/Dashboard/AdminStatsCards.jsx
import React, { useState, useEffect } from "react";
import styles from "../../../Styles/Admin/AdminStatsCards.module.css";
import api from "../../../services/axiosConfig";
import {
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

const AdminStatsCards = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/dashboard");

      console.log("Dashboard API Response:", response.data);

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError("Failed to fetch dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError(error.response?.data?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const statsConfig = [
    {
      title: "Total Users",
      key: "totalUsers",
      icon: FiUsers,
      color: "#3b82f6",
      bgLight: "#eff6ff",
    },
    {
      title: "Total Sellers",
      key: "totalSellers",
      icon: FiShoppingBag,
      color: "#f59e0b",
      bgLight: "#fffbeb",
    },
    {
      title: "Total Products",
      key: "totalProducts",
      icon: FiPackage,
      color: "#10b981",
      bgLight: "#ecfdf5",
    },
    {
      title: "Total Orders",
      key: "totalOrders",
      icon: FiShoppingCart,
      color: "#8b5cf6",
      bgLight: "#f5f3ff",
    },
  ];

  if (loading) {
    return (
      <div className={styles["stats-grid"]}>
        {statsConfig.map((stat, i) => (
          <div
            key={i}
            className={`${styles["stat-card"]} ${styles["skeleton"]}`}
          >
            <div className={styles["stat-icon-skeleton"]}></div>
            <div className={styles["stat-content"]}>
              <div className={styles["skeleton-line"]}></div>
              <div className={styles["skeleton-line-short"]}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["error-state"]}>
        <p>{error}</p>
        <button onClick={fetchDashboardStats} className={styles["retry-btn"]}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles["stats-grid"]}>
      {statsConfig.map((config, index) => {
        const Icon = config.icon;
        const value = stats?.overview?.[config.key] || 0;

        return (
          <div key={index} className={styles["stat-card"]}>
            <div
              className={styles["stat-icon"]}
              style={{
                backgroundColor: config.bgLight,
                color: config.color,
              }}
            >
              <Icon size={26} />
            </div>
            <div className={styles["stat-content"]}>
              <p className={styles["stat-label"]}>{config.title}</p>
              <h3 className={styles["stat-value"]}>{value.toLocaleString()}</h3>
              {stats?.overview && (
                <div className={styles["stat-meta"]}>
                  <span className={styles["stat-active"]}>
                    Active:{" "}
                    {stats.overview[`active${config.title.split(" ")[1]}`] || 0}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStatsCards;
