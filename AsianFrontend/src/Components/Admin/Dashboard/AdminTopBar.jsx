// Components/Admin/Dashboard/AdminTopBar.jsx
import React, { useState, useRef, useEffect } from "react";
import styles from "../../../Styles/Admin/AdminTopBar.module.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axiosConfig.js";
import { logout } from "../../../Redux/userStore";

const AdminTopBar = () => {
  const user = useSelector((state) => state.user.userInfo);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      const response = await api.post("/auth/logout");
      if (response.data.success) {
        dispatch(logout());
        navigate("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      dispatch(logout());
      navigate("/");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles["admin-top-bar"]}>
      <div className={styles["logo-section"]}>
        {/* <div className={styles["admin-badge"]}>
          <i className="fas fa-shield-alt"></i>
          <span>ADMIN</span>
        </div> */}
        <img
          src="https://cdn.asianlive.in/digital-website/logo_9971506315137345656.png?tr=w-200"
          alt="Logo"
          className={styles["brand-logo"]}
        />
      </div>

      <div className={styles["search-bar"]}>
        <i className="fas fa-search"></i>
        <input type="text" placeholder="Search users, sellers, products..." />
      </div>

      <div className={styles["admin-actions"]}>
        {/* <button className={styles["notification-btn"]}>
          <i className="fas fa-bell"></i>
          <span className={styles["badge"]}>5</span>
        </button> */}

        <div
          className={styles["user-info"]}
          ref={dropdownRef}
          onClick={toggleDropdown}
        >
          <div className={styles["user-avatar"]}>
            <i className="fas fa-user-shield"></i>
          </div>
          <span className={styles["user-name"]}>{user?.name || "Admin"}</span>
          <i className={`fas fa-chevron-down ${styles["dropdown-icon"]}`}></i>

          {dropdownOpen && (
            <div className={styles["user-dropdown"]}>
              <button onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;
