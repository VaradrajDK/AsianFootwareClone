// Components/Admin/Dashboard/AddUser.jsx
import React, { useState, useEffect } from "react";
import styles from "../../../Styles/Admin/AddUser.module.css";
import api from "../../../services/axiosConfig";
import { toast } from "react-toastify";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiArrowLeft,
  FiSave,
  FiAlertCircle,
  FiShoppingBag,
  FiCheckCircle,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiHome,
  FiCalendar,
} from "react-icons/fi";

const AddUser = ({ setActiveMenu, selectedUserId }) => {
  // Handle both object { id, role } and string format
  const userId =
    typeof selectedUserId === "object" ? selectedUserId?.id : selectedUserId;
  const isEditMode = !!userId;

  // Form state based on actual schemas
  const [formData, setFormData] = useState({
    // Common fields
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "user",
    isActive: true,

    // Seller specific
    brandName: "",
    isVerified: false,

    // User specific
    dob: "",
    gender: "",
    alternateMobile: "",
    addresses: [],
  });

  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Empty address template matching User schema
  const emptyAddress = {
    address: "",
    city: "",
    state: "",
    pincode: "",
    mobile: "",
    isDefault: false,
    label: "home",
  };

  // Fetch user data when in edit mode
  useEffect(() => {
    if (isEditMode && userId) {
      fetchUserData();
    }
  }, [userId, isEditMode]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/all-users/${userId}`);

      if (response.data.success) {
        const user = response.data.user;
        setUserData(user);
        setUserRole(user.role);

        // Set form data based on user role and actual schema
        setFormData({
          // Common fields
          name: user.name || "",
          email: user.email || "",
          mobile: user.mobile?.toString() || "",
          password: "",
          confirmPassword: "",
          role: user.role || "user",
          isActive: user.isActive !== undefined ? user.isActive : true,

          // Seller specific
          brandName: user.brandName || "",
          isVerified: user.isVerified || false,

          // User specific
          dob: user.dob || "",
          gender: user.gender || "",
          alternateMobile: user.alternateMobile || "",
          addresses: user.addresses || [],
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error(error.response?.data?.message || "Failed to load user data");
      setActiveMenu("view-users");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Mobile validation
    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      errors.mobile = "Mobile number must be exactly 10 digits";
    }

    // Brand name validation for sellers (only in add mode)
    if (formData.role === "seller" && !isEditMode) {
      if (!formData.brandName.trim()) {
        errors.brandName = "Brand name is required for sellers";
      }
    }

    // Password validation (only for add mode)
    if (!isEditMode) {
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    // Address validation for users
    if (
      (formData.role === "user" || userRole === "user") &&
      formData.addresses.length > 0
    ) {
      formData.addresses.forEach((addr, index) => {
        if (addr.address && !addr.state) {
          errors[`address_${index}_state`] = "State is required";
        }
        if (addr.address && !addr.pincode) {
          errors[`address_${index}_pincode`] = "Pincode is required";
        }
        if (addr.pincode && !/^\d{6}$/.test(addr.pincode)) {
          errors[`address_${index}_pincode`] = "Pincode must be 6 digits";
        }
        if (addr.address && !addr.mobile) {
          errors[`address_${index}_mobile`] = "Mobile is required";
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  // Address handlers
  const handleAddAddress = () => {
    setFormData({
      ...formData,
      addresses: [...formData.addresses, { ...emptyAddress }],
    });
  };

  const handleRemoveAddress = (index) => {
    const newAddresses = formData.addresses.filter((_, i) => i !== index);
    setFormData({ ...formData, addresses: newAddresses });
  };

  const handleAddressChange = (index, field, value) => {
    const newAddresses = [...formData.addresses];
    newAddresses[index] = { ...newAddresses[index], [field]: value };

    // If setting as default, unset others
    if (field === "isDefault" && value === true) {
      newAddresses.forEach((addr, i) => {
        if (i !== index) addr.isDefault = false;
      });
    }

    setFormData({ ...formData, addresses: newAddresses });

    // Clear address errors
    const errorKey = `address_${index}_${field}`;
    if (formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Build update data based on role
        let updateData = {
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
        };

        // Role-specific fields
        if (userRole === "seller") {
          updateData.brandName = formData.brandName.trim();
          updateData.isVerified = formData.isVerified;
          updateData.isActive = formData.isActive;
        } else if (userRole === "user") {
          updateData.dob = formData.dob;
          updateData.gender = formData.gender;
          updateData.alternateMobile = formData.alternateMobile;
          // Filter out empty addresses
          const validAddresses = formData.addresses.filter(
            (addr) => addr.address && addr.state && addr.pincode && addr.mobile
          );
          updateData.addresses = validAddresses;
        } else if (userRole === "admin") {
          updateData.isActive = formData.isActive;
        }

        const response = await api.put(
          `/admin/all-users/${userId}`,
          updateData
        );

        if (response.data.success) {
          toast.success("✅ User updated successfully!");
          setTimeout(() => {
            setActiveMenu("view-users");
          }, 1000);
        }
      } else {
        // Create new user
        const createData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          mobile: formData.mobile.trim(),
          password: formData.password,
          role: formData.role,
        };

        if (formData.role === "seller") {
          createData.brandName = formData.brandName.trim();
        }

        const response = await api.post("/admin/all-users", createData);

        if (response.data.success) {
          toast.success("✅ User created successfully!");
          // Reset form
          setFormData({
            name: "",
            email: "",
            mobile: "",
            password: "",
            confirmPassword: "",
            role: "user",
            isActive: true,
            brandName: "",
            isVerified: false,
            dob: "",
            gender: "",
            alternateMobile: "",
            addresses: [],
          });
          setFormErrors({});

          setTimeout(() => {
            setActiveMenu("view-users");
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message || "An error occurred. Please try again.";
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setActiveMenu("view-users");
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#ef4444";
      case "seller":
        return "#f59e0b";
      default:
        return "#3b82f6";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <FiShield size={18} />;
      case "seller":
        return <FiShoppingBag size={18} />;
      default:
        return <FiUser size={18} />;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  // Determine current role for field display
  const currentRole = isEditMode ? userRole : formData.role;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleCancel}>
          <FiArrowLeft size={20} />
          <span>Back to Users</span>
        </button>
        <div className={styles.headerContent}>
          <div
            className={styles.headerIcon}
            style={{
              backgroundColor: `${getRoleColor(currentRole)}15`,
              color: getRoleColor(currentRole),
            }}
          >
            {getRoleIcon(currentRole)}
          </div>
          <div>
            <h1 className={styles.title}>
              {isEditMode
                ? `Edit ${userRole?.charAt(0).toUpperCase()}${userRole?.slice(
                    1
                  )}`
                : "Add New User"}
            </h1>
            <p className={styles.subtitle}>
              {isEditMode
                ? `Update ${userRole} information`
                : "Create a new user account"}
            </p>
          </div>
          {/* Role Badge in Edit Mode */}
          {isEditMode && userRole && (
            <span
              className={styles.roleBadge}
              style={{
                backgroundColor: `${getRoleColor(userRole)}15`,
                color: getRoleColor(userRole),
              }}
            >
              {getRoleIcon(userRole)}
              <span>{userRole}</span>
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.formCard}>
          {/* ==================== BASIC INFORMATION ==================== */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FiUser size={18} />
              Basic Information
            </h3>
            <div className={styles.formGrid}>
              {/* Name */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FiUser size={16} />
                  <span>
                    Full Name <span className={styles.required}>*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`${styles.formInput} ${
                    formErrors.name ? styles.inputError : ""
                  }`}
                  placeholder="Enter full name"
                />
                {formErrors.name && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FiMail size={16} />
                  <span>
                    Email Address <span className={styles.required}>*</span>
                  </span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`${styles.formInput} ${
                    formErrors.email ? styles.inputError : ""
                  } ${isEditMode ? styles.disabled : ""}`}
                  placeholder="Enter email address"
                  disabled={isEditMode}
                />
                {formErrors.email && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.email}
                  </span>
                )}
                {isEditMode && (
                  <span className={styles.helperText}>
                    Email cannot be changed
                  </span>
                )}
              </div>

              {/* Mobile */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FiPhone size={16} />
                  <span>
                    Mobile Number <span className={styles.required}>*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  className={`${styles.formInput} ${
                    formErrors.mobile ? styles.inputError : ""
                  }`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                />
                {formErrors.mobile && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.mobile}
                  </span>
                )}
              </div>

              {/* Role Selection - Only in Add Mode */}
              {!isEditMode && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <FiShield size={16} />
                    <span>
                      User Role <span className={styles.required}>*</span>
                    </span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="user">User</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ==================== SELLER SPECIFIC FIELDS ==================== */}
          {currentRole === "seller" && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <FiShoppingBag size={18} />
                  Seller Information
                </h3>
                <div className={styles.formGrid}>
                  {/* Brand Name */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiShoppingBag size={16} />
                      <span>
                        Brand Name{" "}
                        {!isEditMode && (
                          <span className={styles.required}>*</span>
                        )}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) =>
                        handleInputChange("brandName", e.target.value)
                      }
                      className={`${styles.formInput} ${
                        formErrors.brandName ? styles.inputError : ""
                      }`}
                      placeholder="Enter brand/store name"
                    />
                    {formErrors.brandName && (
                      <span className={styles.errorText}>
                        <FiAlertCircle size={14} />
                        {formErrors.brandName}
                      </span>
                    )}
                  </div>

                  {/* Verification Status - Only in Edit Mode */}
                  {isEditMode && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <FiCheckCircle size={16} />
                        <span>Verification Status</span>
                      </label>
                      <div className={styles.toggleWrapper}>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={formData.isVerified}
                            onChange={(e) =>
                              handleInputChange("isVerified", e.target.checked)
                            }
                            className={styles.toggleInput}
                          />
                          <span className={styles.toggleSwitch}></span>
                          <span className={styles.toggleText}>
                            {formData.isVerified
                              ? "✓ Verified Seller"
                              : "Not Verified"}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ==================== USER SPECIFIC FIELDS ==================== */}
          {currentRole === "user" && isEditMode && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <FiUser size={18} />
                  Additional Information
                </h3>
                <div className={styles.formGrid}>
                  {/* Date of Birth */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiCalendar size={16} />
                      <span>Date of Birth</span>
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  {/* Gender */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiUser size={16} />
                      <span>Gender</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className={styles.formSelect}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Alternate Mobile */}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiPhone size={16} />
                      <span>Alternate Mobile</span>
                    </label>
                    <input
                      type="text"
                      value={formData.alternateMobile}
                      onChange={(e) =>
                        handleInputChange("alternateMobile", e.target.value)
                      }
                      className={styles.formInput}
                      placeholder="Alternate contact number"
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>

              {/* User Addresses */}
              <div className={styles.divider}></div>
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    <FiMapPin size={18} />
                    Addresses
                  </h3>
                  <button
                    type="button"
                    className={styles.addAddressBtn}
                    onClick={handleAddAddress}
                  >
                    <FiPlus size={16} />
                    Add Address
                  </button>
                </div>

                {formData.addresses.length === 0 ? (
                  <div className={styles.emptyAddresses}>
                    <FiMapPin size={32} />
                    <p>No addresses added yet</p>
                    <button
                      type="button"
                      className={styles.addFirstAddressBtn}
                      onClick={handleAddAddress}
                    >
                      <FiPlus size={16} />
                      Add First Address
                    </button>
                  </div>
                ) : (
                  <div className={styles.addressList}>
                    {formData.addresses.map((address, index) => (
                      <div key={index} className={styles.addressCard}>
                        <div className={styles.addressHeader}>
                          <div className={styles.addressType}>
                            <FiHome size={16} />
                            <select
                              value={address.label || "home"}
                              onChange={(e) =>
                                handleAddressChange(
                                  index,
                                  "label",
                                  e.target.value
                                )
                              }
                              className={styles.addressTypeSelect}
                            >
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </select>
                            {address.isDefault && (
                              <span className={styles.defaultBadge}>
                                Default
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.removeAddressBtn}
                            onClick={() => handleRemoveAddress(index)}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>

                        <div className={styles.addressGrid}>
                          {/* Full Address */}
                          <div
                            className={`${styles.formGroup} ${styles.fullWidth}`}
                          >
                            <label className={styles.formLabel}>
                              Address *
                            </label>
                            <textarea
                              value={address.address || ""}
                              onChange={(e) =>
                                handleAddressChange(
                                  index,
                                  "address",
                                  e.target.value
                                )
                              }
                              className={styles.formTextarea}
                              placeholder="Enter complete address (House No., Street, Area, Landmark)"
                              rows={2}
                            />
                          </div>

                          {/* City */}
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>City</label>
                            <input
                              type="text"
                              value={address.city || ""}
                              onChange={(e) =>
                                handleAddressChange(
                                  index,
                                  "city",
                                  e.target.value
                                )
                              }
                              className={styles.formInput}
                              placeholder="City"
                            />
                          </div>

                          {/* State */}
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>State *</label>
                            <input
                              type="text"
                              value={address.state || ""}
                              onChange={(e) =>
                                handleAddressChange(
                                  index,
                                  "state",
                                  e.target.value
                                )
                              }
                              className={`${styles.formInput} ${
                                formErrors[`address_${index}_state`]
                                  ? styles.inputError
                                  : ""
                              }`}
                              placeholder="State"
                            />
                            {formErrors[`address_${index}_state`] && (
                              <span className={styles.errorText}>
                                <FiAlertCircle size={14} />
                                {formErrors[`address_${index}_state`]}
                              </span>
                            )}
                          </div>

                          {/* Pincode */}
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Pincode *
                            </label>
                            <input
                              type="text"
                              value={address.pincode || ""}
                              onChange={(e) =>
                                handleAddressChange(
                                  index,
                                  "pincode",
                                  e.target.value
                                )
                              }
                              className={`${styles.formInput} ${
                                formErrors[`address_${index}_pincode`]
                                  ? styles.inputError
                                  : ""
                              }`}
                              placeholder="6-digit pincode"
                              maxLength="6"
                            />
                            {formErrors[`address_${index}_pincode`] && (
                              <span className={styles.errorText}>
                                <FiAlertCircle size={14} />
                                {formErrors[`address_${index}_pincode`]}
                              </span>
                            )}
                          </div>

                          {/* Address Mobile */}
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                              Contact Mobile *
                            </label>
                            <input
                              type="text"
                              value={address.mobile || ""}
                              onChange={(e) =>
                                handleAddressChange(
                                  index,
                                  "mobile",
                                  e.target.value
                                )
                              }
                              className={`${styles.formInput} ${
                                formErrors[`address_${index}_mobile`]
                                  ? styles.inputError
                                  : ""
                              }`}
                              placeholder="Contact number"
                              maxLength="10"
                            />
                            {formErrors[`address_${index}_mobile`] && (
                              <span className={styles.errorText}>
                                <FiAlertCircle size={14} />
                                {formErrors[`address_${index}_mobile`]}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.addressFooter}>
                          <label className={styles.defaultCheckbox}>
                            <input
                              type="checkbox"
                              checked={address.isDefault || false}
                              onChange={(e) =>
                                handleAddressChange(
                                  index,
                                  "isDefault",
                                  e.target.checked
                                )
                              }
                            />
                            <span>Set as default address</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ==================== ACCOUNT STATUS (Edit Mode Only) ==================== */}
          {isEditMode && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <FiShield size={18} />
                  Account Status
                </h3>
                <div className={styles.statusToggle}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        handleInputChange("isActive", e.target.checked)
                      }
                      className={styles.toggleInput}
                    />
                    <span
                      className={`${styles.toggleSwitch} ${
                        formData.isActive ? styles.active : styles.inactive
                      }`}
                    ></span>
                    <div className={styles.toggleInfo}>
                      <strong>
                        {formData.isActive
                          ? "Account Active"
                          : "Account Inactive"}
                      </strong>
                      <small>
                        {formData.isActive
                          ? "User can login and access the platform"
                          : "User cannot login to the platform"}
                      </small>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ==================== PASSWORD SECTION (Add Mode Only) ==================== */}
          {!isEditMode && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <FiShield size={18} />
                  Security
                </h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiShield size={16} />
                      <span>
                        Password <span className={styles.required}>*</span>
                      </span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={`${styles.formInput} ${
                        formErrors.password ? styles.inputError : ""
                      }`}
                      placeholder="Min. 6 characters"
                    />
                    {formErrors.password && (
                      <span className={styles.errorText}>
                        <FiAlertCircle size={14} />
                        {formErrors.password}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <FiShield size={16} />
                      <span>
                        Confirm Password{" "}
                        <span className={styles.required}>*</span>
                      </span>
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className={`${styles.formInput} ${
                        formErrors.confirmPassword ? styles.inputError : ""
                      }`}
                      placeholder="Confirm password"
                    />
                    {formErrors.confirmPassword && (
                      <span className={styles.errorText}>
                        <FiAlertCircle size={14} />
                        {formErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Password Info - Edit Mode */}
          {isEditMode && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.infoBox}>
                <FiAlertCircle size={18} />
                <div>
                  <strong>Password Update</strong>
                  <p>
                    Password cannot be changed from here. User must reset their
                    password through the forgot password feature.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className={styles.btnSpinner}></div>
                <span>{isEditMode ? "Updating..." : "Creating..."}</span>
              </>
            ) : (
              <>
                <FiSave size={18} />
                <span>
                  {isEditMode
                    ? `Update ${currentRole
                        ?.charAt(0)
                        .toUpperCase()}${currentRole?.slice(1)}`
                    : `Create ${formData.role
                        ?.charAt(0)
                        .toUpperCase()}${formData.role?.slice(1)}`}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
