// Components/Admin/Dashboard/AddCategories.jsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Loader,
  Plus,
  Trash2,
  Folder,
  Tag,
  X,
  ChevronRight,
} from "lucide-react";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Admin/AddCategories.module.css";

const AddCategories = ({ setActiveMenu, selectedCategoryId }) => {
  const isEditMode = Boolean(selectedCategoryId);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Subcategories state
  const [subCategories, setSubCategories] = useState([
    { name: "", description: "" },
  ]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // Fetch category data for edit mode
  useEffect(() => {
    if (isEditMode && selectedCategoryId) {
      fetchCategoryData();
    }
  }, [selectedCategoryId, isEditMode]);

  const fetchCategoryData = async () => {
    try {
      setFetchLoading(true);
      console.log("Fetching category with ID:", selectedCategoryId);

      const response = await api.get(`/admin/categories/${selectedCategoryId}`);
      console.log("Category data received:", response.data);

      if (response.data.success && response.data.category) {
        const category = response.data.category;

        setFormData({
          name: category.name || "",
          description: category.description || "",
        });

        // Set subcategories or default empty one
        if (category.subCategories && category.subCategories.length > 0) {
          setSubCategories(category.subCategories);
        } else {
          setSubCategories([{ name: "", description: "" }]);
        }
      }
    } catch (err) {
      console.error("Error fetching category:", err);
      setSubmitError("Failed to load category data");
    } finally {
      setFetchLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Show preview when category name is entered
    if (name === "name" && value.trim()) {
      setShowPreview(true);
    } else if (name === "name" && !value.trim()) {
      setShowPreview(false);
    }
  };

  // Handle subcategory change
  const handleSubCategoryChange = (index, field, value) => {
    const updatedSubCategories = [...subCategories];
    updatedSubCategories[index][field] = value;
    setSubCategories(updatedSubCategories);

    // Clear errors
    if (errors[`subcategory_${index}_${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`subcategory_${index}_${field}`];
        return newErrors;
      });
    }
  };

  // Add new subcategory
  const addSubCategory = () => {
    setSubCategories([...subCategories, { name: "", description: "" }]);
  };

  // Remove subcategory
  const removeSubCategory = (index) => {
    if (subCategories.length > 1) {
      const updatedSubCategories = subCategories.filter((_, i) => i !== index);
      setSubCategories(updatedSubCategories);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Validate category name
    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Category name should be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description should be less than 500 characters";
    }

    // Validate subcategories
    subCategories.forEach((sub, index) => {
      if (sub.name.trim()) {
        if (sub.name.length > 100) {
          newErrors[`subcategory_${index}_name`] =
            "Subcategory name should be less than 100 characters";
        }
      }
      if (sub.description && sub.description.length > 300) {
        newErrors[`subcategory_${index}_description`] =
          "Subcategory description should be less than 300 characters";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    setLoading(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      // Filter out empty subcategories
      const validSubCategories = subCategories.filter(
        (sub) => sub.name.trim() !== ""
      );

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        subCategories: validSubCategories.map((sub) => ({
          name: sub.name.trim(),
          description: sub.description.trim(),
        })),
      };

      console.log("Submitting data:", submitData);

      let response;
      if (isEditMode) {
        console.log("Updating category with ID:", selectedCategoryId);
        response = await api.put(
          `/admin/categories/${selectedCategoryId}`,
          submitData
        );
      } else {
        console.log("Creating new category");
        response = await api.post("/admin/categories", submitData);
      }

      console.log("API response:", response.data);

      if (response.data.success) {
        setSuccessMessage(
          isEditMode
            ? "Category updated successfully!"
            : "Category created successfully!"
        );

        setTimeout(() => {
          setActiveMenu("categories");
        }, 1500);
      } else {
        setSubmitError(response.data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error submitting category:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      setSubmitError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} category`
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state for edit mode
  if (fetchLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <Loader className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading category data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => setActiveMenu("categories")}
          className={styles.backButton}
        >
          <ArrowLeft className={styles.backIcon} />
          Back to Categories
        </button>

        <h1 className={styles.headerTitle}>
          {isEditMode ? "Edit Category" : "Add New Category"}
        </h1>
        <p className={styles.headerSubtitle}>
          {isEditMode
            ? "Update the category and its subcategories"
            : "Create a new category with subcategories"}
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <CheckCircle className={styles.alertIcon} />
          {successMessage}
        </div>
      )}

      {submitError && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle className={styles.alertIcon} />
          {submitError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className={styles.formLayout}>
          {/* Main Category Section */}
          <div className={styles.formSection}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <Folder className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>Main Category</h2>
              </div>

              <div className={styles.formFields}>
                {/* Category Name */}
                <div className={styles.formField}>
                  <label htmlFor="name" className={styles.fieldLabel}>
                    Category Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Shoes, Clothing, Accessories"
                    className={`${styles.input} ${
                      errors.name ? styles.inputError : ""
                    }`}
                    maxLength={100}
                    disabled={loading}
                  />
                  <div className={styles.inputFooter}>
                    {errors.name ? (
                      <p className={styles.errorText}>
                        <AlertCircle className={styles.errorIcon} />
                        {errors.name}
                      </p>
                    ) : (
                      <p className={styles.fieldHint}>
                        Enter the main category name (e.g., Shoes, Clothing)
                      </p>
                    )}
                    <span className={styles.charCount}>
                      {formData.name.length}/100
                    </span>
                  </div>
                </div>

                {/* Category Description */}
                <div className={styles.formField}>
                  <label htmlFor="description" className={styles.fieldLabel}>
                    Category Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this category (optional)"
                    rows={3}
                    className={`${styles.input} ${styles.textarea} ${
                      errors.description ? styles.inputError : ""
                    }`}
                    maxLength={500}
                    disabled={loading}
                  />
                  <div className={styles.inputFooter}>
                    {errors.description ? (
                      <p className={styles.errorText}>
                        <AlertCircle className={styles.errorIcon} />
                        {errors.description}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <span className={styles.charCount}>
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subcategories Section */}
          <div className={styles.formSection}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <Tag className={styles.sectionIcon} />
                <div className={styles.sectionTitleContainer}>
                  <h2 className={styles.sectionTitle}>
                    Subcategories
                    {formData.name && (
                      <span className={styles.categoryBadge}>
                        under "{formData.name}"
                      </span>
                    )}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addSubCategory}
                  className={styles.addSubButton}
                  disabled={loading || !formData.name.trim()}
                  title={
                    !formData.name.trim()
                      ? "Enter category name first"
                      : "Add new subcategory"
                  }
                >
                  <Plus className={styles.addSubIcon} />
                  Add Subcategory
                </button>
              </div>

              {!formData.name.trim() ? (
                <div className={styles.emptySubcategoryState}>
                  <Tag className={styles.emptySubcategoryIcon} />
                  <p className={styles.emptySubcategoryText}>
                    Please enter a category name first to add subcategories
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.subcategoriesContainer}>
                    {subCategories.map((subCategory, index) => (
                      <div key={index} className={styles.subcategoryItem}>
                        <div className={styles.subcategoryHeader}>
                          <div className={styles.subcategoryHeaderLeft}>
                            <span className={styles.subcategoryNumber}>
                              #{index + 1}
                            </span>
                            <div className={styles.categoryPath}>
                              <Folder className={styles.pathIcon} />
                              <span className={styles.pathText}>
                                {formData.name}
                              </span>
                              <ChevronRight className={styles.pathSeparator} />
                              <Tag className={styles.pathIcon} />
                              <span className={styles.pathPlaceholder}>
                                {subCategory.name || "Subcategory Name"}
                              </span>
                            </div>
                          </div>
                          {subCategories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubCategory(index)}
                              className={styles.removeSubButton}
                              disabled={loading}
                              title="Remove subcategory"
                            >
                              <Trash2 className={styles.removeSubIcon} />
                            </button>
                          )}
                        </div>

                        <div className={styles.subcategoryFields}>
                          {/* Subcategory Name */}
                          <div className={styles.formField}>
                            <label
                              htmlFor={`sub_name_${index}`}
                              className={styles.fieldLabel}
                            >
                              Subcategory Name
                            </label>
                            <input
                              type="text"
                              id={`sub_name_${index}`}
                              value={subCategory.name}
                              onChange={(e) =>
                                handleSubCategoryChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder={`e.g., Sport ${formData.name}, Casual ${formData.name}`}
                              className={`${styles.input} ${
                                errors[`subcategory_${index}_name`]
                                  ? styles.inputError
                                  : ""
                              }`}
                              maxLength={100}
                              disabled={loading}
                            />
                            <div className={styles.inputFooter}>
                              {errors[`subcategory_${index}_name`] ? (
                                <p className={styles.errorText}>
                                  <AlertCircle className={styles.errorIcon} />
                                  {errors[`subcategory_${index}_name`]}
                                </p>
                              ) : (
                                <span></span>
                              )}
                              <span className={styles.charCount}>
                                {subCategory.name.length}/100
                              </span>
                            </div>
                          </div>

                          {/* Subcategory Description */}
                          <div className={styles.formField}>
                            <label
                              htmlFor={`sub_description_${index}`}
                              className={styles.fieldLabel}
                            >
                              Description (Optional)
                            </label>
                            <textarea
                              id={`sub_description_${index}`}
                              value={subCategory.description}
                              onChange={(e) =>
                                handleSubCategoryChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Brief description of this subcategory"
                              rows={2}
                              className={`${styles.input} ${styles.textarea} ${
                                errors[`subcategory_${index}_description`]
                                  ? styles.inputError
                                  : ""
                              }`}
                              maxLength={300}
                              disabled={loading}
                            />
                            <div className={styles.inputFooter}>
                              {errors[`subcategory_${index}_description`] ? (
                                <p className={styles.errorText}>
                                  <AlertCircle className={styles.errorIcon} />
                                  {errors[`subcategory_${index}_description`]}
                                </p>
                              ) : (
                                <span></span>
                              )}
                              <span className={styles.charCount}>
                                {subCategory.description.length}/300
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.subcategoryHint}>
                    <AlertCircle className={styles.hintIcon} />
                    <div>
                      <p className={styles.hintText}>
                        <strong>Tip:</strong> Subcategories help organize
                        products under "{formData.name}". For example:
                      </p>
                      <ul className={styles.hintList}>
                        <li>Sport {formData.name}</li>
                        <li>Casual {formData.name}</li>
                        <li>Formal {formData.name}</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && formData.name.trim() && (
            <div className={styles.formSection}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <Folder className={styles.sectionIcon} />
                  <h2 className={styles.sectionTitle}>Category Preview</h2>
                </div>

                <div className={styles.previewContainer}>
                  <div className={styles.previewCategory}>
                    <Folder className={styles.previewCategoryIcon} />
                    <div className={styles.previewCategoryContent}>
                      <h3 className={styles.previewCategoryName}>
                        {formData.name}
                      </h3>
                      {formData.description && (
                        <p className={styles.previewCategoryDescription}>
                          {formData.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {subCategories.some((sub) => sub.name.trim()) && (
                    <div className={styles.previewSubcategories}>
                      <div className={styles.previewSubcategoriesHeader}>
                        <Tag className={styles.previewSubIcon} />
                        <span>Subcategories</span>
                      </div>
                      <div className={styles.previewSubcategoriesList}>
                        {subCategories
                          .filter((sub) => sub.name.trim())
                          .map((sub, index) => (
                            <div
                              key={index}
                              className={styles.previewSubcategoryItem}
                            >
                              <ChevronRight
                                className={styles.previewSubArrow}
                              />
                              <span className={styles.previewSubName}>
                                {sub.name}
                              </span>
                              {sub.description && (
                                <span className={styles.previewSubDescription}>
                                  - {sub.description}
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => setActiveMenu("categories")}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className={styles.submitButton}
          >
            {loading ? (
              <>
                <Loader
                  className={`${styles.submitButtonIcon} ${styles.submitButtonSpinner}`}
                />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className={styles.submitButtonIcon} />
                {isEditMode ? "Update Category" : "Create Category"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategories;
