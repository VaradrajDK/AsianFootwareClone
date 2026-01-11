import React, { useState, useEffect, useRef } from "react";
import styles from "../../Styles/TopBar.module.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from "react-redux";
import {
  faUser,
  faStore,
  faQuestionCircle,
  faBriefcase,
  faMapMarkerAlt,
  faChevronDown,
  faTimes,
  faSignOutAlt,
  faUserCircle,
  faShoppingBag,
  faMapPin,
  faCaretDown,
  faCaretUp,
} from "@fortawesome/free-solid-svg-icons";
import { logout } from "../../Redux/userStore.js";
import api from "../../services/axiosConfig.js";
import { toast } from "react-toastify";

function TopBar() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const userContainerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target) &&
        userContainerRef.current &&
        !userContainerRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }

      // Close mobile menu when clicking outside
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLoginClick = () => {
    if (user) {
      // Toggle user dropdown for desktop
      setIsUserDropdownOpen(!isUserDropdownOpen);
    } else {
      navigate("/login");
      setIsUserDropdownOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);

    try {
      const response = await api.post("/auth/logout"); // ← Changed GET to POST
      if (response.data.success) {
        dispatch(logout()); // ← Clears Redux state AND localStorage (token + userInfo)
        toast.success(response.data.message || "Logged out successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Still dispatch logout even if API call fails
      dispatch(logout()); // ← This also clears localStorage
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsUserDropdownOpen(false);
  };

  const handleMenuItemClick = (action) => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
    switch (action) {
      case "store":
        navigate("/store-locator");
        break;
      case "help":
        navigate("/help");
        break;
      case "corporate":
        navigate("/corporate-orders");
        break;
      case "track":
        navigate("/orders");
        break;
      default:
        break;
    }
  };

  const handleUserDropdownItemClick = (action) => {
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);

    switch (action) {
      case "profile":
        navigate("/profile", { state: { activeTab: "details" } });
        break;
      case "orders":
        navigate("/profile", { state: { activeTab: "orders" } });
        break;
      case "addresses":
        navigate("/profile", { state: { activeTab: "address" } });
        break;
      case "logout":
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className={styles.topBar}>
        {/* Desktop View */}
        <div className={styles.left}>
          <div
            className={styles.menuItem}
            onClick={() => handleMenuItemClick("store")}
          >
            <span>Find a Store</span>
          </div>
          <span className={styles.separator}>|</span>
          <div
            className={styles.menuItem}
            onClick={() => handleMenuItemClick("help")}
          >
            <span>Help</span>
          </div>
          <span className={styles.separator}>|</span>
          <div
            className={styles.menuItem}
            onClick={() => handleMenuItemClick("corporate")}
          >
            <span>Corporate Orders</span>
          </div>
          <span className={styles.separator}>|</span>
          <div
            className={styles.menuItem}
            onClick={() => handleMenuItemClick("track")}
          >
            <span>Track Order</span>
          </div>
        </div>

        {/* Desktop Login/User Info with Dropdown */}
        <div className={styles.userSection} ref={userContainerRef}>
          <div className={styles.userContainer} onClick={handleLoginClick}>
            <div className={styles.userInfo}>
              {user ? (
                <>
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    className={styles.userIcon}
                  />
                  <span className={styles.userName}>
                    Hi, {user.firstName || user.name || user.username || "User"}
                  </span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUser} className={styles.userIcon} />
                  <span className={styles.userName}>Hi, Guest</span>
                </>
              )}
            </div>
            <FontAwesomeIcon
              icon={isUserDropdownOpen ? faCaretUp : faCaretDown}
              className={`${styles.dropdownArrow} ${
                isUserDropdownOpen ? styles.dropdownArrowRotated : ""
              }`}
            />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          ref={mobileMenuButtonRef}
        >
          <span>{isMobileMenuOpen ? "Close" : "Menu"}</span>
          <FontAwesomeIcon
            icon={isMobileMenuOpen ? faTimes : faChevronDown}
            className={`${styles.chevronIcon} ${
              isMobileMenuOpen ? styles.chevronRotated : ""
            }`}
          />
        </div>
      </div>

      {/* User Dropdown for Desktop - Positioned absolutely on the page, not inside navbar */}
      {isUserDropdownOpen && user && (
        <div
          className={styles.userDropdown}
          ref={userDropdownRef}
          style={{
            position: "absolute",
            top: "40px",
            right: "180px",
            zIndex: 1001,
          }}
        >
          <div className={styles.dropdownHeader}>
            <FontAwesomeIcon
              icon={faUserCircle}
              className={styles.dropdownHeaderIcon}
            />
            <div className={styles.dropdownUserInfo}>
              <div className={styles.dropdownUserName}>
                {user.firstName} {user.lastName || ""}
              </div>
              <div className={styles.dropdownUserEmail}>
                {user.email || "No email provided"}
              </div>
            </div>
          </div>

          <div
            className={styles.dropdownItem}
            onClick={() => handleUserDropdownItemClick("profile")}
          >
            <FontAwesomeIcon
              icon={faUserCircle}
              className={styles.dropdownIcon}
            />
            <span>User Details</span>
          </div>

          <div
            className={styles.dropdownItem}
            onClick={() => handleUserDropdownItemClick("orders")}
          >
            <FontAwesomeIcon
              icon={faShoppingBag}
              className={styles.dropdownIcon}
            />
            <span>My Orders</span>
          </div>

          <div
            className={styles.dropdownItem}
            onClick={() => handleUserDropdownItemClick("addresses")}
          >
            <FontAwesomeIcon icon={faMapPin} className={styles.dropdownIcon} />
            <span>Addresses</span>
          </div>

          <div className={styles.dropdownDivider}></div>

          <div
            className={`${styles.dropdownItem} ${styles.logoutItem}`}
            onClick={() => handleUserDropdownItemClick("logout")}
          >
            <FontAwesomeIcon
              icon={faSignOutAlt}
              className={styles.dropdownIcon}
            />
            <span>Sign Out</span>
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu} ref={mobileMenuRef}>
          {/* Mobile Menu Header with Close Button */}
          <div className={styles.mobileMenuHeader}>
            <span className={styles.mobileMenuTitle}>Quick Links</span>
            <button
              className={styles.mobileCloseButton}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div
            className={styles.mobileMenuItem}
            onClick={() => handleMenuItemClick("store")}
          >
            <span>Find a Store</span>
          </div>

          <div
            className={styles.mobileMenuItem}
            onClick={() => handleMenuItemClick("help")}
          >
            <span>Help</span>
          </div>

          <div
            className={styles.mobileMenuItem}
            onClick={() => handleMenuItemClick("corporate")}
          >
            <span>Corporate Orders</span>
          </div>

          <div
            className={styles.mobileMenuItem}
            onClick={() => handleMenuItemClick("track")}
          >
            <span>Track Order</span>
          </div>

          {/* User Section in Mobile Menu */}
          {user ? (
            <>
              <div className={styles.mobileMenuDivider}></div>

              <div className={styles.mobileUserSection}>
                <FontAwesomeIcon
                  icon={faUserCircle}
                  className={styles.mobileUserIcon}
                />
                <div className={styles.mobileUserInfo}>
                  <div className={styles.mobileUserName}>
                    {user.firstName} {user.lastName || ""}
                  </div>
                  <div className={styles.mobileUserEmail}>
                    {user.email || "No email provided"}
                  </div>
                </div>
              </div>

              <div
                className={styles.mobileMenuItem}
                onClick={() => handleUserDropdownItemClick("profile")}
              >
                <span>User Details</span>
              </div>

              <div
                className={styles.mobileMenuItem}
                onClick={() => handleUserDropdownItemClick("orders")}
              >
                <span>My Orders</span>
              </div>

              <div
                className={styles.mobileMenuItem}
                onClick={() => handleUserDropdownItemClick("addresses")}
              >
                <span>Addresses</span>
              </div>

              <div
                className={`${styles.mobileMenuItem} ${styles.mobileLogoutItem}`}
                onClick={() => handleUserDropdownItemClick("logout")}
              >
                <span>Sign Out</span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.mobileMenuDivider}></div>
              <div
                className={styles.mobileMenuItem}
                onClick={() => {
                  navigate("/login");
                  setIsMobileMenuOpen(false);
                }}
              >
                <span>Login/Signup</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className={styles.mobileMenuOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

export default TopBar;
