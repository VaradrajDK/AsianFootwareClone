import React, { useState, useEffect } from "react";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Settings/AddCategory.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderPlus,
  faTrash,
  faEdit,
  faCheck,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const AddCategory = ({ onCategoryAdded, setActiveMenu }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch existing categories
  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setMessage({ type: "error", text: "Please enter a category name" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/seller/add-category", {
        name: newCategory.trim(),
        description: "",
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "Category added successfully!" });
        setNewCategory("");
        fetchCategories();
        if (onCategoryAdded) {
          onCategoryAdded(response.data.category);
        }
      }
    } catch (error) {
      console.error("Error adding category:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to add category",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This will also delete all sub-categories under it."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/seller/delete-category/${id}`);
      if (response.data.success) {
        setMessage({ type: "success", text: "Category deleted successfully!" });
        fetchCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setMessage({ type: "error", text: "Failed to delete category" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (category) => {
    setEditingId(category._id);
    setEditingValue(category.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const handleUpdateCategory = async (id) => {
    if (!editingValue.trim()) {
      setMessage({ type: "error", text: "Category name cannot be empty" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/seller/update-category/${id}`, {
        name: editingValue.trim(),
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "Category updated successfully!" });
        setEditingId(null);
        setEditingValue("");
        fetchCategories();
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setMessage({ type: "error", text: "Failed to update category" });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubCategories = (categoryId) => {
    if (setActiveMenu) {
      setActiveMenu("add-subcategory", { categoryId });
    }
  };

  return (
    <div className={styles["add-category-container"]}>
      <div className={styles["add-category-card"]}>
        <div className={styles["header-section"]}>
          <h2 className={styles["form-title"]}>
            <FontAwesomeIcon icon={faFolderPlus} /> Manage Categories
          </h2>
          <p className={styles["form-subtitle"]}>
            Add, edit, or delete product categories. Click "Manage
            Sub-Categories" to add sub-categories.
          </p>
        </div>

        {message.text && (
          <div className={`${styles["message"]} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className={styles["add-form"]}>
          <div className={styles["input-group"]}>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category name (e.g., Sports, Fashion, Electronics)"
              className={styles["category-input"]}
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
                  <FontAwesomeIcon icon={faFolderPlus} /> Add Category
                </>
              )}
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className={styles["categories-section"]}>
          <h3 className={styles["section-title"]}>
            Existing Categories ({categories.length})
          </h3>

          {loading && categories.length === 0 ? (
            <div className={styles["loading-state"]}>
              <FontAwesomeIcon icon={faSpinner} spin />
              <p>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className={styles["empty-state"]}>
              <p>No categories added yet. Add your first category above.</p>
            </div>
          ) : (
            <div className={styles["categories-list"]}>
              {categories.map((category) => (
                <div key={category._id} className={styles["category-item"]}>
                  {editingId === category._id ? (
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
                          onClick={() => handleUpdateCategory(category._id)}
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
                      <div className={styles["category-info"]}>
                        <span className={styles["category-name"]}>
                          {category.name}
                        </span>
                        {category.subCategories &&
                          category.subCategories.length > 0 && (
                            <span className={styles["subcategory-count"]}>
                              {category.subCategories.length} sub-categories
                            </span>
                          )}
                      </div>
                      <div className={styles["category-actions"]}>
                        <button
                          onClick={() =>
                            handleManageSubCategories(category._id)
                          }
                          className={styles["manage-btn"]}
                          title="Manage Sub-Categories"
                        >
                          Manage Sub-Categories
                        </button>
                        <button
                          onClick={() => handleStartEdit(category)}
                          className={styles["edit-btn"]}
                          title="Edit Category"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className={styles["delete-btn"]}
                          title="Delete Category"
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

        <div className={styles["instructions"]}>
          <h4>How it works:</h4>
          <ol>
            <li>Add a category using the form above</li>
            <li>
              Click "Manage Sub-Categories" to add sub-categories for that
              category
            </li>
            <li>Use these categories when adding products</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;
