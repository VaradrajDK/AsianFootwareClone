// components/Seller/SellerProducts.jsx
import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faPlus,
  faSpinner,
  faSearch,
  faChevronDown,
  faExclamationTriangle,
  faPalette,
  faRuler,
  faBoxes,
  faCube,
  faTag,
  faEllipsisV,
  faEye,
  faCopy,
  faArchive,
  faBoxOpen,
  faCheckCircle,
  faTimesCircle,
  faSortAmountDownAlt,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../services/axiosConfig.js";
import ProductDetailsModal from "../../Modals/ProductDetailsModal.jsx";
import styles from "../../Styles/Seller/SellerProducts.module.css";

const SellerProducts = ({ setActiveMenu, setSelectedProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Modal & Action States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    action: null,
    product: null,
  });

  const dropdownRefs = useRef({});

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutside = Object.values(dropdownRefs.current).every(
        (ref) => ref && !ref.contains(event.target)
      );
      if (clickedOutside) {
        setActiveDropdown(null);
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

  const fetchProducts = async () => {
    try {
      const response = await api.get("/seller/get-Products");
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast("Failed to fetch products", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const setActionLoadingState = (productId, action, isLoading) => {
    setActionLoading((prev) => ({
      ...prev,
      [`${productId}-${action}`]: isLoading,
    }));
  };

  // Refresh product details after variant/size changes
  const refreshProductDetails = async (productId) => {
    try {
      const response = await api.get(`/seller/product-details/${productId}`);
      if (response.data.success) {
        setSelectedProduct(response.data.product);
        // Also update the products list
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId
              ? { ...p, variants: response.data.product.variants }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error refreshing product:", error);
    }
  };

  // View Details
  const handleViewDetails = async (product) => {
    setActiveDropdown(null);
    setDetailsLoading(true);
    setViewModalOpen(true);
    setSelectedProduct(null);

    try {
      const response = await api.get(`/seller/product-details/${product._id}`);
      if (response.data.success) {
        setSelectedProduct(response.data.product);
      } else {
        throw new Error(response.data.message || "Failed to load details");
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      showToast(
        error.response?.data?.message || "Failed to load product details",
        "error"
      );
      setViewModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // NEW: Delete Variant
  const handleDeleteVariant = async (productId, variantId) => {
    try {
      const response = await api.delete(
        `/seller/product/${productId}/variant/${variantId}`
      );
      if (response.data.success) {
        showToast("Variant deleted successfully");
        await refreshProductDetails(productId);
      } else {
        throw new Error(response.data.message || "Failed to delete variant");
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      showToast(
        error.response?.data?.message || "Failed to delete variant",
        "error"
      );
    }
  };

  // NEW: Delete Size
  const handleDeleteSize = async (productId, variantId, sizeId) => {
    try {
      const response = await api.delete(
        `/seller/product/${productId}/variant/${variantId}/size/${sizeId}`
      );
      if (response.data.success) {
        showToast("Size deleted successfully");
        await refreshProductDetails(productId);
      } else {
        throw new Error(response.data.message || "Failed to delete size");
      }
    } catch (error) {
      console.error("Error deleting size:", error);
      showToast(
        error.response?.data?.message || "Failed to delete size",
        "error"
      );
    }
  };

  // NEW: Archive Variant
  const handleArchiveVariant = async (productId, variantId, isArchived) => {
    try {
      const response = await api.patch(
        `/seller/product/${productId}/variant/${variantId}/archive`,
        { isArchived }
      );
      if (response.data.success) {
        showToast(
          `Variant ${isArchived ? "archived" : "unarchived"} successfully`
        );
        await refreshProductDetails(productId);
      } else {
        throw new Error(response.data.message || "Failed to archive variant");
      }
    } catch (error) {
      console.error("Error archiving variant:", error);
      showToast(
        error.response?.data?.message || "Failed to archive variant",
        "error"
      );
    }
  };

  // Duplicate Product
  const handleDuplicate = async (product) => {
    setActiveDropdown(null);
    setActionLoadingState(product._id, "duplicate", true);

    try {
      const response = await api.post(
        `/seller/product-duplicate/${product._id}`
      );
      if (response.data.success) {
        setProducts([response.data.product, ...products]);
        showToast("Product duplicated successfully");
      } else {
        throw new Error(response.data.message || "Failed to duplicate");
      }
    } catch (error) {
      console.error("Error duplicating product:", error);
      showToast(
        error.response?.data?.message || "Failed to duplicate product",
        "error"
      );
    } finally {
      setActionLoadingState(product._id, "duplicate", false);
    }
  };

  // Archive Product (entire product)
  const handleArchive = async (product) => {
    setActiveDropdown(null);
    setActionLoadingState(product._id, "archive", true);

    try {
      const response = await api.patch(
        `/seller/product-archive/${product._id}`,
        { isArchived: !product.isArchived }
      );
      if (response.data.success) {
        setProducts(
          products.map((p) =>
            p._id === product._id ? response.data.product : p
          )
        );
        showToast(
          `Product ${
            product.isArchived ? "unarchived" : "archived"
          } successfully`
        );
      } else {
        throw new Error(response.data.message || "Failed to archive");
      }
    } catch (error) {
      console.error("Error archiving product:", error);
      showToast(
        error.response?.data?.message || "Failed to archive product",
        "error"
      );
    } finally {
      setActionLoadingState(product._id, "archive", false);
      setConfirmModal({ show: false, action: null, product: null });
    }
  };

  // Delete Product
  const handleDelete = async (product) => {
    setActionLoadingState(product._id, "delete", true);

    try {
      const response = await api.delete(`/seller/DeleteProduct/${product._id}`);
      if (response.data.success) {
        setProducts(products.filter((p) => p._id !== product._id));
        showToast("Product deleted successfully");
      } else {
        throw new Error(response.data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast(
        error.response?.data?.message || "Failed to delete product",
        "error"
      );
    } finally {
      setActionLoadingState(product._id, "delete", false);
      setConfirmModal({ show: false, action: null, product: null });
    }
  };

  // Edit Product
  const handleEdit = (id) => {
    setSelectedProductId(id);
    setActiveMenu("add-product");
  };

  // Confirm action handler
  const handleConfirmAction = () => {
    const { action, product } = confirmModal;
    switch (action) {
      case "delete":
        handleDelete(product);
        break;
      case "archive":
        handleArchive(product);
        break;
      default:
        break;
    }
  };

  // Open confirmation modal
  const openConfirmModal = (action, product) => {
    setActiveDropdown(null);
    setConfirmModal({ show: true, action, product });
  };

  const getConfirmModalContent = () => {
    const { action, product } = confirmModal;
    switch (action) {
      case "delete":
        return {
          title: "Delete Product",
          message: `Are you sure you want to delete "${product?.title}"? This action cannot be undone.`,
          confirmText: "Delete",
          type: "danger",
        };
      case "archive":
        return {
          title: product?.isArchived ? "Unarchive Product" : "Archive Product",
          message: product?.isArchived
            ? `Unarchive "${product?.title}"? It will be visible again.`
            : `Archive "${product?.title}"? It will be hidden from your store.`,
          confirmText: product?.isArchived ? "Unarchive" : "Archive",
          type: "warning",
        };
      default:
        return {};
    }
  };

  // Helper functions
  const calculateTotalStock = (product) => {
    if (!product.variants || !Array.isArray(product.variants)) return 0;
    return product.variants.reduce((total, variant) => {
      if (variant.isDeleted || variant.isArchived) return total; // Skip deleted/archived variants
      if (!variant.sizes || !Array.isArray(variant.sizes)) return total;
      return (
        total +
        variant.sizes
          .filter((s) => !s.isDeleted) // Skip deleted sizes
          .reduce((sum, size) => sum + (size.stock || 0), 0)
      );
    }, 0);
  };

  const countColorVariants = (product) => {
    if (!product.variants) return 0;
    return product.variants.filter((v) => !v.isDeleted).length;
  };

  const countTotalSizes = (product) => {
    if (!product.variants) return 0;
    return product.variants
      .filter((v) => !v.isDeleted)
      .reduce(
        (total, variant) =>
          total + (variant.sizes?.filter((s) => !s.isDeleted)?.length || 0),
        0
      );
  };

  const getProductImage = (product) => {
    // Find first non-deleted variant with images
    const activeVariant = product.variants?.find(
      (v) => !v.isDeleted && v.images?.length > 0
    );
    if (activeVariant) {
      return activeVariant.images[0];
    }
    return "https://via.placeholder.com/150x150?text=No+Image";
  };

  const calculateDiscountPercentage = (product) => {
    if (product.mrp && product.sellingPrice && product.mrp > 0) {
      return Math.round(
        ((product.mrp - product.sellingPrice) / product.mrp) * 100
      );
    }
    return 0;
  };

  const categories = [
    "all",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.sellingPrice || 0) - (b.sellingPrice || 0);
        case "price-high":
          return (b.sellingPrice || 0) - (a.sellingPrice || 0);
        case "stock-low":
          return calculateTotalStock(a) - calculateTotalStock(b);
        case "stock-high":
          return calculateTotalStock(b) - calculateTotalStock(a);
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
      }
    });

  const totalStock = products.reduce(
    (sum, product) => sum + calculateTotalStock(product),
    0
  );
  const totalVariants = products.reduce(
    (sum, product) => sum + countColorVariants(product),
    0
  );
  const lowStockCount = products.filter(
    (p) => calculateTotalStock(p) > 0 && calculateTotalStock(p) < 10
  ).length;

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin className={styles.loadingIcon} />
        <span>Loading products...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Products</h1>
          <span className={styles.badge}>{products.length}</span>
        </div>
        <button
          className={styles.addButton}
          onClick={() => {
            setSelectedProductId(null);
            setActiveMenu("add-product");
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <FontAwesomeIcon icon={faCube} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{products.length}</span>
            <span className={styles.statLabel}>Products</span>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <FontAwesomeIcon icon={faBoxes} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalStock}</span>
            <span className={styles.statLabel}>Total Stock</span>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <FontAwesomeIcon icon={faPalette} className={styles.statIcon} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalVariants}</span>
            <span className={styles.statLabel}>Variants</span>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className={`${styles.statIcon} ${styles.warningIcon}`}
          />
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${styles.warningValue}`}>
              {lowStockCount}
            </span>
            <span className={styles.statLabel}>Low Stock</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.selectWrapper}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Categories</option>
              {categories
                .filter((c) => c !== "all")
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={styles.selectIcon}
            />
          </div>

          <div className={styles.selectWrapper}>
            <FontAwesomeIcon
              icon={faSortAmountDownAlt}
              className={styles.sortIconLeft}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`${styles.select} ${styles.sortSelect}`}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-low">Price: Low-High</option>
              <option value="price-high">Price: High-Low</option>
              <option value="stock-low">Stock: Low-High</option>
              <option value="stock-high">Stock: High-Low</option>
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={styles.selectIcon}
            />
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        <span>
          Showing {filteredProducts.length} of {products.length} products
        </span>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <FontAwesomeIcon icon={faCube} className={styles.emptyIcon} />
          <h3>No products found</h3>
          <p>
            {searchTerm
              ? "Try adjusting your search or filters"
              : "Start by adding your first product"}
          </p>
          {!searchTerm && (
            <button
              className={styles.emptyButton}
              onClick={() => {
                setSelectedProductId(null);
                setActiveMenu("add-product");
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Product
            </button>
          )}
        </div>
      ) : (
        <div className={styles.productsList}>
          {/* Table Header */}
          <div className={styles.tableHeader}>
            <div className={styles.colProduct}>Product</div>
            <div className={styles.colCategory}>Category</div>
            <div className={styles.colPrice}>Price</div>
            <div className={styles.colVariants}>Variants</div>
            <div className={styles.colStock}>Stock</div>
            <div className={styles.colStatus}>Status</div>
            <div className={styles.colActions}>Actions</div>
          </div>

          {/* Table Body */}
          {filteredProducts.map((product) => {
            const totalStock = calculateTotalStock(product);
            const discount = calculateDiscountPercentage(product);
            const colors = countColorVariants(product);
            const sizes = countTotalSizes(product);
            const isLoadingDuplicate =
              actionLoading[`${product._id}-duplicate`];
            const isLoadingArchive = actionLoading[`${product._id}-archive`];
            const isLoadingDelete = actionLoading[`${product._id}-delete`];

            return (
              <div className={styles.tableRow} key={product._id}>
                {/* Product Info */}
                <div className={styles.colProduct}>
                  <div className={styles.productInfo}>
                    <div className={styles.productImage}>
                      <img
                        src={getProductImage(product)}
                        alt={product.title}
                        loading="lazy"
                      />
                      {discount > 0 && (
                        <span className={styles.discountBadge}>
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <div className={styles.productDetails}>
                      <h4 className={styles.productTitle}>{product.title}</h4>
                      <span className={styles.productId}>
                        ID: {product._id?.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className={styles.colCategory}>
                  <span className={styles.categoryTag}>
                    <FontAwesomeIcon icon={faTag} />
                    {product.category || "—"}
                  </span>
                  {product.subCategory && (
                    <span className={styles.subCategory}>
                      {product.subCategory}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className={styles.colPrice}>
                  <span className={styles.sellingPrice}>
                    ₹{product.sellingPrice?.toLocaleString() || "0"}
                  </span>
                  {product.mrp > product.sellingPrice && (
                    <span className={styles.mrpPrice}>
                      ₹{product.mrp?.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Variants */}
                <div className={styles.colVariants}>
                  <div className={styles.variantInfo}>
                    <span className={styles.variantItem}>
                      <FontAwesomeIcon icon={faPalette} />
                      {colors}
                    </span>
                    <span className={styles.variantItem}>
                      <FontAwesomeIcon icon={faRuler} />
                      {sizes}
                    </span>
                  </div>
                </div>

                {/* Stock */}
                <div className={styles.colStock}>
                  <span
                    className={`${styles.stockValue} ${
                      totalStock === 0
                        ? styles.outOfStock
                        : totalStock < 10
                        ? styles.lowStock
                        : styles.inStock
                    }`}
                  >
                    <FontAwesomeIcon icon={faBoxes} />
                    {totalStock}
                  </span>
                </div>

                {/* Status */}
                <div className={styles.colStatus}>
                  {product.isArchived ? (
                    <span
                      className={`${styles.statusBadge} ${styles.statusArchived}`}
                    >
                      <FontAwesomeIcon icon={faArchive} />
                      Archived
                    </span>
                  ) : totalStock === 0 ? (
                    <span
                      className={`${styles.statusBadge} ${styles.statusOut}`}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} />
                      Out of Stock
                    </span>
                  ) : totalStock < 10 ? (
                    <span
                      className={`${styles.statusBadge} ${styles.statusLow}`}
                    >
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      Low Stock
                    </span>
                  ) : (
                    <span
                      className={`${styles.statusBadge} ${styles.statusActive}`}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Active
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className={styles.colActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEdit(product._id)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => openConfirmModal("delete", product)}
                    title="Delete"
                    disabled={isLoadingDelete}
                  >
                    {isLoadingDelete ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} />
                    )}
                  </button>
                  <div
                    className={styles.moreActions}
                    ref={(el) => (dropdownRefs.current[product._id] = el)}
                  >
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => toggleDropdown(product._id, e)}
                      title="More"
                    >
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    {activeDropdown === product._id && (
                      <div
                        className={styles.dropdown}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={styles.dropdownHeader}>Actions</div>

                        {/* View Details */}
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(product);
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          <span>View Details</span>
                        </button>

                        {/* Duplicate */}
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(product);
                          }}
                          disabled={isLoadingDuplicate}
                        >
                          {isLoadingDuplicate ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={faCopy} />
                          )}
                          <span>Duplicate</span>
                        </button>

                        <div className={styles.dropdownDivider} />

                        {/* Archive/Unarchive */}
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmModal("archive", product);
                          }}
                          disabled={isLoadingArchive}
                        >
                          {isLoadingArchive ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon
                              icon={product.isArchived ? faBoxOpen : faArchive}
                            />
                          )}
                          <span>
                            {product.isArchived ? "Unarchive" : "Archive"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Details Modal - UPDATED with variant management props */}
      {viewModalOpen && (
        <ProductDetailsModal
          product={selectedProduct}
          loading={detailsLoading}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedProduct(null);
          }}
          onDeleteVariant={handleDeleteVariant}
          onDeleteSize={handleDeleteSize}
          onArchiveVariant={handleArchiveVariant}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div
          className={styles.modalOverlay}
          onClick={() =>
            setConfirmModal({ show: false, action: null, product: null })
          }
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
                onClick={() =>
                  setConfirmModal({ show: false, action: null, product: null })
                }
                disabled={
                  actionLoading[
                    `${confirmModal.product?._id}-${confirmModal.action}`
                  ]
                }
              >
                Cancel
              </button>
              <button
                className={`${styles.confirmBtn} ${
                  styles[getConfirmModalContent().type]
                }`}
                onClick={handleConfirmAction}
                disabled={
                  actionLoading[
                    `${confirmModal.product?._id}-${confirmModal.action}`
                  ]
                }
              >
                {actionLoading[
                  `${confirmModal.product?._id}-${confirmModal.action}`
                ] ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Processing...</span>
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
    </div>
  );
};

export default SellerProducts;
