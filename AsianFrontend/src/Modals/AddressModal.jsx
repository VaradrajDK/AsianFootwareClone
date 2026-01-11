// Modals/AddressModal.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import styles from "./AddressModal.module.css";

const AddressModal = ({ isOpen, onClose, onSave, address, loading }) => {
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    pincode: "",
    mobile: "",
    label: "home",
    isDefault: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  // Handle modal animation
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (address) {
      setFormData({
        address: address.address || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        mobile: address.mobile || "",
        label: address.label || "home",
        isDefault: address.isDefault || false,
      });
    } else {
      setFormData({
        address: "",
        city: "",
        state: "",
        pincode: "",
        mobile: "",
        label: "home",
        isDefault: false,
      });
    }
    setValidationErrors({});
  }, [address, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    if (!formData.state.trim()) {
      errors.state = "State is required";
    }

    if (!formData.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = "Pincode must be 6 digits";
    }

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = "Mobile must be 10 digits";
    }

    setValidationErrors(errors);

    // Show toast for validation errors
    if (Object.keys(errors).length > 0) {
      toast.warning("Please fill all required fields correctly");
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
  ];

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ""}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`${styles.modal} ${isVisible ? styles.modalVisible : ""}`}
      >
        {/* Modal Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {address ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          <form onSubmit={handleSubmit}>
            {/* Address Type */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Address Type</label>
              <div className={styles.labelToggle}>
                {["home", "work", "other"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`${styles.labelBtn} ${
                      formData.label === label ? styles.labelBtnActive : ""
                    }`}
                    onClick={() => handleInputChange("label", label)}
                  >
                    {label === "home"
                      ? "🏠 Home"
                      : label === "work"
                      ? "💼 Work"
                      : "📍 Other"}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Address */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Full Address <span className={styles.required}>*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={`${styles.textarea} ${
                  validationErrors.address ? styles.inputError : ""
                }`}
                placeholder="House No., Building, Street, Area"
                rows={3}
              />
              {validationErrors.address && (
                <span className={styles.errorText}>
                  {validationErrors.address}
                </span>
              )}
            </div>

            {/* City */}
            <div className={styles.formGroup}>
              <label className={styles.label}>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className={styles.input}
                placeholder="Enter city"
              />
            </div>

            {/* State */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                State <span className={styles.required}>*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className={`${styles.select} ${
                  validationErrors.state ? styles.inputError : ""
                }`}
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {validationErrors.state && (
                <span className={styles.errorText}>
                  {validationErrors.state}
                </span>
              )}
            </div>

            {/* Pincode */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Pincode <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) =>
                  handleInputChange(
                    "pincode",
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                className={`${styles.input} ${
                  validationErrors.pincode ? styles.inputError : ""
                }`}
                placeholder="6 digit pincode"
                maxLength={6}
              />
              {validationErrors.pincode && (
                <span className={styles.errorText}>
                  {validationErrors.pincode}
                </span>
              )}
            </div>

            {/* Mobile */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Mobile <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) =>
                  handleInputChange(
                    "mobile",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                className={`${styles.input} ${
                  validationErrors.mobile ? styles.inputError : ""
                }`}
                placeholder="10 digit mobile number"
                maxLength={10}
              />
              {validationErrors.mobile && (
                <span className={styles.errorText}>
                  {validationErrors.mobile}
                </span>
              )}
            </div>

            {/* Default Address Checkbox */}
            {!address?.isDefault && (
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      handleInputChange("isDefault", e.target.checked)
                    }
                    className={styles.checkbox}
                  />
                  Make this my default address
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleClose}
                disabled={loading}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                {loading
                  ? "SAVING..."
                  : address
                  ? "UPDATE ADDRESS"
                  : "SAVE ADDRESS"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
