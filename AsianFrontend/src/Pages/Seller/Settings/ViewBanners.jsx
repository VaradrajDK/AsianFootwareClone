import React, { useState, useEffect } from "react";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Settings/ViewBanners.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faEdit,
  faTrash,
  faEye,
  faEyeSlash,
  faSpinner,
  faSearch,
  faFilter,
  faSortAmountDown,
  faExclamationCircle,
  faPlus,
  faCalendar,
  faLink,
  faArrowsAltV,
} from "@fortawesome/free-solid-svg-icons";

const ViewBanners = ({ setActiveMenu, setSelectedBannerId, onEditBanner }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await api.get("/seller/get-banners");
      if (response.data.success) {
        setBanners(response.data.banners || []);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      setMessage({ type: "error", text: "Failed to load banners" });
    } finally {
      setLoading(false);
    }
  };

  // Delete banner
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this banner? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await api.delete(`/seller/delete-banners/${id}`);
      if (response.data.success) {
        setMessage({ type: "success", text: "Banner deleted successfully!" });
        setBanners(banners.filter((b) => b._id !== id));
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete banner",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle banner status
  const handleToggleStatus = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const response = await api.patch(`/seller/toggle-status/${id}`);
      if (response.data.success) {
        setMessage({
          type: "success",
          text: `Banner ${
            currentStatus ? "deactivated" : "activated"
          } successfully!`,
        });
        setBanners(
          banners.map((banner) =>
            banner._id === id ? { ...banner, isActive: !currentStatus } : banner
          )
        );
      }
    } catch (error) {
      console.error("Error toggling banner status:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update banner status",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (id) => {
    console.log("ViewBanners: Edit clicked for banner ID:", id);

    // Use the callback if provided
    if (onEditBanner) {
      console.log("ViewBanners: Using onEditBanner callback");
      onEditBanner(id);
    }
    // Fallback to setSelectedBannerId if no callback
    else if (setSelectedBannerId) {
      console.log("ViewBanners: Using setSelectedBannerId");
      // Clear any previous state first
      setSelectedBannerId(null);

      // Use setTimeout to ensure state update
      setTimeout(() => {
        setSelectedBannerId(id);
        setActiveMenu("add-banner");
      }, 10);
    } else {
      console.error("ViewBanners: No edit handler available!");
      setMessage({
        type: "error",
        text: "Edit functionality not available",
      });
    }
  };

  const handleAddNew = () => {
    console.log("ViewBanners: Adding new banner");
    if (setSelectedBannerId) {
      setSelectedBannerId(null);
    }
    setActiveMenu("add-banner");
  };

  // Get position display name
  const getPositionDisplay = (position) => {
    const positions = {
      "home-top": "Home Page - Top",
      "home-middle": "Home Page - Middle",
      "category-top": "Category Page - Top",
      sidebar: "Sidebar",
    };
    return positions[position] || position;
  };

  // Check if banner is expired
  const isBannerExpired = (banner) => {
    if (!banner.endDate) return false;
    return new Date(banner.endDate) < new Date();
  };

  // Filter and sort banners
  const filteredBanners = banners
    .filter((banner) => {
      const matchesSearch =
        banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition =
        filterPosition === "all" || banner.position === filterPosition;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" &&
          banner.isActive &&
          !isBannerExpired(banner)) ||
        (filterStatus === "inactive" && !banner.isActive) ||
        (filterStatus === "expired" && isBannerExpired(banner));
      return matchesSearch && matchesPosition && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "sort-order":
          return a.sortOrder - b.sortOrder;
        default:
          return 0;
      }
    });

  // Get unique positions
  const positions = ["all", ...new Set(banners.map((b) => b.position))];

  // Calculate stats
  const activeBanners = banners.filter(
    (b) => b.isActive && !isBannerExpired(b)
  ).length;
  const expiredBanners = banners.filter(isBannerExpired).length;
  const inactiveBanners = banners.filter((b) => !b.isActive).length;

  if (loading) {
    return (
      <div className={styles["loading-container"]}>
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading banners...</p>
      </div>
    );
  }

  return (
    <div className={styles["view-banners-container"]}>
      <div className={styles["banners-header"]}>
        <div className={styles["header-left"]}>
          <h1 className={styles["page-title"]}>Manage Banners</h1>
          <p className={styles["page-subtitle"]}>
            Upload and manage promotional banners for your store
          </p>
        </div>
        <div className={styles["header-right"]}>
          <button className={styles["add-banner-btn"]} onClick={handleAddNew}>
            <FontAwesomeIcon icon={faPlus} /> Add New Banner
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`${styles["message"]} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Stats Overview */}
      <div className={styles["stats-overview"]}>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]}>
            <FontAwesomeIcon icon={faImage} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>Total Banners</h3>
            <p>{banners.length}</p>
          </div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]} style={{ color: "#2ecc71" }}>
            <FontAwesomeIcon icon={faEye} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>Active</h3>
            <p>{activeBanners}</p>
          </div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]} style={{ color: "#e74c3c" }}>
            <FontAwesomeIcon icon={faEyeSlash} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>Inactive</h3>
            <p>{inactiveBanners}</p>
          </div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-icon"]} style={{ color: "#f39c12" }}>
            <FontAwesomeIcon icon={faCalendar} />
          </div>
          <div className={styles["stat-content"]}>
            <h3>Expired</h3>
            <p>{expiredBanners}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className={styles["controls-bar"]}>
        <div className={styles["search-box"]}>
          <FontAwesomeIcon icon={faSearch} className={styles["search-icon"]} />
          <input
            type="text"
            placeholder="Search banners by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles["search-input"]}
          />
        </div>

        <div className={styles["filter-controls"]}>
          <div className={styles["filter-group"]}>
            <FontAwesomeIcon
              icon={faFilter}
              className={styles["filter-icon"]}
            />
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className={styles["filter-select"]}
            >
              <option value="all">All Positions</option>
              {positions
                .filter((p) => p !== "all")
                .map((position) => (
                  <option key={position} value={position}>
                    {getPositionDisplay(position)}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles["filter-group"]}>
            <FontAwesomeIcon
              icon={faFilter}
              className={styles["filter-icon"]}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles["filter-select"]}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className={styles["filter-group"]}>
            <FontAwesomeIcon
              icon={faSortAmountDown}
              className={styles["filter-icon"]}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles["filter-select"]}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="sort-order">Sort Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Banners Grid */}
      {filteredBanners.length === 0 ? (
        <div className={styles["no-banners"]}>
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className={styles["no-banners-icon"]}
          />
          <h3>No banners found</h3>
          <p>
            {searchTerm || filterPosition !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "You haven't added any banners yet"}
          </p>
          <button
            className={styles["add-first-banner-btn"]}
            onClick={handleAddNew}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Your First Banner
          </button>
        </div>
      ) : (
        <>
          <div className={styles["banners-count"]}>
            Showing {filteredBanners.length} of {banners.length} banners
          </div>

          <div className={styles["banners-grid"]}>
            {filteredBanners.map((banner) => {
              const expired = isBannerExpired(banner);
              const inactive = !banner.isActive;

              return (
                <div className={styles["banner-card"]} key={banner._id}>
                  <div className={styles["banner-image-container"]}>
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className={styles["banner-image"]}
                      loading="lazy"
                    />
                    <div className={styles["banner-status-badges"]}>
                      {expired ? (
                        <div
                          className={`${styles["status-badge"]} ${styles["expired"]}`}
                        >
                          Expired
                        </div>
                      ) : inactive ? (
                        <div
                          className={`${styles["status-badge"]} ${styles["inactive"]}`}
                        >
                          Inactive
                        </div>
                      ) : (
                        <div
                          className={`${styles["status-badge"]} ${styles["active"]}`}
                        >
                          Active
                        </div>
                      )}

                      <div
                        className={`${styles["position-badge"]} ${
                          styles[banner.position]
                        }`}
                      >
                        {getPositionDisplay(banner.position)}
                      </div>
                    </div>
                  </div>

                  <div className={styles["banner-info"]}>
                    <h3 className={styles["banner-title"]}>{banner.title}</h3>

                    {banner.description && (
                      <p className={styles["banner-description"]}>
                        {banner.description.length > 100
                          ? `${banner.description.substring(0, 100)}...`
                          : banner.description}
                      </p>
                    )}

                    <div className={styles["banner-meta"]}>
                      {banner.redirectUrl && (
                        <div className={styles["meta-item"]}>
                          <FontAwesomeIcon icon={faLink} />
                          <a
                            href={banner.redirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles["redirect-link"]}
                          >
                            Redirect Link
                          </a>
                        </div>
                      )}

                      {banner.sortOrder !== undefined && (
                        <div className={styles["meta-item"]}>
                          <FontAwesomeIcon icon={faArrowsAltV} />
                          <span>Order: {banner.sortOrder}</span>
                        </div>
                      )}

                      <div className={styles["meta-item"]}>
                        <FontAwesomeIcon icon={faCalendar} />
                        <span>
                          Added:{" "}
                          {new Date(banner.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {banner.endDate && (
                        <div className={styles["meta-item"]}>
                          <FontAwesomeIcon icon={faCalendar} />
                          <span
                            className={expired ? styles["expired-date"] : ""}
                          >
                            Expires:{" "}
                            {new Date(banner.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles["banner-actions"]}>
                    <button
                      className={styles["edit-btn"]}
                      onClick={() => handleEdit(banner._id)}
                      title="Edit banner"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>

                    <button
                      className={styles["toggle-btn"]}
                      onClick={() =>
                        handleToggleStatus(banner._id, banner.isActive)
                      }
                      disabled={togglingId === banner._id || expired}
                      title={
                        banner.isActive
                          ? "Deactivate banner"
                          : "Activate banner"
                      }
                    >
                      {togglingId === banner._id ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : banner.isActive ? (
                        <>
                          <FontAwesomeIcon icon={faEyeSlash} /> Deactivate
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faEye} /> Activate
                        </>
                      )}
                    </button>

                    <button
                      className={styles["delete-btn"]}
                      onClick={() => handleDelete(banner._id)}
                      disabled={deletingId === banner._id}
                      title="Delete banner"
                    >
                      {deletingId === banner._id ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faTrash} /> Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className={styles["banner-guidelines"]}>
        <h4>Banner Best Practices:</h4>
        <ul>
          <li>Home Page Banners: Use 1920×500px for best quality</li>
          <li>Sidebar Banners: Use 300×250px</li>
          <li>Keep text minimal and legible</li>
          <li>Use high-contrast colors for better visibility</li>
          <li>Update banners regularly to keep content fresh</li>
          <li>Set expiration dates for time-sensitive promotions</li>
        </ul>
      </div>
    </div>
  );
};

export default ViewBanners;
