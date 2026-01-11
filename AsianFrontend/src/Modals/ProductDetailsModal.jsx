// Modals/ProductDetailsModal.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPalette,
  faRuler,
  faBoxes,
  faTag,
  faCalendarAlt,
  faCheckCircle,
  faTimesCircle,
  faArchive,
  faShoppingCart,
  faRupeeSign,
  faChartLine,
  faInfoCircle,
  faCube,
  faLayerGroup,
  faTrash,
  faBoxOpen,
  faSpinner,
  faExclamationTriangle,
  faChevronDown,
  faChevronUp,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./ProductDetailsModal.module.css";

const ProductDetailsModal = ({
  product,
  onClose,
  loading,
  onDeleteVariant,
  onDeleteSize,
  onArchiveVariant,
}) => {
  const [expandedVariants, setExpandedVariants] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  if (!product && !loading) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const calculateDiscount = () => {
    if (product?.mrp && product?.sellingPrice && product.mrp > 0) {
      return Math.round(
        ((product.mrp - product.sellingPrice) / product.mrp) * 100
      );
    }
    return 0;
  };

  const toggleVariantExpand = (variantId) => {
    setExpandedVariants((prev) => ({
      ...prev,
      [variantId]: !prev[variantId],
    }));
  };

  const handleDeleteVariant = async (variantId) => {
    if (!onDeleteVariant) return;

    setActionLoading((prev) => ({
      ...prev,
      [`delete-variant-${variantId}`]: true,
    }));
    try {
      await onDeleteVariant(product._id, variantId);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`delete-variant-${variantId}`]: false,
      }));
      setConfirmAction(null);
    }
  };

  const handleDeleteSize = async (variantId, sizeId) => {
    if (!onDeleteSize) return;

    setActionLoading((prev) => ({ ...prev, [`delete-size-${sizeId}`]: true }));
    try {
      await onDeleteSize(product._id, variantId, sizeId);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`delete-size-${sizeId}`]: false,
      }));
      setConfirmAction(null);
    }
  };

  const handleArchiveVariant = async (variantId, isCurrentlyArchived) => {
    if (!onArchiveVariant) return;

    setActionLoading((prev) => ({
      ...prev,
      [`archive-variant-${variantId}`]: true,
    }));
    try {
      await onArchiveVariant(product._id, variantId, !isCurrentlyArchived);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`archive-variant-${variantId}`]: false,
      }));
      setConfirmAction(null);
    }
  };

  const openConfirm = (type, data) => {
    setConfirmAction({ type, ...data });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <FontAwesomeIcon icon={faInfoCircle} />
            <h2>Product Details</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading product details...</p>
          </div>
        ) : (
          <div className={styles.content}>
            {/* Product Overview */}
            <div className={styles.overview}>
              <div className={styles.imageSection}>
                <div className={styles.mainImage}>
                  <img
                    src={
                      selectedImage ||
                      product?.variants?.[0]?.images?.[0] ||
                      "https://via.placeholder.com/300x300?text=No+Image"
                    }
                    alt={product?.title}
                  />
                  {calculateDiscount() > 0 && (
                    <span className={styles.discountTag}>
                      -{calculateDiscount()}%
                    </span>
                  )}
                </div>
                {product?.variants?.[0]?.images?.length > 1 && (
                  <div className={styles.thumbnailRow}>
                    {product.variants[0].images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${product.title} ${idx + 1}`}
                        className={`${styles.thumbnail} ${
                          selectedImage === img ? styles.activeThumbnail : ""
                        }`}
                        onClick={() => setSelectedImage(img)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.infoSection}>
                <h3 className={styles.productTitle}>{product?.title}</h3>

                {/* Status Badges */}
                <div className={styles.statusBadges}>
                  {product?.isArchived ? (
                    <span className={`${styles.badge} ${styles.archivedBadge}`}>
                      <FontAwesomeIcon icon={faArchive} />
                      Archived
                    </span>
                  ) : product?.stats?.totalStock === 0 ? (
                    <span className={`${styles.badge} ${styles.outBadge}`}>
                      <FontAwesomeIcon icon={faTimesCircle} />
                      Out of Stock
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.activeBadge}`}>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Active
                    </span>
                  )}
                  <span className={styles.productId}>
                    ID: {product?._id?.slice(-8)}
                  </span>
                </div>

                {/* Price */}
                <div className={styles.priceSection}>
                  <span className={styles.sellingPrice}>
                    {formatCurrency(product?.sellingPrice)}
                  </span>
                  {product?.mrp > product?.sellingPrice && (
                    <span className={styles.mrp}>
                      {formatCurrency(product?.mrp)}
                    </span>
                  )}
                </div>

                {/* Category Info */}
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryTag}>
                    <FontAwesomeIcon icon={faTag} />
                    {product?.category}
                  </span>
                  {product?.subCategory && (
                    <span className={styles.subCategoryTag}>
                      {product.subCategory}
                    </span>
                  )}
                  {product?.gender && (
                    <span className={styles.genderTag}>{product.gender}</span>
                  )}
                </div>

                {/* Description */}
                {product?.description && (
                  <p className={styles.description}>{product.description}</p>
                )}

                {/* Quick Stats */}
                <div className={styles.quickStats}>
                  <div className={styles.quickStatItem}>
                    <FontAwesomeIcon icon={faPalette} />
                    <span>{product?.stats?.colorVariants || 0}</span>
                    <label>Colors</label>
                  </div>
                  <div className={styles.quickStatItem}>
                    <FontAwesomeIcon icon={faRuler} />
                    <span>{product?.stats?.sizeOptions || 0}</span>
                    <label>Sizes</label>
                  </div>
                  <div className={styles.quickStatItem}>
                    <FontAwesomeIcon icon={faBoxes} />
                    <span>{product?.stats?.totalStock || 0}</span>
                    <label>Stock</label>
                  </div>
                  {product?.stats?.archivedVariants > 0 && (
                    <div className={styles.quickStatItem}>
                      <FontAwesomeIcon icon={faArchive} />
                      <span>{product?.stats?.archivedVariants}</span>
                      <label>Archived</label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Stats */}
            {product?.stats && (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>
                  <FontAwesomeIcon icon={faChartLine} />
                  Sales Performance
                </h4>
                <div className={styles.salesStats}>
                  <div className={styles.salesStatCard}>
                    <FontAwesomeIcon icon={faShoppingCart} />
                    <div className={styles.salesStatInfo}>
                      <span className={styles.salesStatValue}>
                        {product.stats.totalOrders || 0}
                      </span>
                      <span className={styles.salesStatLabel}>Orders</span>
                    </div>
                  </div>
                  <div className={styles.salesStatCard}>
                    <FontAwesomeIcon icon={faCube} />
                    <div className={styles.salesStatInfo}>
                      <span className={styles.salesStatValue}>
                        {product.stats.totalQuantitySold || 0}
                      </span>
                      <span className={styles.salesStatLabel}>Units Sold</span>
                    </div>
                  </div>
                  <div className={styles.salesStatCard}>
                    <FontAwesomeIcon icon={faRupeeSign} />
                    <div className={styles.salesStatInfo}>
                      <span className={styles.salesStatValue}>
                        {formatCurrency(product.stats.totalRevenue || 0)}
                      </span>
                      <span className={styles.salesStatLabel}>Revenue</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Variants Section - ENHANCED */}
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <FontAwesomeIcon icon={faLayerGroup} />
                Variants & Stock Management
              </h4>
              <div className={styles.variantsContainer}>
                {product?.variants?.map((variant, idx) => (
                  <div
                    key={variant._id || idx}
                    className={`${styles.variantCard} ${
                      variant.isArchived ? styles.archivedVariant : ""
                    }`}
                  >
                    {/* Variant Header */}
                    <div
                      className={styles.variantHeader}
                      onClick={() => toggleVariantExpand(variant._id)}
                    >
                      <div className={styles.variantColorInfo}>
                        <div
                          className={styles.colorSwatch}
                          style={{ backgroundColor: variant.hexCode || "#ccc" }}
                        />
                        <div className={styles.variantTitleGroup}>
                          <span className={styles.colorName}>
                            {variant.colorName}
                          </span>
                          <span className={styles.variantMeta}>
                            {variant.images?.length || 0} images •{" "}
                            {variant.sizes?.length || 0} sizes • Stock:{" "}
                            {variant.totalStock ||
                              variant.sizes?.reduce(
                                (sum, s) => sum + (s.stock || 0),
                                0
                              ) ||
                              0}
                          </span>
                        </div>
                        {variant.isArchived && (
                          <span className={styles.variantArchivedBadge}>
                            <FontAwesomeIcon icon={faArchive} />
                            Archived
                          </span>
                        )}
                      </div>
                      <div className={styles.variantActions}>
                        {/* Archive/Unarchive Variant Button */}
                        {onArchiveVariant && (
                          <button
                            className={`${styles.variantActionBtn} ${styles.archiveBtn}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirm("archiveVariant", {
                                variantId: variant._id,
                                isArchived: variant.isArchived,
                                colorName: variant.colorName,
                              });
                            }}
                            disabled={
                              actionLoading[`archive-variant-${variant._id}`]
                            }
                            title={
                              variant.isArchived
                                ? "Unarchive Variant"
                                : "Archive Variant"
                            }
                          >
                            {actionLoading[`archive-variant-${variant._id}`] ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                              <FontAwesomeIcon
                                icon={
                                  variant.isArchived ? faBoxOpen : faArchive
                                }
                              />
                            )}
                          </button>
                        )}

                        {/* Delete Variant Button */}
                        {onDeleteVariant && product?.variants?.length > 1 && (
                          <button
                            className={`${styles.variantActionBtn} ${styles.deleteBtn}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openConfirm("deleteVariant", {
                                variantId: variant._id,
                                colorName: variant.colorName,
                              });
                            }}
                            disabled={
                              actionLoading[`delete-variant-${variant._id}`]
                            }
                            title="Delete Variant"
                          >
                            {actionLoading[`delete-variant-${variant._id}`] ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                              <FontAwesomeIcon icon={faTrash} />
                            )}
                          </button>
                        )}

                        <FontAwesomeIcon
                          icon={
                            expandedVariants[variant._id]
                              ? faChevronUp
                              : faChevronDown
                          }
                          className={styles.expandIcon}
                        />
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedVariants[variant._id] && (
                      <div className={styles.variantContent}>
                        {/* Variant Images */}
                        <div className={styles.variantImages}>
                          <h5>
                            <FontAwesomeIcon icon={faImage} />
                            Images ({variant.images?.length || 0})
                          </h5>
                          <div className={styles.imagesGrid}>
                            {variant.images?.map((img, imgIdx) => (
                              <div key={imgIdx} className={styles.imageItem}>
                                <img
                                  src={img}
                                  alt={`${variant.colorName} ${imgIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sizes Table */}
                        <div className={styles.sizesSection}>
                          <h5>
                            <FontAwesomeIcon icon={faRuler} />
                            Sizes & Stock
                          </h5>
                          <div className={styles.sizesTable}>
                            <div className={styles.sizeHeader}>
                              <span>Size</span>
                              <span>SKU</span>
                              <span>Stock</span>
                              <span>Status</span>
                              {onDeleteSize && variant.sizes?.length > 1 && (
                                <span>Action</span>
                              )}
                            </div>
                            {variant.sizes?.map((size, sIdx) => (
                              <div
                                key={size._id || sIdx}
                                className={styles.sizeRow}
                              >
                                <span className={styles.sizeLabel}>
                                  {size.size}
                                </span>
                                <span className={styles.skuLabel}>
                                  {size.sku}
                                </span>
                                <span
                                  className={`${styles.stockLabel} ${
                                    size.stock === 0
                                      ? styles.stockOut
                                      : size.stock < 10
                                      ? styles.stockLow
                                      : styles.stockOk
                                  }`}
                                >
                                  {size.stock}
                                </span>
                                <span className={styles.sizeStatus}>
                                  {size.stock === 0 ? (
                                    <span className={styles.outStatus}>
                                      Out of Stock
                                    </span>
                                  ) : size.stock < 10 ? (
                                    <span className={styles.lowStatus}>
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className={styles.inStatus}>
                                      In Stock
                                    </span>
                                  )}
                                </span>
                                {onDeleteSize && variant.sizes?.length > 1 && (
                                  <span className={styles.sizeAction}>
                                    <button
                                      className={styles.deleteSizeBtn}
                                      onClick={() =>
                                        openConfirm("deleteSize", {
                                          variantId: variant._id,
                                          sizeId: size._id,
                                          sizeName: size.size,
                                          colorName: variant.colorName,
                                        })
                                      }
                                      disabled={
                                        actionLoading[`delete-size-${size._id}`]
                                      }
                                      title="Delete Size"
                                    >
                                      {actionLoading[
                                        `delete-size-${size._id}`
                                      ] ? (
                                        <FontAwesomeIcon
                                          icon={faSpinner}
                                          spin
                                        />
                                      ) : (
                                        <FontAwesomeIcon icon={faTrash} />
                                      )}
                                    </button>
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            {product?.specifications &&
              Object.values(product.specifications).some((v) => v) && (
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>
                    <FontAwesomeIcon icon={faInfoCircle} />
                    Specifications
                  </h4>
                  <div className={styles.specsGrid}>
                    {Object.entries(product.specifications)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => (
                        <div key={key} className={styles.specItem}>
                          <span className={styles.specLabel}>
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </span>
                          <span className={styles.specValue}>{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Timestamps */}
            <div className={styles.timestamps}>
              <div className={styles.timestampItem}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>Created: {formatDate(product?.createdAt)}</span>
              </div>
              <div className={styles.timestampItem}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>Updated: {formatDate(product?.updatedAt)}</span>
              </div>
              {product?.archivedAt && (
                <div className={styles.timestampItem}>
                  <FontAwesomeIcon icon={faArchive} />
                  <span>Archived: {formatDate(product.archivedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div
            className={styles.confirmOverlay}
            onClick={() => setConfirmAction(null)}
          >
            <div
              className={styles.confirmModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmIcon}>
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <h4 className={styles.confirmTitle}>
                {confirmAction.type === "deleteVariant" && "Delete Variant"}
                {confirmAction.type === "deleteSize" && "Delete Size"}
                {confirmAction.type === "archiveVariant" &&
                  (confirmAction.isArchived
                    ? "Unarchive Variant"
                    : "Archive Variant")}
              </h4>
              <p className={styles.confirmMessage}>
                {confirmAction.type === "deleteVariant" &&
                  `Are you sure you want to delete the "${confirmAction.colorName}" variant? This will remove all sizes and images for this color.`}
                {confirmAction.type === "deleteSize" &&
                  `Are you sure you want to delete size "${confirmAction.sizeName}" from "${confirmAction.colorName}" variant?`}
                {confirmAction.type === "archiveVariant" &&
                  (confirmAction.isArchived
                    ? `Unarchive "${confirmAction.colorName}" variant? It will be visible again.`
                    : `Archive "${confirmAction.colorName}" variant? It will be hidden from your store.`)}
              </p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.confirmCancel}
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.confirmBtn} ${
                    confirmAction.type.includes("delete")
                      ? styles.confirmDanger
                      : styles.confirmWarning
                  }`}
                  onClick={() => {
                    if (confirmAction.type === "deleteVariant") {
                      handleDeleteVariant(confirmAction.variantId);
                    } else if (confirmAction.type === "deleteSize") {
                      handleDeleteSize(
                        confirmAction.variantId,
                        confirmAction.sizeId
                      );
                    } else if (confirmAction.type === "archiveVariant") {
                      handleArchiveVariant(
                        confirmAction.variantId,
                        confirmAction.isArchived
                      );
                    }
                  }}
                >
                  {confirmAction.type === "deleteVariant" && "Delete Variant"}
                  {confirmAction.type === "deleteSize" && "Delete Size"}
                  {confirmAction.type === "archiveVariant" &&
                    (confirmAction.isArchived ? "Unarchive" : "Archive")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsModal;
