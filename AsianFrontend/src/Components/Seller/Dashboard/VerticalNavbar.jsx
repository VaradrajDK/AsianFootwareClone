import React, { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faBox,
  faChevronRight,
  faChevronDown,
  faPlus,
  faList,
  faShoppingCart,
  faChartBar,
  faCube,
  faCog,
  faFolder,
  faLayerGroup,
  faImages,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import styles from "../../../Styles/Seller/VerticalNavbar.module.css";

const SubMenu = ({ item, activeMenu, setActiveMenu, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className={styles["submenu-container"]}>
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const VerticalNavbar = ({ activeMenu, setActiveMenu }) => {
  const [openSubmenus, setOpenSubmenus] = useState({
    products: false,
    settings: false,
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
      id: "products",
      label: "Products",
      icon: faCube,
      hasSubmenu: true,
      subItems: [
        { id: "add-product", label: "Add Product", icon: faPlus },
        { id: "view-products", label: "View Products", icon: faList },
      ],
    },
    {
      id: "view-orders",
      label: "Orders",
      icon: faShoppingCart,
      hasSubmenu: false,
    },
    // {
    //   id: "analytics",
    //   label: "Analytics",
    //   icon: faChartBar,
    //   hasSubmenu: false,
    // },
    {
      id: "settings",
      label: "Settings",
      icon: faCog,
      hasSubmenu: true,
      subItems: [
        { id: "add-category", label: "Add Category", icon: faFolder },
        {
          id: "add-subcategory",
          label: "Add Sub Category",
          icon: faLayerGroup,
        },
        // { id: "add-banner", label: "Add Banner", icon: faImage },
        // { id: "view-banners", label: "View Banners", icon: faImages },
      ],
    },
  ];

  return (
    <div className={styles["vertical-navbar"]}>
      <div className={styles["navbar-header"]}>
        <h2 className={styles["navbar-title"]}>Seller Panel</h2>
        <div className={styles["navbar-subtitle"]}>Management Dashboard</div>
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
        <div className={styles["user-info"]}>
          <div className={styles["user-avatar"]}>
            <FontAwesomeIcon icon={faBox} />
          </div>
          <div className={styles["user-details"]}>
            <span className={styles["user-role"]}>Seller Account</span>
            <span className={styles["user-status"]}>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalNavbar;
