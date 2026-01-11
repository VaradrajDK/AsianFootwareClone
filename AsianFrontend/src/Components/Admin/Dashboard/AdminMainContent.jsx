// Components/Admin/Dashboard/AdminMainContent.jsx
import React from "react";
import styles from "../../../Styles/Admin/AdminMainContent.module.css";
import AdminStatsCards from "./AdminStatsCards";
import AdminOverview from "./AdminOverview";
import ViewUsers from "./ViewUsers";
// import ViewSellers from "./ViewSellers";
import ViewProducts from "./ViewProducts";
import AddProduct from "./AddProduct";
import ViewOrders from "./ViewOrders";
import ViewCategories from "./ViewCategories";
import AddCategories from "./AddCategories"; // ✅ Changed from AddCategory to AddCategories
import ViewBanners from "./ViewBanners";
import AddBanners from "./AddBanners";
import SalesReport from "../Dashboard/Reports/SalesReport";
import UserReport from "../Dashboard/Reports/UserReport";
import ProductReport from "../Dashboard/Reports/ProductReport";
import SellerReport from "../Dashboard/Reports/SellerReport";
import AddUser from "./AddUser";

const AdminMainContent = ({
  activeMenu,
  setActiveMenu,
  selectedUserId,
  setSelectedUserId,
  selectedSellerId,
  setSelectedSellerId,
  selectedProductId,
  setSelectedProductId,
  selectedOrderId,
  setSelectedOrderId,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedBannerId,
  setSelectedBannerId,
}) => {
  const getPageTitle = () => {
    const titles = {
      dashboard: "Dashboard Overview",
      "add-user": "Add New User",
      "edit-user": "Edit User",
      "view-users": "User Management",
      "view-sellers": "Seller Management",
      "pending-verification": "Pending Seller Verification",
      "seller-analytics": "Seller Analytics",
      "add-product": "Add New Product",
      "edit-product": "Edit Product",
      "view-products": "Product Management",
      "featured-products": "Featured Products",
      "view-orders": "Order Management",
      "pending-orders": "Pending Orders",
      "order-analytics": "Order Analytics",
      categories: "Category Management",
      "add-category": "Add New Category",
      "edit-category": "Edit Category", // ✅ Added this
      banners: "Banner Management",
      "add-banner": "Add New Banner",
      "edit-banner": "Edit Banner",
    };
    return titles[activeMenu] || "Dashboard";
  };

  const getBreadcrumb = () => {
    const breadcrumbs = ["Admin", "Dashboard"];

    const breadcrumbMap = {
      "add-user": ["Users", "Add User"],
      "edit-user": ["Users", "Edit User"],
      "view-users": ["Users", "All Users"],
      "user-analytics": ["Users", "Analytics"],
      "view-sellers": ["Sellers", "All Sellers"],
      "pending-verification": ["Sellers", "Pending Verification"],
      "seller-analytics": ["Sellers", "Analytics"],
      "add-product": ["Products", "Add Product"],
      "edit-product": ["Products", "Edit Product"],
      "view-products": ["Products", "All Products"],
      "featured-products": ["Products", "Featured"],
      "view-orders": ["Orders", "All Orders"],
      categories: ["Content", "Categories"],
      "add-category": ["Content", "Categories", "Add Category"], // ✅ Added
      "edit-category": ["Content", "Categories", "Edit Category"], // ✅ Added
      banners: ["Content", "Banners"],
      "add-banner": ["Content", "Banners", "Add Banner"],
      "edit-banner": ["Content", "Banners", "Edit Banner"],
    };

    if (breadcrumbMap[activeMenu]) {
      return [...breadcrumbs, ...breadcrumbMap[activeMenu]];
    }

    return breadcrumbs;
  };

  const renderContent = () => {
    switch (activeMenu) {
      // User Management
      case "add-user":
      case "edit-user":
        return (
          <div className={styles["content-wrapper"]}>
            <AddUser
              setActiveMenu={setActiveMenu}
              selectedUserId={
                activeMenu === "edit-user" ? selectedUserId : null
              }
            />
          </div>
        );

      case "view-users":
        return (
          <div className={styles["content-wrapper"]}>
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
            <ViewUsers
              setActiveMenu={setActiveMenu}
              setSelectedUserId={setSelectedUserId}
            />
          </div>
        );

      // Product Management - Add/Edit
      case "add-product":
      case "edit-product":
        return (
          <div className={styles["content-wrapper"]}>
            <AddProduct
              setActiveMenu={setActiveMenu}
              selectedProductId={
                activeMenu === "edit-product" ? selectedProductId : null
              }
            />
          </div>
        );

      // Product Management - View
      case "view-products":
      case "pending-approval":
      case "featured-products":
        return (
          <div className={styles["content-wrapper"]}>
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
            <ViewProducts
              setActiveMenu={setActiveMenu}
              setSelectedProductId={setSelectedProductId}
              filterType={
                activeMenu === "pending-approval"
                  ? "pending"
                  : activeMenu === "featured-products"
                  ? "featured"
                  : "all"
              }
            />
          </div>
        );

      // Dashboard
      case "dashboard":
        return (
          <div className={styles["content-wrapper"]}>
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
            <h1 className={styles["page-title"]}>{getPageTitle()}</h1>
            <AdminStatsCards />
            <AdminOverview />
          </div>
        );

      // Order Management
      case "view-orders":
      case "pending-orders":
        return (
          <div className={styles["content-wrapper"]}>
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
            <ViewOrders
              setActiveMenu={setActiveMenu}
              setSelectedOrderId={setSelectedOrderId}
              showOnlyPending={activeMenu === "pending-orders"}
            />
          </div>
        );

      // ✅ Category Management - View
      case "categories":
        return (
          <div className={styles["content-wrapper"]}>
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
            <ViewCategories
              setActiveMenu={setActiveMenu}
              setSelectedCategoryId={setSelectedCategoryId}
            />
          </div>
        );

      // ✅ Category Management - Add/Edit
      case "add-category":
      case "edit-category":
        return (
          <div className={styles["content-wrapper"]}>
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
            <AddCategories
              setActiveMenu={setActiveMenu}
              selectedCategoryId={
                activeMenu === "edit-category" ? selectedCategoryId : null
              }
            />
          </div>
        );

      // ✅ Banner Management - Add/Edit
      case "add-banner":
      case "edit-banner":
        return (
          <div className={styles["content-wrapper"]}>
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
            <AddBanners
              setActiveMenu={setActiveMenu}
              selectedBannerId={
                activeMenu === "edit-banner" ? selectedBannerId : null
              }
            />
          </div>
        );

      // ✅ Banner Management - View
      case "banners":
        return (
          <div className={styles["content-wrapper"]}>
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
              setSelectedBannerId={setSelectedBannerId}
            />
          </div>
        );

      // Reports
      case "sales-report":
        return (
          <div className={styles["content-wrapper"]}>
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
            <SalesReport />
          </div>
        );

      case "user-report":
        return (
          <div className={styles["content-wrapper"]}>
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
            <UserReport />
          </div>
        );

      case "product-report":
        return (
          <div className={styles["content-wrapper"]}>
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
            <ProductReport />
          </div>
        );

      case "seller-report":
        return (
          <div className={styles["content-wrapper"]}>
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
            <SellerReport />
          </div>
        );

      default:
        return (
          <div className={styles["content-wrapper"]}>
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
            <h1 className={styles["page-title"]}>{getPageTitle()}</h1>
            <p>Content for {activeMenu} will be displayed here.</p>
          </div>
        );
    }
  };

  return <div className={styles["admin-main-content"]}>{renderContent()}</div>;
};

export default AdminMainContent;
