// components/Seller/ProductActions.jsx
import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faEllipsisV,
  faEye,
  faCopy,
  faArchive,
  faBoxOpen,
  faToggleOn,
  faToggleOff,
  faSpinner,
  faCheck,
  faTimes,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../services/axiosConfig";
import styles from "../../../Styles/Seller/ProductActions.module.css";

const ProductActions = ({
  product,
  onEdit,
  onDelete,
  onUpdate,
  onView,
  showInline = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    action: null,
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const setActionLoading = (action, isLoading) => {
    setLoading((prev) => ({ ...prev, [action]: isLoading }));
  };

  // Toggle product status (Active/Inactive)
  const handleToggleStatus = async () => {
    setActionLoading("status", true);
    try {
      const response = await api.patch(
        `/seller/product/${product._id}/status`,
        {
          isActive: !product.isActive,
        }
      );

      if (response.data.success) {
        showToast(
          `Product ${
            product.isActive ? "deactivated" : "activated"
          } successfully`
        );
        onUpdate && onUpdate(response.data.product);
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update status",
        "error"
      );
    } finally {
      setActionLoading("status", false);
      setIsOpen(false);
    }
  };

  // Archive/Unarchive product
  const handleArchive = async () => {
    setActionLoading("archive", true);
    try {
      const response = await api.patch(
        `/seller/product/${product._id}/archive`,
        {
          isArchived: !product.isArchived,
        }
      );

      if (response.data.success) {
        showToast(
          `Product ${
            product.isArchived ? "unarchived" : "archived"
          } successfully`
        );
        onUpdate && onUpdate(response.data.product);
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to archive product",
        "error"
      );
    } finally {
      setActionLoading("archive", false);
      setIsOpen(false);
    }
  };

  // Duplicate product
  const handleDuplicate = async () => {
    setActionLoading("duplicate", true);
    try {
      const response = await api.post(
        `/seller/product/${product._id}/duplicate`
      );

      if (response.data.success) {
        showToast("Product duplicated successfully");
        onUpdate && onUpdate(response.data.product, "duplicate");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to duplicate product",
        "error"
      );
    } finally {
      setActionLoading("duplicate", false);
      setIsOpen(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    setActionLoading("delete", true);
    try {
      const response = await api.delete(`/seller/DeleteProduct/${product._id}`);

      if (response.data.success) {
        showToast("Product deleted successfully");
        onDelete && onDelete(product._id);
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete product",
        "error"
      );
    } finally {
      setActionLoading("delete", false);
      setConfirmModal({ show: false, action: null });
    }
  };

  // Confirm action handler
  const handleConfirmAction = () => {
    switch (confirmModal.action) {
      case "delete":
        handleDelete();
        break;
      case "archive":
        handleArchive();
        break;
      default:
        break;
    }
  };

  // Open confirmation modal
  const openConfirmModal = (action) => {
    setConfirmModal({ show: true, action });
    setIsOpen(false);
  };

  const getConfirmModalContent = () => {
    switch (confirmModal.action) {
      case "delete":
        return {
          title: "Delete Product",
          message: `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
          confirmText: "Delete",
          type: "danger",
        };
      case "archive":
        return {
          title: product.isArchived ? "Unarchive Product" : "Archive Product",
          message: product.isArchived
            ? `Are you sure you want to unarchive "${product.title}"?`
            : `Are you sure you want to archive "${product.title}"? It will be hidden from your store.`,
          confirmText: product.isArchived ? "Unarchive" : "Archive",
          type: "warning",
        };
      default:
        return {};
    }
  };

  return (
    <>
      <div className={styles.actionsContainer} ref={dropdownRef}>
        {/* Inline Actions */}
        {showInline && (
          <div className={styles.inlineActions}>
            <button
              className={styles.actionBtn}
              onClick={() => onEdit && onEdit(product._id)}
              title="Edit"
              disabled={loading.edit}
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => openConfirmModal("delete")}
              title="Delete"
              disabled={loading.delete}
            >
              {loading.delete ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faTrash} />
              )}
            </button>
          </div>
        )}

        {/* More Actions Dropdown */}
        <div className={styles.moreActions}>
          <button
            className={styles.actionBtn}
            onClick={() => setIsOpen(!isOpen)}
            title="More actions"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>

          {isOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>Actions</div>

              {/* View Details */}
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  onView && onView(product);
                  setIsOpen(false);
                }}
              >
                <FontAwesomeIcon icon={faEye} />
                <span>View Details</span>
              </button>

              {/* Edit */}
              {!showInline && (
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    onEdit && onEdit(product._id);
                    setIsOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  <span>Edit Product</span>
                </button>
              )}

              {/* Duplicate */}
              <button
                className={styles.dropdownItem}
                onClick={handleDuplicate}
                disabled={loading.duplicate}
              >
                {loading.duplicate ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faCopy} />
                )}
                <span>Duplicate</span>
              </button>

              <div className={styles.dropdownDivider} />

              {/* Toggle Status */}
              <button
                className={styles.dropdownItem}
                onClick={handleToggleStatus}
                disabled={loading.status}
              >
                {loading.status ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon
                    icon={product.isActive ? faToggleOff : faToggleOn}
                  />
                )}
                <span>{product.isActive ? "Deactivate" : "Activate"}</span>
              </button>

              {/* Archive */}
              <button
                className={styles.dropdownItem}
                onClick={() => openConfirmModal("archive")}
                disabled={loading.archive}
              >
                {loading.archive ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon
                    icon={product.isArchived ? faBoxOpen : faArchive}
                  />
                )}
                <span>{product.isArchived ? "Unarchive" : "Archive"}</span>
              </button>

              <div className={styles.dropdownDivider} />

              {/* Delete */}
              {!showInline && (
                <button
                  className={`${styles.dropdownItem} ${styles.dangerItem}`}
                  onClick={() => openConfirmModal("delete")}
                  disabled={loading.delete}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div
          className={styles.modalOverlay}
          onClick={() => setConfirmModal({ show: false, action: null })}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div
              className={`${styles.modalIcon} ${
                styles[getConfirmModalContent().type]
              }`}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h3 className={styles.modalTitle}>
              {getConfirmModalContent().title}
            </h3>
            <p className={styles.modalMessage}>
              {getConfirmModalContent().message}
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmModal({ show: false, action: null })}
                disabled={loading[confirmModal.action]}
              >
                Cancel
              </button>
              <button
                className={`${styles.confirmBtn} ${
                  styles[getConfirmModalContent().type]
                }`}
                onClick={handleConfirmAction}
                disabled={loading[confirmModal.action]}
              >
                {loading[confirmModal.action] ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Processing...
                  </>
                ) : (
                  getConfirmModalContent().confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          <FontAwesomeIcon
            icon={toast.type === "success" ? faCheck : faTimes}
            className={styles.toastIcon}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default ProductActions;
