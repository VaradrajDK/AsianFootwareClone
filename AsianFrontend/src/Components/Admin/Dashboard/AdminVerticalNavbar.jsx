// Components/Admin/Dashboard/AdminVerticalNavbar.jsx
import React, { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faUsers,
  faStore,
  faBox,
  faShoppingCart,
  faChartLine,
  faFolder,
  faImage,
  faCog,
  faChevronRight,
  faChevronDown,
  faUserShield,
  faUserPlus,
  faExclamationTriangle,
  faList,
  faChartBar,
  faPlus,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../../../Styles/Admin/AdminVerticalNavbar.module.css";

const SubMenu = ({ item, activeMenu, setActiveMenu, isOpen }) => {
  return (
    <div
      className={`${styles["submenu-container"]} ${
        isOpen ? styles["open"] : ""
      }`}
    >
      <ul className={styles["submenu-list"]}>
        {item.subItems.map((subItem) => (
          <li key={subItem.id} className={styles["submenu-item-wrapper"]}>
            <div
              className={`${styles["sub-nav-item"]} ${
                activeMenu === subItem.id ? styles["active"] : ""
              }`}
              onClick={() => setActiveMenu(subItem.id)}
            >
              <FontAwesomeIcon
                icon={subItem.icon}
                className={styles["subnav-icon"]}
              />
              <span className={styles["subnav-label"]}>{subItem.label}</span>
              {subItem.badge && (
                <span className={styles["badge"]}>{subItem.badge}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AdminVerticalNavbar = ({ activeMenu, setActiveMenu }) => {
  const [openSubmenus, setOpenSubmenus] = useState({
    users: false,
    sellers: false,
    products: false,
    orders: false,
    content: false,
    reports: false,
  });

  const toggleSubmenu = useCallback((menuId) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }, []);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: faTachometerAlt,
      hasSubmenu: false,
    },
    {
      id: "users",
      label: "Users",
      icon: faUsers,
      hasSubmenu: true,
      subItems: [
        { id: "add-user", label: "Add User", icon: faUserPlus },
        { id: "view-users", label: "All Users", icon: faList },
      ],
    },
    {
      id: "products",
      label: "Products",
      icon: faBox,
      hasSubmenu: true,
      subItems: [
        { id: "add-product", label: "Add Product", icon: faPlus },
        { id: "view-products", label: "All Products", icon: faBox },
      ],
    },
    {
      id: "orders",
      label: "Orders",
      icon: faShoppingCart,
      hasSubmenu: true,
      subItems: [
        { id: "view-orders", label: "All Orders", icon: faShoppingCart },
      ],
    },
    {
      id: "content",
      label: "Content",
      icon: faFolder,
      hasSubmenu: true,
      subItems: [
        { id: "categories", label: "Categories", icon: faFolder },
        { id: "add-category", label: "Add Category", icon: faPlus },
        { id: "banners", label: "Banners", icon: faImage },
        {
          id: "add-banner",
          label: "Add Banner",
          icon: faPlus,
        },
      ],
    },
    // {
    //   id: "reports",
    //   label: "Reports",
    //   icon: faChartLine,
    //   hasSubmenu: true,
    //   subItems: [
    //     { id: "sales-report", label: "Sales Report", icon: faChartLine },
    //     { id: "user-report", label: "User Report", icon: faUsers },
    //     { id: "product-report", label: "Product Report", icon: faBox },
    //     { id: "seller-report", label: "Seller Report", icon: faStore },
    //   ],
    // },
    // {
    //   id: "settings",
    //   label: "Settings",
    //   icon: faCog,
    //   hasSubmenu: false,
    // },
  ];

  return (
    <div className={styles["admin-vertical-navbar"]}>
      <div className={styles["navbar-header"]}>
        <h2 className={styles["navbar-title"]}>Admin Panel</h2>
        <div className={styles["navbar-subtitle"]}>Control Center</div>
      </div>

      <nav className={styles["nav-menu"]}>
        <ul className={styles["nav-list"]}>
          {menuItems.map((item) => (
            <li key={item.id} className={styles["nav-item-wrapper"]}>
              {item.hasSubmenu ? (
                <>
                  <div
                    className={`${styles["nav-item"]} ${
                      openSubmenus[item.id] ? styles["open"] : ""
                    }`}
                    onClick={() => toggleSubmenu(item.id)}
                  >
                    <div className={styles["nav-item-content"]}>
                      <FontAwesomeIcon
                        icon={item.icon}
                        className={styles["nav-icon"]}
                      />
                      <span className={styles["nav-label"]}>{item.label}</span>
                    </div>
                    <FontAwesomeIcon
                      icon={
                        openSubmenus[item.id] ? faChevronDown : faChevronRight
                      }
                      className={styles["nav-arrow"]}
                    />
                  </div>
                  <SubMenu
                    item={item}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    isOpen={openSubmenus[item.id]}
                  />
                </>
              ) : (
                <div
                  className={`${styles["nav-item"]} ${
                    activeMenu === item.id ? styles["active"] : ""
                  }`}
                  onClick={() => setActiveMenu(item.id)}
                >
                  <div className={styles["nav-item-content"]}>
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={styles["nav-icon"]}
                    />
                    <span className={styles["nav-label"]}>{item.label}</span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles["navbar-footer"]}>
        <div className={styles["admin-badge"]}>
          <FontAwesomeIcon icon={faUserShield} />
          <div className={styles["admin-info"]}>
            <span className={styles["admin-role"]}>Super Admin</span>
            <span className={styles["admin-status"]}>Full Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminVerticalNavbar;
