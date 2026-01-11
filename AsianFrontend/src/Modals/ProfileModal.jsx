import React, { useState, useEffect } from "react";
import styles from "../Modals/ProfileModal.module.css";
import api from "../services/axiosConfig.js";

const ProfileModal = ({ user, onClose, isOpen }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    storeName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Initialize form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        storeName: user.storeName || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await api.put("/seller/profile/update", formData);

      if (response.data.success) {
        setMessage({
          text: "Profile updated successfully!",
          type: "success",
        });
        setIsEditing(false);
        // You might want to update the user in Redux store here
      } else {
        setMessage({
          text: response.data.message || "Update failed",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      setMessage({
        text: "Failed to update profile. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      storeName: user.storeName || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
    });
    setMessage({ text: "", type: "" });
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-container"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <h2>Seller Profile</h2>
          <button className={styles["close-btn"]} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles["modal-content"]}>
          {message.text && (
            <div className={`${styles["message"]} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className={styles["disabled-field"]}
                />
                <small className={styles["field-note"]}>
                  Email cannot be changed
                </small>
              </div>
            </div>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="storeName">Store Name</label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                rows="3"
                required
              />
            </div>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="pincode">Pincode</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className={styles["modal-actions"]}>
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    className={styles["save-btn"]}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={styles["cancel-btn"]}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles["edit-btn"]}
                  onClick={() => setIsEditing(true)}
                >
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
