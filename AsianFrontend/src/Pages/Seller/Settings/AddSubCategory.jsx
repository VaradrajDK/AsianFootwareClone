import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Settings/AddSubCategory.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFolder,
  faFolderPlus,
  faTrash,
  faEdit,
  faCheck,
  faTimes,
  faSpinner,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

const AddSubCategory = ({ setActiveMenu }) => {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Get categoryId from props or location state
  useEffect(() => {
    const categoryId = location.state?.categoryId;
    if (categoryId) {
      handleSelectCategory(categoryId);
    } else {
      fetchCategories();
    }
  }, [location.state]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/seller/get-categories");
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setMessage({ type: "error", text: "Failed to load categories" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = async (categoryId) => {
    try {
      setLoading(true);
      const response = await api.get(`/seller/get-category/${categoryId}`);
      if (response.data.success) {
        const category = response.data.category;
        setSelectedCategory(category);
        setSubCategories(category.subCategories || []);

        // Also fetch all categories for the dropdown
        if (categories.length === 0) {
          await fetchCategories();
        }
      }
    } catch (error) {
      console.error("Error fetching category:", error);
      setMessage({ type: "error", text: "Failed to load category details" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!newSubCategory.trim()) {
      setMessage({ type: "error", text: "Please enter a sub-category name" });
      return;
    }

    if (!selectedCategory) {
      setMessage({ type: "error", text: "Please select a category first" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/seller/add-subcategory", {
        name: newSubCategory.trim(),
        categoryId: selectedCategory._id,
        description: "",
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Sub-category added successfully!",
        });
        setNewSubCategory("");
        // Refresh sub-categories list
        handleSelectCategory(selectedCategory._id);
      }
    } catch (error) {
      console.error("Error adding sub-category:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to add sub-category",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubCategory = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this sub-category? Products using this sub-category will be affected."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/seller/delete-subcategory/${id}`);
      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Sub-category deleted successfully!",
        });
        // Refresh sub-categories list
        handleSelectCategory(selectedCategory._id);
      }
    } catch (error) {
      console.error("Error deleting sub-category:", error);
      setMessage({ type: "error", text: "Failed to delete sub-category" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (subCategory) => {
    setEditingId(subCategory._id);
    setEditingValue(subCategory.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleUpdateSubCategory = async (id) => {
    if (!editingValue.trim()) {
      setMessage({ type: "error", text: "Sub-category name cannot be empty" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/seller/update-subcategory/${id}`, {
        name: editingValue.trim(),
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Sub-category updated successfully!",
        });
        setEditingId(null);
        setEditingValue("");
        // Refresh sub-categories list
        handleSelectCategory(selectedCategory._id);
      }
    } catch (error) {
      console.error("Error updating sub-category:", error);
      setMessage({ type: "error", text: "Failed to update sub-category" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCategories = () => {
    setActiveMenu("add-category");
  };

  return (
    <div className={styles["add-subcategory-container"]}>
      <div className={styles["add-subcategory-card"]}>
        {/* Header */}
        <div className={styles["header-section"]}>
          <button
            onClick={handleBackToCategories}
            className={styles["back-button"]}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Categories
          </button>
          <h2 className={styles["form-title"]}>
            <FontAwesomeIcon icon={faLayerGroup} /> Manage Sub-Categories
          </h2>
          <p className={styles["form-subtitle"]}>
            Add, edit, or delete sub-categories for your product categories.
          </p>
        </div>

        {message.text && (
          <div className={`${styles["message"]} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* Category Selection */}
        <div className={styles["category-selection"]}>
          <h3 className={styles["section-title"]}>
            <FontAwesomeIcon icon={faFolder} /> Select Category
          </h3>
          <div className={styles["categories-grid"]}>
            {loading && categories.length === 0 ? (
              <div className={styles["loading-state"]}>
                <FontAwesomeIcon icon={faSpinner} spin />
                <p>Loading categories...</p>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category._id}
                  className={`${styles["category-card"]} ${
                    selectedCategory?._id === category._id
                      ? styles["selected"]
                      : ""
                  }`}
                  onClick={() => handleSelectCategory(category._id)}
                >
                  <div className={styles["category-icon"]}>
                    <FontAwesomeIcon icon={faFolder} />
                  </div>
                  <div className={styles["category-details"]}>
                    <h4>{category.name}</h4>
                    <p>{category.subCategories?.length || 0} sub-categories</p>
                  </div>
                  {selectedCategory?._id === category._id && (
                    <div className={styles["selected-indicator"]}>
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {selectedCategory && (
          <>
            {/* Selected Category Info */}
            <div className={styles["selected-category-info"]}>
              <h3>
                Managing Sub-Categories for:{" "}
                <span className={styles["category-name"]}>
                  {selectedCategory.name}
                </span>
              </h3>
              <p className={styles["category-description"]}>
                Add sub-categories that will be available under this category.
              </p>
            </div>

            {/* Add Sub-Category Form */}
            <form
              onSubmit={handleAddSubCategory}
              className={styles["add-form"]}
            >
              <div className={styles["input-group"]}>
                <input
                  type="text"
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  placeholder={`Enter new sub-category for ${selectedCategory.name} (e.g., Running, Casual, Formal)`}
                  className={styles["subcategory-input"]}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className={styles["add-btn"]}
                  disabled={loading}
                >
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faFolderPlus} /> Add Sub-Category
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sub-Categories List */}
            <div className={styles["subcategories-section"]}>
              <h3 className={styles["section-title"]}>
                Sub-Categories ({subCategories.length})
              </h3>

              {loading && subCategories.length === 0 ? (
                <div className={styles["loading-state"]}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <p>Loading sub-categories...</p>
                </div>
              ) : subCategories.length === 0 ? (
                <div className={styles["empty-state"]}>
                  <p>
                    No sub-categories added yet. Add your first sub-category
                    above.
                  </p>
                </div>
              ) : (
                <div className={styles["subcategories-list"]}>
                  {subCategories.map((subCategory) => (
                    <div
                      key={subCategory._id}
                      className={styles["subcategory-item"]}
                    >
                      {editingId === subCategory._id ? (
                        <div className={styles["edit-form"]}>
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className={styles["edit-input"]}
                            autoFocus
                          />
                          <div className={styles["edit-actions"]}>
                            <button
                              onClick={() =>
                                handleUpdateSubCategory(subCategory._id)
                              }
                              className={styles["save-btn"]}
                              disabled={loading}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className={styles["cancel-btn"]}
                              disabled={loading}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles["subcategory-info"]}>
                            <span className={styles["subcategory-name"]}>
                              {subCategory.name}
                            </span>
                            <span className={styles["created-date"]}>
                              Added on:{" "}
                              {new Date(
                                subCategory.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={styles["subcategory-actions"]}>
                            <button
                              onClick={() => handleStartEdit(subCategory)}
                              className={styles["edit-btn"]}
                              title="Edit Sub-Category"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSubCategory(subCategory._id)
                              }
                              className={styles["delete-btn"]}
                              title="Delete Sub-Category"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles["instructions"]}>
          <h4>How to use sub-categories:</h4>
          <ol>
            <li>Select a category from the list above</li>
            <li>Add sub-categories specific to that category</li>
            <li>Use these sub-categories when adding products</li>
            <li>Sub-categories help organize products within a category</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AddSubCategory;
