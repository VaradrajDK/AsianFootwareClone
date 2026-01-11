import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingBag,
  faCheckCircle,
  faClock,
  faIndianRupeeSign,
  faExclamationTriangle,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Seller/StatsCards.module.css";

const StatsCards = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    totalIncome: "₹0",
  });

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/seller/dashboard-stats");

      if (response.data.success) {
        const { orders, income } = response.data.stats;
        setStats({
          totalOrders: orders.total,
          completedOrders: orders.completed,
          pendingOrders: orders.pending,
          cancelledOrders: orders.cancelled,
          totalIncome: income.formatted,
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.response?.data?.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statsData = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: faShoppingBag,
      color: "#3498db",
    },
    {
      title: "Completed Orders",
      value: stats.completedOrders.toLocaleString(),
      icon: faCheckCircle,
      color: "#27ae60",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      icon: faClock,
      color: "#f39c12",
    },
    {
      title: "Income",
      value: stats.totalIncome,
      icon: faIndianRupeeSign,
      color: "#9b59b6",
    },
  ];

  // Loading State
  if (loading) {
    return (
      <div className={styles["stats-cards"]}>
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={`${styles["stat-card"]} ${styles["loading"]}`}
          >
            <div
              className={`${styles["stat-icon"]} ${styles["skeleton"]}`}
            ></div>
            <div className={styles["stat-content"]}>
              <div
                className={`${styles["skeleton"]} ${styles["skeleton-value"]}`}
              ></div>
              <div
                className={`${styles["skeleton"]} ${styles["skeleton-title"]}`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={styles["stats-cards"]}>
        <div className={styles["error-container"]}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className={styles["error-icon"]}
          />
          <p>{error}</p>
          <button onClick={fetchDashboardStats} className={styles["retry-btn"]}>
            <FontAwesomeIcon icon={faRefresh} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["stats-cards"]}>
      {statsData.map((stat, index) => (
        <div key={index} className={styles["stat-card"]}>
          <div
            className={styles["stat-icon"]}
            style={{ backgroundColor: stat.color }}
          >
            <FontAwesomeIcon icon={stat.icon} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>{stat.value}</h3>
            <p>{stat.title}</p>
          </div>
          <div
            className={styles["stat-progress"]}
            style={{ backgroundColor: `${stat.color}15` }}
          ></div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
