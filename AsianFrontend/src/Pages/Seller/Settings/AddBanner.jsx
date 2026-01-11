import React, { useState, useEffect } from "react";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Settings/AddBanner.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faUpload,
  faTrash,
  faEye,
  faSpinner,
  faPlus,
  faCalendar,
  faLink,
} from "@fortawesome/free-solid-svg-icons";

const AddBanner = ({ bannerId, setActiveMenu }) => {
  console.log("AddBanner Component RENDERED with bannerId:", bannerId);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [previewImage, setPreviewImage] = useState(null);

  // Banner form data
  const [bannerData, setBannerData] = useState({
    title: "",
    description: "",
    redirectUrl: "",
    position: "home-top",
    isActive: true,
    endDate: "",
  });

  // File state
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    // If bannerId is undefined or null, we assume "Add New" mode
    if (!bannerId) {
      console.log(
        "AddBanner: No bannerId provided, resetting form for new entry."
      );
      resetForm();
      return;
    }

    fetchExistingBanner();
  }, [bannerId]);

  const fetchExistingBanner = async () => {
    console.log("AddBanner - fetchExistingBanner called with ID:", bannerId);
    setLoading(true);
    try {
      console.log(
        "AddBanner - Making API call to:",
        `/seller/get-banner/${bannerId}`
      );
      const response = await api.get(`/seller/get-banner/${bannerId}`);
      console.log("AddBanner - Full API response:", response);
      console.log("AddBanner - Response data:", response.data);

      if (response.data.success) {
        const banner = response.data.banner;
        console.log("AddBanner - Banner object received:", banner);

        // Check if banner exists
        if (!banner) {
          throw new Error("Banner not found");
        }

        // Update form data
        const newBannerData = {
          title: banner.title || "",
          description: banner.description || "",
          redirectUrl: banner.redirectUrl || "",
          position: banner.position || "home-top",
          isActive: banner.isActive !== undefined ? banner.isActive : true,
          endDate: banner.endDate
            ? new Date(banner.endDate).toISOString().split("T")[0]
            : "",
        };

        console.log("AddBanner - Setting bannerData to:", newBannerData);
        setBannerData(newBannerData);

        // Set preview image
        if (banner.imageUrl) {
          console.log("AddBanner - Setting preview image:", banner.imageUrl);
          setPreviewImage(banner.imageUrl);
        }

        setIsEditing(true);
        setMessage({
          type: "success",
          text: "Banner loaded successfully. You can now edit it.",
        });
        console.log("AddBanner - Form populated for editing, isEditing:", true);
      } else {
        console.error("AddBanner - API returned success: false", response.data);
        setMessage({
          type: "error",
          text: response.data.message || "Failed to load banner",
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("AddBanner - Error fetching banner:", error);
      console.error("AddBanner - Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });

      setMessage({
        type: "error",
        text: `Failed to load banner: ${
          error.response?.data?.message || error.message
        }`,
      });
      setIsEditing(false);
    } finally {
      setLoading(false);
      console.log(
        "AddBanner - fetchExistingBanner completed, loading set to false"
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(
      `AddBanner - Input change: ${name} = ${
        type === "checkbox" ? checked : value
      }`
    );
    setBannerData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("AddBanner - File selected:", file.name, file.type, file.size);

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP).",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "File size too large. Maximum size is 5MB.",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("AddBanner - FileReader loaded preview");
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    console.log("AddBanner - Removing image");
    setSelectedFile(null);
    if (!isEditing) {
      setPreviewImage(null);
    }
  };

  const resetForm = () => {
    console.log("AddBanner - Resetting form");
    setBannerData({
      title: "",
      description: "",
      redirectUrl: "",
      position: "home-top",
      isActive: true,
      endDate: "",
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Validate required fields
      if (!bannerData.title.trim()) {
        throw new Error("Banner title is required");
      }

      if (!isEditing && !selectedFile) {
        throw new Error("Please select an image to upload");
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", bannerData.title.trim());
      formData.append("description", bannerData.description);
      formData.append("redirectUrl", bannerData.redirectUrl);
      formData.append("position", bannerData.position);
      formData.append("isActive", bannerData.isActive);

      if (bannerData.endDate) {
        formData.append("endDate", bannerData.endDate);
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      console.log("AddBanner - Submitting form, isEditing:", isEditing);
      console.log("AddBanner - bannerId:", bannerId);
      console.log("AddBanner - Form data:", bannerData);

      let response;
      if (isEditing) {
        console.log("AddBanner - Making PUT request to update banner");
        response = await api.put(
          `/seller/update-banners/${bannerId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        console.log("AddBanner - Making POST request to add new banner");
        response = await api.post("/seller/add-banners", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      console.log("AddBanner - API response:", response.data);

      if (response.data.success) {
        setMessage({
          type: "success",
          text: `Banner ${isEditing ? "updated" : "added"} successfully! ${
            isEditing ? "Form cleared for adding new banner." : ""
          }`,
        });

        // Always reset the form after successful submit
        resetForm();
      } else {
        setMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("AddBanner - Error saving banner:", error);
      console.error("AddBanner - Error response:", error.response?.data);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to save banner",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add initial loading state
  if (loading) {
    return (
      <div className={styles["add-banner-container"]}>
        <div className={styles["loading-overlay"]}>
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading banner data...</p>
          <div className={styles["loading-details"]}>
            <p>Banner ID: {bannerId || "None"}</p>
            <p>Is Editing: {isEditing ? "Yes" : "No"}</p>
            <p>Form Title: {bannerData.title || "Empty"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["add-banner-container"]}>
      <div className={styles["add-banner-card"]}>
        <div className={styles["header-section"]}>
          <h2 className={styles["form-title"]}>
            <FontAwesomeIcon icon={faImage} />{" "}
            {isEditing ? "Edit Banner" : "Add New Banner"}
          </h2>
          <p className={styles["form-subtitle"]}>
            {isEditing
              ? "Update your banner image and details"
              : "Upload banner images for your store"}
          </p>
        </div>

        {message.text && (
          <div className={`${styles["message"]} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles["banner-form"]}>
          {/* Basic Information */}
          <div className={styles["form-section"]}>
            <h3 className={styles["section-title"]}>Basic Information</h3>

            <div className={styles["form-group"]}>
              <label htmlFor="title">Banner Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={bannerData.title}
                onChange={handleInputChange}
                placeholder="Enter banner title"
                required
                disabled={loading}
              />
              {isEditing && (
                <small className={styles["field-hint"]}>
                  Editing banner ID: {bannerId}
                </small>
              )}
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={bannerData.description}
                onChange={handleInputChange}
                placeholder="Enter banner description (optional)"
                rows="3"
                disabled={loading}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className={styles["form-section"]}>
            <h3 className={styles["section-title"]}>Banner Image</h3>

            <div className={styles["upload-section"]}>
              <div className={styles["upload-area"]}>
                <input
                  type="file"
                  id="bannerImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles["file-input"]}
                  disabled={loading || uploading}
                />
                <label htmlFor="bannerImage" className={styles["upload-label"]}>
                  <div className={styles["upload-content"]}>
                    <FontAwesomeIcon icon={faUpload} size="2x" />
                    <p>Click to upload or drag and drop</p>
                    <p className={styles["upload-hint"]}>
                      PNG, JPG, GIF, WebP up to 5MB
                    </p>
                    {isEditing && !selectedFile && previewImage && (
                      <p className={styles["edit-note"]}>
                        Upload new image to replace current one
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {previewImage && (
                <div className={styles["preview-section"]}>
                  <div className={styles["preview-header"]}>
                    <h4>Preview</h4>
                    <button
                      type="button"
                      onClick={removeImage}
                      className={styles["remove-btn"]}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTrash} /> Remove
                    </button>
                  </div>
                  <div className={styles["image-preview"]}>
                    <img src={previewImage} alt="Banner preview" />
                    {isEditing && !selectedFile && (
                      <div className={styles["existing-image-note"]}>
                        Current banner image
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className={styles["form-section"]}>
            <h3 className={styles["section-title"]}>Settings</h3>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label htmlFor="position">Position</label>
                <select
                  id="position"
                  name="position"
                  value={bannerData.position}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="home-top">Home Page - Top</option>
                  <option value="home-middle">Home Page - Middle</option>
                  <option value="category-top">Category Page - Top</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label htmlFor="redirectUrl">
                  <FontAwesomeIcon icon={faLink} /> Redirect URL
                </label>
                <input
                  type="url"
                  id="redirectUrl"
                  name="redirectUrl"
                  value={bannerData.redirectUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com (optional)"
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label htmlFor="endDate">
                  <FontAwesomeIcon icon={faCalendar} /> End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={bannerData.endDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={loading}
                />
                <small className={styles["field-note"]}>
                  Optional - Banner will expire after this date
                </small>
              </div>

              <div className={styles["form-group-checkbox"]}>
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={bannerData.isActive}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <span>Active Banner</span>
                </label>
                <small className={styles["field-note"]}>
                  {bannerData.isActive
                    ? "Banner is currently visible to customers"
                    : "Banner is hidden from customers"}
                </small>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles["form-actions"]}>
            <button
              type="button"
              onClick={resetForm}
              className={styles["reset-btn"]}
              disabled={loading}
            >
              {isEditing ? "Cancel Edit" : "Reset"}
            </button>
            <button
              type="submit"
              className={styles["submit-btn"]}
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Saving...
                </>
              ) : isEditing ? (
                "Update Banner"
              ) : (
                "Add Banner"
              )}
            </button>
          </div>
        </form>

        <div className={styles["instructions"]}>
          <h4>Banner Guidelines:</h4>
          <ul>
            <li>Recommended image size: 1920×500 pixels for top banners</li>
            <li>Sidebar banners: 300×250 pixels</li>
            <li>Use high-quality images for best display</li>
            <li>Keep text minimal and legible</li>
            <li>Use contrasting colors for better readability</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddBanner;
