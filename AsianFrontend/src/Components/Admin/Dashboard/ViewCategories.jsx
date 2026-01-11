// Components/Admin/Dashboard/ViewCategories.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  X,
  Grid,
  List,
  Tag,
} from "lucide-react";
import api from "../../../services/axiosConfig.js";
import styles from "../../../Styles/Admin/ViewCategories.module.css";

const ViewCategories = ({ setActiveMenu, setSelectedCategoryId }) => {
  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [limit] = useState(10);

  // Expanded categories state (for subcategories)
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Modal states
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: "",
  });

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    category: null,
  });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        limit,
      });

      const response = await api.get(`/admin/categories?${params.toString()}`);

      if (response.data.success) {
        let filteredCategories = response.data.categories || [];

        // Client-side search filtering
        if (searchTerm) {
          filteredCategories = filteredCategories.filter(
            (category) =>
              category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              category.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
          );
        }

        setCategories(filteredCategories);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalCategories(
          response.data.pagination?.total || filteredCategories.length
        );
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteModal.categoryId) return;

    try {
      const response = await api.delete(
        `/admin/categories/${deleteModal.categoryId}`
      );

      if (response.data.success) {
        setSuccessMessage("Category deleted successfully");
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" });
        fetchCategories();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (category) => {
    setDeleteModal({
      isOpen: true,
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  // Open view modal
  const openViewModal = (category) => {
    setViewModal({
      isOpen: true,
      category,
    });
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Handle navigation
  const handleAddCategory = () => {
    setActiveMenu("add-category");
  };

  const handleEditCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setActiveMenu("edit-category");
  };

  // Render category card
  const renderCategoryCard = (category) => {
    const isExpanded = expandedCategories.has(category._id);
    const hasSubcategories =
      category.subCategories && category.subCategories.length > 0;

    return (
      <div key={category._id} className={styles.categoryCard}>
        {/* Category Header */}
        <div className={styles.categoryHeader}>
          <div className={styles.categoryMainInfo}>
            {hasSubcategories ? (
              <button
                onClick={() => toggleCategoryExpansion(category._id)}
                className={styles.expandButton}
              >
                {isExpanded ? (
                  <ChevronDown className={styles.expandIcon} />
                ) : (
                  <ChevronRight className={styles.expandIcon} />
                )}
              </button>
            ) : (
              <div className={styles.expandIconPlaceholder}></div>
            )}

            <Folder className={styles.categoryIcon} />

            <div className={styles.categoryDetails}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              {category.description && (
                <p className={styles.categoryDescription}>
                  {category.description}
                </p>
              )}
              <div className={styles.categoryMeta}>
                <span className={styles.subcategoryCount}>
                  <Tag className={styles.metaIcon} />
                  {category.subCategories?.length || 0} Subcategories
                </span>
                <span className={styles.categoryDate}>
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.categoryActions}>
            <button
              onClick={() => openViewModal(category)}
              className={`${styles.actionButton} ${styles.actionButtonView}`}
              title="View Details"
            >
              <Eye className={styles.actionIcon} />
            </button>
            <button
              onClick={() => handleEditCategory(category._id)}
              className={`${styles.actionButton} ${styles.actionButtonEdit}`}
              title="Edit"
            >
              <Edit className={styles.actionIcon} />
            </button>
            <button
              onClick={() => openDeleteModal(category)}
              className={`${styles.actionButton} ${styles.actionButtonDelete}`}
              title="Delete"
            >
              <Trash2 className={styles.actionIcon} />
            </button>
          </div>
        </div>

        {/* Subcategories */}
        {isExpanded && hasSubcategories && (
          <div className={styles.subcategoriesContainer}>
            <div className={styles.subcategoriesHeader}>
              <FolderOpen className={styles.subcategoriesIcon} />
              <span>Subcategories</span>
            </div>
            <div className={styles.subcategoriesList}>
              {category.subCategories.map((sub, index) => (
                <div key={index} className={styles.subcategoryItem}>
                  <ChevronRight className={styles.subcategoryIcon} />
                  <div className={styles.subcategoryInfo}>
                    <span className={styles.subcategoryName}>{sub.name}</span>
                    {sub.description && (
                      <span className={styles.subcategoryDescription}>
                        {sub.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Category Management</h1>
            <p className={styles.headerSubtitle}>
              Manage product categories and subcategories
            </p>
          </div>
          <button onClick={handleAddCategory} className={styles.addButton}>
            <Plus className={styles.addButtonIcon} />
            Add Category
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <CheckCircle className={styles.alertIcon} />
          {successMessage}
        </div>
      )}

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle className={styles.alertIcon} />
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersRow}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filtersGroup}>
            {/* Refresh Button */}
            <button
              onClick={fetchCategories}
              className={styles.refreshButton}
              title="Refresh"
            >
              <RefreshCw
                className={`${styles.refreshIcon} ${
                  loading ? styles.refreshIconSpinning : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className={styles.resultsCount}>
          Showing {categories.length} of {totalCategories} categories
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      ) : categories.length === 0 ? (
        <div className={styles.emptyState}>
          <Folder className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No Categories Found</h3>
          <p className={styles.emptyText}>
            {searchTerm
              ? "No categories match your search criteria."
              : "Get started by adding your first category."}
          </p>
          <button onClick={handleAddCategory} className={styles.addButton}>
            <Plus className={styles.addButtonIcon} />
            Add Category
          </button>
        </div>
      ) : (
        <div className={styles.categoriesGrid}>
          {categories.map(renderCategoryCard)}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Category</h3>
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    categoryId: null,
                    categoryName: "",
                  })
                }
                className={styles.modalCloseButton}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.modalIconWrapper}>
                <AlertCircle className={styles.modalAlertIcon} />
              </div>
              <p className={styles.modalText}>
                Are you sure you want to delete the category{" "}
                <span className={styles.modalTextBold}>
                  "{deleteModal.categoryName}"
                </span>
                ? This will also delete all its subcategories. This action
                cannot be undone.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    categoryId: null,
                    categoryName: "",
                  })
                }
                className={`${styles.modalButton} ${styles.modalButtonCancel}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={`${styles.modalButton} ${styles.modalButtonDelete}`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewModal.isOpen && viewModal.category && (
        <div className={styles.modalOverlay}>
          <div className={styles.viewModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Category Details</h3>
              <button
                onClick={() => setViewModal({ isOpen: false, category: null })}
                className={styles.modalCloseButton}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>

            <div className={styles.viewModalContent}>
              <div className={styles.viewModalSection}>
                <label className={styles.viewModalLabel}>Category Name</label>
                <p className={styles.viewModalValue}>
                  {viewModal.category.name}
                </p>
              </div>

              {viewModal.category.description && (
                <div className={styles.viewModalSection}>
                  <label className={styles.viewModalLabel}>Description</label>
                  <p className={styles.viewModalValue}>
                    {viewModal.category.description}
                  </p>
                </div>
              )}

              <div className={styles.viewModalSection}>
                <label className={styles.viewModalLabel}>
                  Subcategories ({viewModal.category.subCategories?.length || 0}
                  )
                </label>
                {viewModal.category.subCategories &&
                viewModal.category.subCategories.length > 0 ? (
                  <div className={styles.subcategoriesViewList}>
                    {viewModal.category.subCategories.map((sub, index) => (
                      <div key={index} className={styles.subcategoryViewItem}>
                        <Tag className={styles.subcategoryViewIcon} />
                        <div>
                          <p className={styles.subcategoryViewName}>
                            {sub.name}
                          </p>
                          {sub.description && (
                            <p className={styles.subcategoryViewDescription}>
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noSubcategories}>No subcategories</p>
                )}
              </div>

              <div className={styles.viewModalSection}>
                <label className={styles.viewModalLabel}>Created</label>
                <p className={styles.viewModalValue}>
                  {new Date(viewModal.category.createdAt).toLocaleString()}
                </p>
              </div>

              {viewModal.category.updatedAt && (
                <div className={styles.viewModalSection}>
                  <label className={styles.viewModalLabel}>Last Updated</label>
                  <p className={styles.viewModalValue}>
                    {new Date(viewModal.category.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className={styles.viewModalFooter}>
              <button
                onClick={() => setViewModal({ isOpen: false, category: null })}
                className={styles.viewModalCloseButton}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEditCategory(viewModal.category._id);
                  setViewModal({ isOpen: false, category: null });
                }}
                className={styles.viewModalEditButton}
              >
                Edit Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewCategories;
