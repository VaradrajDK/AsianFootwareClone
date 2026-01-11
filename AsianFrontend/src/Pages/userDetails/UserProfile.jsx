// components/userDetails/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { logout } from "../../Redux/userStore";
import styles from "../../Styles/userDetails/UserProfile.module.css";
import AddressList from "./AddressList";
import MyOrders from "./MyOrders";
import api from "../../services/axiosConfig";

export default function UserProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // Get user from Redux store
  const user = useSelector((state) => state.user.userInfo);

  console.log("UserProfile - User from Redux:", user);
  console.log("UserProfile - User ID:", user?.userId || user?._id || user?.id);

  // Set initial tab from navigation state or default to "details"
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "details"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    alternateMobile: "",
  });

  const [addresses, setAddresses] = useState([]);

  // Update active tab when location state changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state after setting the tab
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Helper function to get userId
  const getUserId = () => {
    return user?.userId || user?._id || user?.id || null;
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = getUserId();

      console.log("Fetching data for userId:", userId);

      if (!userId) {
        toast.error("Please login to view your profile");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/user/profile/${userId}`);

        if (response.data.success) {
          const userData = response.data.user;
          setUserData({
            name: userData.name || "",
            email: userData.email || "",
            mobile: userData.mobile || "",
            dob: userData.dob || "",
            gender: userData.gender || "",
            alternateMobile: userData.alternateMobile || "",
          });
          setAddresses(userData.addresses || []);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast.error(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleGenderChange = (gender) => {
    setUserData((prev) => ({ ...prev, gender }));
  };

  const handleInputChange = (field, value) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    const userId = getUserId();

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setSaving(true);

    try {
      const response = await api.put(`/user/profile/${userId}`, {
        name: userData.name,
        dob: userData.dob,
        gender: userData.gender,
        alternateMobile: userData.alternateMobile,
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        const updatedUser = response.data.user;
        setUserData({
          name: updatedUser.name || "",
          email: updatedUser.email || "",
          mobile: updatedUser.mobile || "",
          dob: updatedUser.dob || "",
          gender: updatedUser.gender || "",
          alternateMobile: updatedUser.alternateMobile || "",
        });
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ✅ UPDATED LOGOUT FUNCTION
  const handleLogout = async () => {
    try {
      const response = await api.post("/auth/logout"); // ← Changed GET to POST
      if (response.data.success) {
        dispatch(logout());
        toast.success(response.data.message || "Logged out successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Still dispatch logout even if API call fails
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const handleAddressesUpdate = (newAddresses) => {
    setAddresses(newAddresses);
  };

  // Get userId for rendering checks
  const userId = getUserId();

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Please login to view your profile</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>My Profile</h1>

      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <div className={styles.avatarBox}>
            <div className={styles.avatar}>
              {userData.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className={styles.avatarText}>{userData.name || "User"}</div>
          </div>
          <ul className={styles.menu}>
            <li
              className={`${styles.menuItem} ${
                activeTab === "details" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              User Details
            </li>
            <li
              className={`${styles.menuItem} ${
                activeTab === "orders" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("orders")}
            >
              My Orders
            </li>
            <li
              className={`${styles.menuItem} ${
                activeTab === "address" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("address")}
            >
              My Address
            </li>
            <li className={styles.menuItem} onClick={handleLogout}>
              Sign out
            </li>
          </ul>
        </aside>

        <section className={styles.content}>
          {activeTab === "details" && (
            <div className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>User Details</h2>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name</label>
                <div className={styles.inputContainer}>
                  <input
                    value={userData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={styles.formInput}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Id</label>
                <div className={styles.inputContainer}>
                  <input
                    value={userData.email}
                    readOnly
                    className={`${styles.formInput} ${styles.readOnlyInput}`}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mobile</label>
                <div className={styles.inputContainer}>
                  <input
                    value={userData.mobile}
                    readOnly
                    className={`${styles.formInput} ${styles.readOnlyInput}`}
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    DOB <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputContainer}>
                    <input
                      type="date"
                      value={userData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Gender <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.genderToggle}>
                    <button
                      type="button"
                      className={`${styles.genderBtn} ${
                        userData.gender === "male" ? styles.genderBtnActive : ""
                      }`}
                      onClick={() => handleGenderChange("male")}
                    >
                      MALE
                    </button>
                    <button
                      type="button"
                      className={`${styles.genderBtn} ${
                        userData.gender === "female"
                          ? styles.genderBtnActive
                          : ""
                      }`}
                      onClick={() => handleGenderChange("female")}
                    >
                      FEMALE
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Alternate Mobile</label>
                <div className={styles.inputContainer}>
                  <input
                    value={userData.alternateMobile}
                    onChange={(e) =>
                      handleInputChange(
                        "alternateMobile",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    className={styles.formInput}
                    placeholder="Alternate Number"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                className={styles.saveBtn}
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          )}

          {activeTab === "orders" && <MyOrders />}

          {activeTab === "address" && (
            <AddressList
              userId={userId}
              addresses={addresses}
              onAddressesUpdate={handleAddressesUpdate}
            />
          )}
        </section>
      </div>
    </div>
  );
}
