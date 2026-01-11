import React from "react";
import { useEffect } from "react";
import styles from "../../../Styles/Seller/MainContent.module.css";
import StatsCards from "./StatsCards";
import AddProduct from "../../../Pages/Seller/addProduct.jsx";
import SellerProducts from "../../../Pages/Seller/sellerProducts.jsx";
import SellerOrders from "../../../Pages/Seller/SellerOrders.jsx";
import AddCategory from "../../../Pages/Seller/Settings/AddCategory.jsx";
import AddSubCategory from "../../../Pages/Seller/Settings/AddSubCategory.jsx";
import AddBanner from "../../../Pages/Seller/Settings/AddBanner.jsx";
import ViewBanners from "../../../Pages/Seller/Settings/ViewBanners.jsx";

const MainContent = ({
  activeMenu,
  setActiveMenu,
  selectedProductId,
  setSelectedProductId,
  selectedBannerId,
  setSelectedBannerId,
  loading = false,
  categoryId,
}) => {
  useEffect(() => {
    console.log("=== MainContent Debug ===");
    console.log("Selected Banner ID:", selectedBannerId);
    console.log("Active Menu:", activeMenu);
    console.log("Type of setSelectedBannerId:", typeof setSelectedBannerId);
  }, [selectedBannerId, activeMenu]);

  const getPageTitle = () => {
    switch (activeMenu) {
      case "dashboard":
        return "Dashboard Overview";
      case "add-product":
        return selectedProductId ? "Edit Product" : "Add New Product";
      case "view-products":
        return "View Products";
      case "view-orders":
        return "View Orders";
      case "analytics":
        return "Analytics";
      case "add-category":
        return "Add Category";
      case "add-subcategory":
        return "Add Sub Category";
      case "add-banner":
        return selectedBannerId ? "Edit Banner" : "Add Banner";
      case "view-banners":
        return "View Banners";
      default:
        return "Dashboard Overview";
    }
  };

  // Inside MainContent.jsx

  const handleBannerEdit = (bannerId) => {
    console.log("MainContent: handleBannerEdit called with ID:", bannerId);

    if (!bannerId) {
      console.error("Error: handleBannerEdit received invalid ID:", bannerId);
      return;
    }

    // 1. Update the ID immediately
    if (typeof setSelectedBannerId === "function") {
      setSelectedBannerId(bannerId);
    } else {
      console.error("setSelectedBannerId prop is missing or not a function");
    }

    // 2. Switch the menu immediately
    // React will batch these updates so the new component receives the ID instantly
    setActiveMenu("add-banner");
  };

  useEffect(() => {
    console.log("Selected Banner ID changed:", selectedBannerId);
    console.log("Active Menu:", activeMenu);
    console.log(
      "setSelectedBannerId is function?",
      typeof setSelectedBannerId === "function"
    );
  }, [selectedBannerId, activeMenu]);

  const getBreadcrumb = () => {
    const breadcrumbs = ["Dashboard"];

    switch (activeMenu) {
      case "add-product":
        breadcrumbs.push(
          "Products",
          selectedProductId ? "Edit Product" : "Add Product"
        );
        break;
      case "view-products":
        breadcrumbs.push("Products", "View All");
        break;
      case "view-orders":
        breadcrumbs.push("Orders");
        break;
      case "analytics":
        breadcrumbs.push("Analytics");
        break;
      case "add-category":
        breadcrumbs.push("Settings", "Add Category");
        break;
      case "add-subcategory":
        breadcrumbs.push("Settings", "Add Sub Category");
        break;
      case "add-banner":
        breadcrumbs.push(
          "Banners",
          selectedBannerId ? "Edit Banner" : "Add Banner"
        );
        break;
      case "view-banners":
        breadcrumbs.push("Banners", "View All");
        break;
    }

    return breadcrumbs;
  };

  if (loading) {
    return (
      <div className={styles["main-content"]}>
        <div className={styles["loading-content"]}>
          <div className={styles["loading-spinner"]}></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className={styles["dashboard-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <h1>Dashboard Overview</h1>
            <StatsCards />
          </div>
        );
      case "add-product":
        return (
          <div className={styles["add-product-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <AddProduct
              productId={selectedProductId}
              setActiveMenu={setActiveMenu}
            />
          </div>
        );
      case "view-products":
        return (
          <div className={styles["view-products-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <SellerProducts
              setActiveMenu={setActiveMenu}
              setSelectedProductId={setSelectedProductId}
            />
          </div>
        );
      case "view-orders":
        return (
          <div className={styles["view-order-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <SellerOrders
              setActiveMenu={setActiveMenu}
              setSelectedProductId={setSelectedProductId}
            />
          </div>
        );
      case "analytics":
        return (
          <div className={styles["analytics-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <h1>Analytics</h1>
            <p>Analytics content will be displayed here.</p>
          </div>
        );
      case "add-category":
        return (
          <div className={styles["add-category-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <h1>Manage Categories</h1>
            <AddCategory
              onCategoryAdded={(category) => {
                console.log("Category added:", category);
              }}
              setActiveMenu={setActiveMenu}
            />
          </div>
        );
      case "add-subcategory":
        return (
          <div className={styles["add-subcategory-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <h1>Manage Sub Categories</h1>
            <AddSubCategory
              setActiveMenu={setActiveMenu}
              categoryId={categoryId}
            />
          </div>
        );
      case "add-banner":
        return (
          <div className={styles["add-banner-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <AddBanner
              // CHANGE THIS: Use specific key logic to ensure re-render only when ID exists
              key={selectedBannerId ? `edit-${selectedBannerId}` : "add-new"}
              bannerId={selectedBannerId}
              setActiveMenu={setActiveMenu}
            />
          </div>
        );
      case "view-banners":
        return (
          <div className={styles["view-banners-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <ViewBanners
              setActiveMenu={setActiveMenu}
              setSelectedBannerId={setSelectedBannerId} // Pass it here
              onEditBanner={handleBannerEdit}
            />
          </div>
        );

      default:
        return (
          <div className={styles["dashboard-content"]}>
            <div className={styles["content-path"]}>
              {getBreadcrumb().map((crumb, index) => (
                <React.Fragment key={index}>
                  <span>{crumb}</span>
                  {index < getBreadcrumb().length - 1 && (
                    <span className={styles["separator"]}>›</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <h1>Dashboard Overview</h1>
            <StatsCards />
          </div>
        );
    }
  };

  return <div className={styles["main-content"]}>{renderContent()}</div>;
};

export default MainContent;
