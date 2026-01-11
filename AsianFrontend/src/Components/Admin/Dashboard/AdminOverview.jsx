// Components/Admin/Dashboard/AdminOverview.jsx
import React, { useState, useEffect } from "react";
import styles from "../../../Styles/Admin/AdminOverview.module.css";
import api from "../../../services/axiosConfig";
import {
  FiTrendingUp,
  FiUsers,
  FiShoppingCart,
  FiPackage,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";

const AdminOverview = () => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [dashboardRes, activityRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/recent-activity?limit=10"),
      ]);

      if (dashboardRes.data.success) {
        setDashboardData(dashboardRes.data.data);
      }

      if (activityRes.data.success) {
        setRecentActivity(activityRes.data.activities);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "order":
        return <FiShoppingCart size={18} />;
      case "user":
        return <FiUsers size={18} />;
      case "product":
        return <FiPackage size={18} />;
      default:
        return <FiPackage size={18} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "order":
        return "#8b5cf6";
      case "user":
        return "#3b82f6";
      case "product":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className={styles["overview-container"]}>
        <div className={styles["loading-skeleton"]}>
          <div className={styles["skeleton-chart"]}></div>
          <div className={styles["skeleton-list"]}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["overview-container"]}>
      {/* Revenue Chart Card */}
      <div className={`${styles["chart-card"]} ${styles["large-chart"]}`}>
        <div className={styles["card-header"]}>
          <h3 className={styles["card-title"]}>
            <FiDollarSign />
            Revenue Overview
          </h3>
          <button
            className={styles["refresh-btn"]}
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <FiRefreshCw
              className={refreshing ? styles["spinning"] : ""}
              size={16}
            />
            <span>Refresh</span>
          </button>
        </div>
        <div className={styles["stats-row"]}>
          <div className={styles["stat-item"]}>
            <span className={styles["stat-label"]}>Total Revenue</span>
            <h2 className={styles["stat-value"]}>
              ₹{dashboardData?.revenue?.total?.toLocaleString("en-IN") || 0}
            </h2>
          </div>
          <div className={styles["stat-item"]}>
            <span className={styles["stat-label"]}>Avg Order Value</span>
            <h2 className={styles["stat-value"]}>
              ₹
              {Math.round(
                dashboardData?.revenue?.avgOrderValue || 0
              ).toLocaleString("en-IN")}
            </h2>
          </div>
          <div className={styles["stat-item"]}>
            <span className={styles["stat-label"]}>Today's Revenue</span>
            <h2 className={styles["stat-value"]}>
              ₹{dashboardData?.today?.revenue?.toLocaleString("en-IN") || 0}
            </h2>
          </div>
        </div>

        {/* Order Trend Chart Placeholder */}
        <div className={styles["chart-placeholder"]}>
          <FiTrendingUp size={48} style={{ opacity: 0.3 }} />
          <p>Chart visualization coming soon</p>
          {dashboardData?.orderTrend && (
            <div className={styles["trend-data"]}>
              {dashboardData.orderTrend.slice(0, 7).map((item, idx) => (
                <div key={idx} className={styles["trend-item"]}>
                  <span>{item._id}</span>
                  <span>{item.count} orders</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className={`${styles["chart-card"]} ${styles["small-chart"]}`}>
        <div className={styles["card-header"]}>
          <h3 className={styles["card-title"]}>
            <FiTrendingUp />
            Recent Activity
          </h3>
        </div>
        <div className={styles["recent-list"]}>
          {recentActivity.length === 0 ? (
            <div className={styles["empty-state"]}>
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivity.map((activity, idx) => (
              <div key={idx} className={styles["recent-item"]}>
                <div
                  className={styles["item-icon"]}
                  style={{ background: getActivityColor(activity.type) }}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className={styles["item-content"]}>
                  <h4 className={styles["item-title"]}>
                    {activity.type === "order" &&
                      `Order ${activity.data.orderId}`}
                    {activity.type === "user" &&
                      `New user: ${activity.data.name}`}
                    {activity.type === "product" && activity.data.title}
                  </h4>
                  <p className={styles["item-subtitle"]}>
                    {activity.type === "order" && activity.data.user?.name}
                    {activity.type === "user" && activity.data.email}
                    {activity.type === "product" &&
                      activity.data.seller?.brandName}
                  </p>
                </div>
                <div className={styles["item-meta"]}>
                  {activity.type === "order" && (
                    <p className={styles["item-value"]}>
                      ₹{activity.data.totalAmount?.toLocaleString("en-IN")}
                    </p>
                  )}
                  {activity.type === "product" && (
                    <p className={styles["item-value"]}>
                      ₹{activity.data.sellingPrice?.toLocaleString("en-IN")}
                    </p>
                  )}
                  <p className={styles["item-date"]}>
                    {formatDate(activity.date)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className={`${styles["chart-card"]} ${styles["full-width"]}`}>
        <div className={styles["card-header"]}>
          <h3 className={styles["card-title"]}>
            <FiShoppingCart />
            Orders Overview
          </h3>
        </div>
        <div className={styles["quick-stats"]}>
          <div className={styles["quick-stat"]}>
            <span className={styles["quick-stat-label"]}>Pending</span>
            <h3
              className={styles["quick-stat-value"]}
              style={{ color: "#f59e0b" }}
            >
              {dashboardData?.orders?.pending || 0}
            </h3>
          </div>
          <div className={styles["quick-stat"]}>
            <span className={styles["quick-stat-label"]}>Completed</span>
            <h3
              className={styles["quick-stat-value"]}
              style={{ color: "#10b981" }}
            >
              {dashboardData?.orders?.completed || 0}
            </h3>
          </div>
          <div className={styles["quick-stat"]}>
            <span className={styles["quick-stat-label"]}>Cancelled</span>
            <h3
              className={styles["quick-stat-value"]}
              style={{ color: "#ef4444" }}
            >
              {dashboardData?.orders?.cancelled || 0}
            </h3>
          </div>
          <div className={styles["quick-stat"]}>
            <span className={styles["quick-stat-label"]}>Today's Orders</span>
            <h3
              className={styles["quick-stat-value"]}
              style={{ color: "#8b5cf6" }}
            >
              {dashboardData?.today?.orders || 0}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
