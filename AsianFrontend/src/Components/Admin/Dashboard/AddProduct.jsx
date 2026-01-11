// Components/Admin/Dashboard/AddProduct.jsx
import React, { useState, useEffect, useRef } from "react";
import styles from "../../../Styles/Admin/AddProduct.module.css";
import api from "../../../services/axiosConfig";
import { toast } from "react-toastify";
import {
  FiBox,
  FiArrowLeft,
  FiSave,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiX,
  FiEdit,
  FiLink,
  FiCheck,
  FiImage,
  FiTag,
  FiTrendingUp,
  FiStar,
  FiAward,
  FiZap,
} from "react-icons/fi";

const AddProduct = ({ setActiveMenu, selectedProductId }) => {
  const isEditMode = !!selectedProductId;

  // Available tags configuration
  const availableTags = [
    {
      value: "new-arrival",
      label: "New Arrival",
      icon: FiZap,
      color: "#10b981",
      bgColor: "#d1fae5",
    },
    {
      value: "best-seller",
      label: "Best Seller",
      icon: FiAward,
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
    {
      value: "featured",
      label: "Featured",
      icon: FiStar,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
    },
    {
      value: "trending",
      label: "Trending",
      icon: FiTrendingUp,
      color: "#ef4444",
      bgColor: "#fee2e2",
    },
  ];

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    category: "",
    subCategory: "",
    gender: "",
    mrp: "",
    sellingPrice: "",
    discount: 0,
    specifications: {
      upperMaterial: "",
      soleMaterial: "",
      insole: "",
      closure: "",
    },
    variants: [],
    seller: "",
    tags: [], // NEW: Add tags to formData
  });

  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Image URL input states for each variant
  const [imageUrlInputs, setImageUrlInputs] = useState({});
  const [bulkImageInputs, setBulkImageInputs] = useState({});
  const [editingImageIndex, setEditingImageIndex] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchSellers();
    if (isEditMode) {
      fetchProductData();
    }
  }, [selectedProductId]);

  useEffect(() => {
    // Auto-generate slug from title
    if (formData.title && !isEditMode) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, isEditMode]);

  useEffect(() => {
    // Auto-calculate discount
    if (formData.mrp && formData.sellingPrice) {
      const mrp = parseFloat(formData.mrp);
      const selling = parseFloat(formData.sellingPrice);
      if (mrp > 0 && selling > 0) {
        const discount = Math.round(((mrp - selling) / mrp) * 100);
        setFormData((prev) => ({ ...prev, discount: Math.max(0, discount) }));
      }
    }
  }, [formData.mrp, formData.sellingPrice]);

  // ==================== API CALLS ====================

  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/categories");
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await api.get("/admin/sellers");
      if (response.data.success) {
        setSellers(response.data.sellers);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Failed to load sellers");
    }
  };

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/admin/products/${selectedProductId}`);

      if (response.data.success) {
        const product = response.data.product;
        setFormData({
          title: product.title || "",
          slug: product.slug || "",
          description: product.description || "",
          category: product.category || "",
          subCategory: product.subCategory || "",
          gender: product.gender || "",
          mrp: product.mrp || "",
          sellingPrice: product.sellingPrice || "",
          discount: product.discount || 0,
          specifications: product.specifications || {
            upperMaterial: "",
            soleMaterial: "",
            insole: "",
            closure: "",
          },
          variants: product.variants || [],
          seller: product.seller?._id || "",
          tags: product.tags || [], // NEW: Load tags
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product data");
      setActiveMenu("view-products");
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== TAG HANDLERS ====================

  const handleTagToggle = (tagValue) => {
    setFormData((prev) => {
      const currentTags = prev.tags || [];
      const isSelected = currentTags.includes(tagValue);

      if (isSelected) {
        // Remove tag
        return {
          ...prev,
          tags: currentTags.filter((t) => t !== tagValue),
        };
      } else {
        // Add tag
        return {
          ...prev,
          tags: [...currentTags, tagValue],
        };
      }
    });
  };

  const handleRemoveTag = (tagValue) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagValue),
    }));
  };

  const handleClearAllTags = () => {
    setFormData((prev) => ({
      ...prev,
      tags: [],
    }));
  };

  // ==================== VALIDATION ====================

  // Improved URL validation function
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;

    const trimmedUrl = url.trim();

    // Check if it starts with http:// or https://
    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://")
    ) {
      return false;
    }

    // Basic URL structure check (more permissive)
    try {
      new URL(trimmedUrl);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.slug.trim()) {
      errors.slug = "Slug is required";
    }

    if (!formData.category) {
      errors.category = "Category is required";
    }

    if (!formData.mrp || formData.mrp <= 0) {
      errors.mrp = "Valid MRP is required";
    }

    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      errors.sellingPrice = "Valid selling price is required";
    }

    if (parseFloat(formData.sellingPrice) > parseFloat(formData.mrp)) {
      errors.sellingPrice = "Selling price cannot be greater than MRP";
    }

    if (!formData.seller) {
      errors.seller = "Seller is required";
    }

    if (formData.variants.length === 0) {
      errors.variants = "At least one variant is required";
    }

    // Tags validation (optional - just check for valid values)
    if (formData.tags && formData.tags.length > 0) {
      const validTagValues = availableTags.map((t) => t.value);
      const invalidTags = formData.tags.filter(
        (tag) => !validTagValues.includes(tag)
      );
      if (invalidTags.length > 0) {
        errors.tags = `Invalid tags: ${invalidTags.join(", ")}`;
      }
    }

    formData.variants.forEach((variant, vIndex) => {
      if (!variant.colorName) {
        errors[`variant_${vIndex}_colorName`] = "Color name is required";
      }
      if (!variant.hexCode) {
        errors[`variant_${vIndex}_hexCode`] = "Color code is required";
      }
      if (variant.images.length === 0) {
        errors[`variant_${vIndex}_images`] = "At least one image is required";
      }
      if (variant.sizes.length === 0) {
        errors[`variant_${vIndex}_sizes`] = "At least one size is required";
      }

      variant.sizes.forEach((size, sIndex) => {
        if (!size.size) {
          errors[`variant_${vIndex}_size_${sIndex}_size`] = "Size is required";
        }
        if (!size.sku) {
          errors[`variant_${vIndex}_size_${sIndex}_sku`] = "SKU is required";
        }
        if (size.stock < 0) {
          errors[`variant_${vIndex}_size_${sIndex}_stock`] =
            "Stock cannot be negative";
        }
      });
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== INPUT HANDLERS ====================

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: "" });
    }
  };

  const handleSpecificationChange = (field, value) => {
    setFormData({
      ...formData,
      specifications: { ...formData.specifications, [field]: value },
    });
  };

  // ==================== VARIANT HANDLERS ====================

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          colorName: "",
          hexCode: "#000000",
          images: [],
          sizes: [],
        },
      ],
    });
  };

  const handleRemoveVariant = (index) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });

    // Clear related errors
    const newErrors = { ...formErrors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(`variant_${index}_`)) {
        delete newErrors[key];
      }
    });
    setFormErrors(newErrors);

    // Clear image input states
    const newImageUrlInputs = { ...imageUrlInputs };
    delete newImageUrlInputs[index];
    setImageUrlInputs(newImageUrlInputs);

    const newBulkImageInputs = { ...bulkImageInputs };
    delete newBulkImageInputs[index];
    setBulkImageInputs(newBulkImageInputs);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });

    const errorKey = `variant_${index}_${field}`;
    if (formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }
  };

  // ==================== IMAGE HANDLERS (URL-BASED - INLINE INPUTS) ====================

  // Handle single image URL input change
  const handleImageUrlInputChange = (variantIndex, value) => {
    setImageUrlInputs({
      ...imageUrlInputs,
      [variantIndex]: value,
    });
  };

  // Add single image URL
  const handleAddImageUrl = (variantIndex) => {
    const imageUrl = imageUrlInputs[variantIndex]?.trim();

    if (!imageUrl) {
      toast.error("Please enter an image URL");
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    // Check max images
    const currentImages = formData.variants[variantIndex].images.length;
    const maxImagesPerVariant = 10;
    if (currentImages >= maxImagesPerVariant) {
      toast.error(`Maximum ${maxImagesPerVariant} images per variant allowed`);
      return;
    }

    // Check for duplicate
    if (formData.variants[variantIndex].images.includes(imageUrl)) {
      toast.error("This image URL already exists");
      return;
    }

    const newVariants = [...formData.variants];
    newVariants[variantIndex].images = [
      ...newVariants[variantIndex].images,
      imageUrl,
    ];
    setFormData({ ...formData, variants: newVariants });

    // Clear input
    setImageUrlInputs({
      ...imageUrlInputs,
      [variantIndex]: "",
    });

    toast.success("Image URL added successfully", { autoClose: 1500 });

    // Clear error
    const errorKey = `variant_${variantIndex}_images`;
    if (formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }
  };

  // Handle bulk image URLs input change
  const handleBulkImageInputChange = (variantIndex, value) => {
    setBulkImageInputs({
      ...bulkImageInputs,
      [variantIndex]: value,
    });
  };

  // Bulk add multiple image URLs
  const handleBulkAddImages = (variantIndex) => {
    const urlsText = bulkImageInputs[variantIndex]?.trim();

    if (!urlsText) {
      toast.error("Please enter image URLs");
      return;
    }

    const urls = urlsText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      toast.error("No URLs found");
      return;
    }

    // Check max images
    const currentImages = formData.variants[variantIndex].images.length;
    const maxImagesPerVariant = 10;
    const availableSlots = maxImagesPerVariant - currentImages;

    if (availableSlots <= 0) {
      toast.error(`Maximum ${maxImagesPerVariant} images already added`);
      return;
    }

    // Validate URLs
    const validUrls = urls.filter((url) => isValidImageUrl(url));

    if (validUrls.length === 0) {
      toast.error(
        "No valid image URLs found. URLs must start with http:// or https://"
      );
      return;
    }

    // Remove duplicates
    const existingImages = formData.variants[variantIndex].images;
    const uniqueNewUrls = validUrls.filter(
      (url) => !existingImages.includes(url)
    );

    if (uniqueNewUrls.length === 0) {
      toast.error("All URLs already exist");
      return;
    }

    const urlsToAdd = uniqueNewUrls.slice(0, availableSlots);

    if (urlsToAdd.length < uniqueNewUrls.length) {
      toast.warning(
        `Only ${availableSlots} slots available. Added ${urlsToAdd.length} of ${uniqueNewUrls.length} images.`,
        { autoClose: 3000 }
      );
    }

    const newVariants = [...formData.variants];
    newVariants[variantIndex].images = [
      ...newVariants[variantIndex].images,
      ...urlsToAdd,
    ];
    setFormData({ ...formData, variants: newVariants });

    // Clear input
    setBulkImageInputs({
      ...bulkImageInputs,
      [variantIndex]: "",
    });

    toast.success(`Added ${urlsToAdd.length} image URL(s)`, {
      autoClose: 1500,
    });

    // Clear error
    const errorKey = `variant_${variantIndex}_images`;
    if (formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }
  };

  // Start editing image URL
  const handleStartEditImage = (variantIndex, imageIndex) => {
    setEditingImageIndex({
      ...editingImageIndex,
      [`${variantIndex}_${imageIndex}`]:
        formData.variants[variantIndex].images[imageIndex],
    });
  };

  // Handle edit image URL change
  const handleEditImageUrlChange = (variantIndex, imageIndex, value) => {
    setEditingImageIndex({
      ...editingImageIndex,
      [`${variantIndex}_${imageIndex}`]: value,
    });
  };

  // Save edited image URL
  const handleSaveEditImage = (variantIndex, imageIndex) => {
    const key = `${variantIndex}_${imageIndex}`;
    const newUrl = editingImageIndex[key]?.trim();

    if (!newUrl) {
      toast.error("Please enter an image URL");
      return;
    }

    if (!isValidImageUrl(newUrl)) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    const newVariants = [...formData.variants];
    newVariants[variantIndex].images[imageIndex] = newUrl;
    setFormData({ ...formData, variants: newVariants });

    // Clear editing state
    const newEditingState = { ...editingImageIndex };
    delete newEditingState[key];
    setEditingImageIndex(newEditingState);

    toast.success("Image URL updated", { autoClose: 1500 });
  };

  // Cancel editing
  const handleCancelEditImage = (variantIndex, imageIndex) => {
    const key = `${variantIndex}_${imageIndex}`;
    const newEditingState = { ...editingImageIndex };
    delete newEditingState[key];
    setEditingImageIndex(newEditingState);
  };

  // Check if editing specific image
  const isEditingImage = (variantIndex, imageIndex) => {
    return editingImageIndex.hasOwnProperty(`${variantIndex}_${imageIndex}`);
  };

  // Remove image
  const handleRemoveImage = (variantIndex, imageIndex) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].images = newVariants[variantIndex].images.filter(
      (_, i) => i !== imageIndex
    );
    setFormData({ ...formData, variants: newVariants });

    toast.success("Image removed", { autoClose: 1500 });
  };

  // ==================== SIZE HANDLERS ====================

  const handleAddSize = (variantIndex) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].sizes.push({
      size: "",
      sku: "",
      stock: 0,
      priceOverride: null,
    });
    setFormData({ ...formData, variants: newVariants });
  };

  const handleRemoveSize = (variantIndex, sizeIndex) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter(
      (_, i) => i !== sizeIndex
    );
    setFormData({ ...formData, variants: newVariants });

    // Clear related errors
    const newErrors = { ...formErrors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(`variant_${variantIndex}_size_${sizeIndex}_`)) {
        delete newErrors[key];
      }
    });
    setFormErrors(newErrors);
  };

  const handleSizeChange = (variantIndex, sizeIndex, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[variantIndex].sizes[sizeIndex] = {
      ...newVariants[variantIndex].sizes[sizeIndex],
      [field]: value,
    };
    setFormData({ ...formData, variants: newVariants });

    const errorKey = `variant_${variantIndex}_size_${sizeIndex}_${field}`;
    if (formErrors[errorKey]) {
      const newErrors = { ...formErrors };
      delete newErrors[errorKey];
      setFormErrors(newErrors);
    }
  };

  // Auto-generate SKU
  const generateSKU = (variantIndex, sizeIndex) => {
    const variant = formData.variants[variantIndex];
    const size = variant.sizes[sizeIndex];
    const titleSlug =
      formData.title
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "") || "PRD";
    const colorSlug =
      variant.colorName
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "") || "CLR";
    const sizeStr = size.size || "XX";
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    const sku = `${titleSlug}-${colorSlug}-${sizeStr}-${random}`;

    handleSizeChange(variantIndex, sizeIndex, "sku", sku);
    toast.success("SKU generated", { autoClose: 1500 });
  };

  // ==================== FORM SUBMIT ====================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        ...formData,
        mrp: parseFloat(formData.mrp),
        sellingPrice: parseFloat(formData.sellingPrice),
        discount: parseFloat(formData.discount),
        tags: formData.tags || [], // NEW: Include tags
        variants: formData.variants.map((variant) => ({
          ...variant,
          sizes: variant.sizes.map((size) => ({
            ...size,
            stock: parseInt(size.stock),
            priceOverride: size.priceOverride
              ? parseFloat(size.priceOverride)
              : null,
          })),
        })),
      };

      let response;

      if (isEditMode) {
        // Update existing product
        response = await api.put(
          `/admin/products/${selectedProductId}`,
          productData
        );
      } else {
        // Create new product
        response = await api.post("/admin/products", productData);
      }

      if (response.data.success) {
        toast.success(
          `Product ${isEditMode ? "updated" : "created"} successfully!`,
          { autoClose: 2000 }
        );
        setTimeout(() => {
          setActiveMenu("view-products");
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving product:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to perform this action.");
      } else {
        toast.error(error.response?.data?.message || "Failed to save product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      formData.title ||
      formData.variants.length > 0 ||
      formData.mrp ||
      formData.sellingPrice ||
      formData.tags.length > 0;

    if (hasChanges && !isEditMode) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        )
      ) {
        return;
      }
    }

    setActiveMenu("view-products");
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Loading product data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleCancel}>
          <FiArrowLeft size={20} />
          <span>Back to Products</span>
        </button>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <FiBox size={24} />
          </div>
          <div>
            <h1 className={styles.title}>
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h1>
            <p className={styles.subtitle}>
              {isEditMode
                ? "Update product information"
                : "Create a new product listing"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.formCard}>
          {/* Basic Information */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>
                  Product Title <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`${styles.formInput} ${
                    formErrors.title ? styles.inputError : ""
                  }`}
                  placeholder="Enter product title"
                />
                {formErrors.title && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.title}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Slug <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  className={`${styles.formInput} ${
                    formErrors.slug ? styles.inputError : ""
                  }`}
                  placeholder="product-slug"
                />
                {formErrors.slug && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.slug}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Category <span className={styles.required}>*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  className={`${styles.formSelect} ${
                    formErrors.category ? styles.inputError : ""
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.category}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sub Category</label>
                <input
                  type="text"
                  value={formData.subCategory}
                  onChange={(e) =>
                    handleInputChange("subCategory", e.target.value)
                  }
                  className={styles.formInput}
                  placeholder="Enter sub category"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="">Select Gender</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Seller <span className={styles.required}>*</span>
                </label>
                <select
                  name="seller"
                  value={formData.seller}
                  onChange={(e) => handleInputChange("seller", e.target.value)}
                  className={`${styles.formSelect} ${
                    formErrors.seller ? styles.inputError : ""
                  }`}
                  disabled={isEditMode}
                >
                  <option value="">Select Seller</option>
                  {sellers.map((seller) => (
                    <option key={seller._id} value={seller._id}>
                      {seller.name} - {seller.brandName}
                    </option>
                  ))}
                </select>
                {formErrors.seller && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.seller}
                  </span>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className={styles.formTextarea}
                  placeholder="Enter product description"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* NEW: Product Tags Section */}
          <div className={styles.divider}></div>
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <FiTag size={18} style={{ marginRight: "8px" }} />
                Product Tags
              </h3>
              {formData.tags.length > 0 && (
                <button
                  type="button"
                  className={styles.clearTagsBtn}
                  onClick={handleClearAllTags}
                >
                  <FiX size={14} />
                  Clear All
                </button>
              )}
            </div>

            <p className={styles.sectionDescription}>
              Add tags to help categorize and highlight your product. Tags help
              customers discover products easily.
            </p>

            {/* Tag Selection Grid */}
            <div className={styles.tagsGrid}>
              {availableTags.map((tag) => {
                const isSelected = formData.tags.includes(tag.value);
                const TagIcon = tag.icon;

                return (
                  <button
                    key={tag.value}
                    type="button"
                    className={`${styles.tagOption} ${
                      isSelected ? styles.tagSelected : ""
                    }`}
                    onClick={() => handleTagToggle(tag.value)}
                    style={{
                      "--tag-color": tag.color,
                      "--tag-bg-color": tag.bgColor,
                    }}
                  >
                    <div className={styles.tagIconWrapper}>
                      <TagIcon size={18} />
                    </div>
                    <div className={styles.tagInfo}>
                      <span className={styles.tagLabel}>{tag.label}</span>
                      <span className={styles.tagDescription}>
                        {tag.value === "new-arrival" &&
                          "Mark as newly added product"}
                        {tag.value === "best-seller" &&
                          "Highlight top selling item"}
                        {tag.value === "featured" && "Feature on homepage"}
                        {tag.value === "trending" && "Show as trending product"}
                      </span>
                    </div>
                    <div className={styles.tagCheckbox}>
                      {isSelected ? (
                        <FiCheck size={16} />
                      ) : (
                        <div className={styles.emptyCheckbox}></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Tags Preview */}
            {formData.tags.length > 0 && (
              <div className={styles.selectedTagsPreview}>
                <span className={styles.selectedTagsLabel}>Selected Tags:</span>
                <div className={styles.selectedTagsList}>
                  {formData.tags.map((tagValue) => {
                    const tagInfo = availableTags.find(
                      (t) => t.value === tagValue
                    );
                    if (!tagInfo) return null;
                    const TagIcon = tagInfo.icon;

                    return (
                      <span
                        key={tagValue}
                        className={styles.selectedTagChip}
                        style={{
                          backgroundColor: tagInfo.bgColor,
                          color: tagInfo.color,
                          borderColor: tagInfo.color,
                        }}
                      >
                        <TagIcon size={12} />
                        {tagInfo.label}
                        <button
                          type="button"
                          className={styles.removeTagBtn}
                          onClick={() => handleRemoveTag(tagValue)}
                          style={{ color: tagInfo.color }}
                        >
                          <FiX size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {formErrors.tags && (
              <span className={styles.errorText}>
                <FiAlertCircle size={14} />
                {formErrors.tags}
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className={styles.divider}></div>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Pricing</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  MRP (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="mrp"
                  value={formData.mrp}
                  onChange={(e) => handleInputChange("mrp", e.target.value)}
                  className={`${styles.formInput} ${
                    formErrors.mrp ? styles.inputError : ""
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {formErrors.mrp && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.mrp}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Selling Price (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    handleInputChange("sellingPrice", e.target.value)
                  }
                  className={`${styles.formInput} ${
                    formErrors.sellingPrice ? styles.inputError : ""
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {formErrors.sellingPrice && (
                  <span className={styles.errorText}>
                    <FiAlertCircle size={14} />
                    {formErrors.sellingPrice}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Discount (%)</label>
                <input
                  type="number"
                  value={formData.discount}
                  className={`${styles.formInput} ${styles.disabled}`}
                  disabled
                />
                <span className={styles.helperText}>
                  Auto-calculated from MRP and Selling Price
                </span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className={styles.divider}></div>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Specifications (Optional)</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Upper Material</label>
                <input
                  type="text"
                  value={formData.specifications.upperMaterial}
                  onChange={(e) =>
                    handleSpecificationChange("upperMaterial", e.target.value)
                  }
                  className={styles.formInput}
                  placeholder="e.g., Leather, Canvas"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sole Material</label>
                <input
                  type="text"
                  value={formData.specifications.soleMaterial}
                  onChange={(e) =>
                    handleSpecificationChange("soleMaterial", e.target.value)
                  }
                  className={styles.formInput}
                  placeholder="e.g., Rubber, EVA"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Insole</label>
                <input
                  type="text"
                  value={formData.specifications.insole}
                  onChange={(e) =>
                    handleSpecificationChange("insole", e.target.value)
                  }
                  className={styles.formInput}
                  placeholder="e.g., Memory Foam"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Closure</label>
                <input
                  type="text"
                  value={formData.specifications.closure}
                  onChange={(e) =>
                    handleSpecificationChange("closure", e.target.value)
                  }
                  className={styles.formInput}
                  placeholder="e.g., Lace-up, Velcro"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className={styles.divider}></div>
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                Product Variants <span className={styles.required}>*</span>
              </h3>
              <button
                type="button"
                className={styles.addVariantBtn}
                onClick={handleAddVariant}
              >
                <FiPlus size={16} />
                Add Variant
              </button>
            </div>

            {formErrors.variants && (
              <span className={styles.errorText}>
                <FiAlertCircle size={14} />
                {formErrors.variants}
              </span>
            )}

            {formData.variants.length === 0 ? (
              <div className={styles.emptyVariants}>
                <FiBox size={32} />
                <p>No variants added yet</p>
                <button
                  type="button"
                  className={styles.addFirstVariantBtn}
                  onClick={handleAddVariant}
                >
                  <FiPlus size={16} />
                  Add First Variant
                </button>
              </div>
            ) : (
              <div className={styles.variantsList}>
                {formData.variants.map((variant, vIndex) => (
                  <div key={vIndex} className={styles.variantCard}>
                    <div className={styles.variantHeader}>
                      <div className={styles.variantTitle}>
                        <div
                          className={styles.colorDot}
                          style={{ backgroundColor: variant.hexCode }}
                        />
                        <h4>
                          Variant {vIndex + 1}
                          {variant.colorName && ` - ${variant.colorName}`}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className={styles.removeVariantBtn}
                        onClick={() => handleRemoveVariant(vIndex)}
                        title="Remove Variant"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>

                    <div className={styles.variantContent}>
                      {/* Color Information */}
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            Color Name{" "}
                            <span className={styles.required}>*</span>
                          </label>
                          <input
                            type="text"
                            value={variant.colorName}
                            onChange={(e) =>
                              handleVariantChange(
                                vIndex,
                                "colorName",
                                e.target.value
                              )
                            }
                            className={`${styles.formInput} ${
                              formErrors[`variant_${vIndex}_colorName`]
                                ? styles.inputError
                                : ""
                            }`}
                            placeholder="e.g., Black, White, Navy Blue"
                          />
                          {formErrors[`variant_${vIndex}_colorName`] && (
                            <span className={styles.errorText}>
                              <FiAlertCircle size={14} />
                              {formErrors[`variant_${vIndex}_colorName`]}
                            </span>
                          )}
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            Color Code{" "}
                            <span className={styles.required}>*</span>
                          </label>
                          <div className={styles.colorPickerWrapper}>
                            <input
                              type="color"
                              value={variant.hexCode}
                              onChange={(e) =>
                                handleVariantChange(
                                  vIndex,
                                  "hexCode",
                                  e.target.value
                                )
                              }
                              className={styles.colorPicker}
                            />
                            <input
                              type="text"
                              value={variant.hexCode}
                              onChange={(e) =>
                                handleVariantChange(
                                  vIndex,
                                  "hexCode",
                                  e.target.value
                                )
                              }
                              className={`${styles.formInput} ${
                                formErrors[`variant_${vIndex}_hexCode`]
                                  ? styles.inputError
                                  : ""
                              }`}
                              placeholder="#000000"
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            />
                          </div>
                          {formErrors[`variant_${vIndex}_hexCode`] && (
                            <span className={styles.errorText}>
                              <FiAlertCircle size={14} />
                              {formErrors[`variant_${vIndex}_hexCode`]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Images Section */}
                      <div className={styles.imageSection}>
                        <div className={styles.imageSectionHeader}>
                          <label className={styles.formLabel}>
                            <FiImage size={16} style={{ marginRight: "6px" }} />
                            Images <span className={styles.required}>*</span>
                            <span className={styles.helperTextInline}>
                              ({variant.images.length}/10 images)
                            </span>
                          </label>
                        </div>

                        {/* Single Image URL Input */}
                        <div className={styles.imageUrlInputWrapper}>
                          <div className={styles.imageUrlInputGroup}>
                            <FiLink size={16} className={styles.inputIcon} />
                            <input
                              type="url"
                              value={imageUrlInputs[vIndex] || ""}
                              onChange={(e) =>
                                handleImageUrlInputChange(
                                  vIndex,
                                  e.target.value
                                )
                              }
                              className={styles.imageUrlInput}
                              placeholder="Paste image URL here (e.g., https://example.com/image.jpg)"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddImageUrl(vIndex);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className={styles.addImageUrlBtn}
                              onClick={() => handleAddImageUrl(vIndex)}
                              disabled={
                                !imageUrlInputs[vIndex]?.trim() ||
                                variant.images.length >= 10
                              }
                            >
                              <FiPlus size={16} />
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Bulk Add Section */}
                        <div className={styles.bulkAddSection}>
                          <details className={styles.bulkAddDetails}>
                            <summary className={styles.bulkAddSummary}>
                              <FiPlus size={14} />
                              Bulk Add Multiple URLs
                            </summary>
                            <div className={styles.bulkAddContent}>
                              <textarea
                                value={bulkImageInputs[vIndex] || ""}
                                onChange={(e) =>
                                  handleBulkImageInputChange(
                                    vIndex,
                                    e.target.value
                                  )
                                }
                                className={styles.bulkImageTextarea}
                                placeholder="Paste multiple image URLs (one per line):&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                                rows={4}
                              />
                              <button
                                type="button"
                                className={styles.bulkAddBtn}
                                onClick={() => handleBulkAddImages(vIndex)}
                                disabled={
                                  !bulkImageInputs[vIndex]?.trim() ||
                                  variant.images.length >= 10
                                }
                              >
                                <FiPlus size={14} />
                                Add All URLs
                              </button>
                            </div>
                          </details>
                        </div>

                        {/* Image Grid */}
                        {variant.images.length > 0 && (
                          <div className={styles.imageGrid}>
                            {variant.images.map((imageUrl, imgIndex) => (
                              <div
                                key={imgIndex}
                                className={styles.imagePreviewCard}
                              >
                                {/* Image Preview */}
                                <div className={styles.imagePreview}>
                                  <img
                                    src={imageUrl}
                                    alt={`Variant ${vIndex + 1} - Image ${
                                      imgIndex + 1
                                    }`}
                                    onError={(e) => {
                                      e.target.src =
                                        "https://via.placeholder.com/150x150?text=Error";
                                      e.target.style.border =
                                        "2px solid #ef4444";
                                    }}
                                  />

                                  {/* Primary Badge */}
                                  {imgIndex === 0 && (
                                    <span className={styles.primaryBadge}>
                                      Primary
                                    </span>
                                  )}

                                  {/* Image Controls Overlay */}
                                  <div className={styles.imageControlsOverlay}>
                                    <button
                                      type="button"
                                      className={styles.editImageBtn}
                                      onClick={() =>
                                        handleStartEditImage(vIndex, imgIndex)
                                      }
                                      title="Edit URL"
                                    >
                                      <FiEdit size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.removeImageBtn}
                                      onClick={() =>
                                        handleRemoveImage(vIndex, imgIndex)
                                      }
                                      title="Remove Image"
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Edit Mode */}
                                {isEditingImage(vIndex, imgIndex) ? (
                                  <div className={styles.imageEditMode}>
                                    <input
                                      type="url"
                                      value={
                                        editingImageIndex[
                                          `${vIndex}_${imgIndex}`
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        handleEditImageUrlChange(
                                          vIndex,
                                          imgIndex,
                                          e.target.value
                                        )
                                      }
                                      className={styles.imageEditInput}
                                      placeholder="Enter new URL"
                                      autoFocus
                                    />
                                    <div className={styles.imageEditActions}>
                                      <button
                                        type="button"
                                        className={styles.saveEditBtn}
                                        onClick={() =>
                                          handleSaveEditImage(vIndex, imgIndex)
                                        }
                                        title="Save"
                                      >
                                        <FiCheck size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.cancelEditBtn}
                                        onClick={() =>
                                          handleCancelEditImage(
                                            vIndex,
                                            imgIndex
                                          )
                                        }
                                        title="Cancel"
                                      >
                                        <FiX size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className={styles.imageUrlDisplay}>
                                    <span title={imageUrl}>
                                      {imageUrl.length > 35
                                        ? `${imageUrl.substring(0, 35)}...`
                                        : imageUrl}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Error Message */}
                        {formErrors[`variant_${vIndex}_images`] && (
                          <span className={styles.errorText}>
                            <FiAlertCircle size={14} />
                            {formErrors[`variant_${vIndex}_images`]}
                          </span>
                        )}

                        {/* Helper Text */}
                        <div className={styles.imageHelperText}>
                          <span>
                            💡 <strong>Free Image Hosting:</strong>
                          </span>
                          <a
                            href="https://imgur.com/upload"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Imgur
                          </a>
                          <span>•</span>
                          <a
                            href="https://imgbb.com"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ImgBB
                          </a>
                          <span>•</span>
                          <a
                            href="https://postimages.org"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PostImages
                          </a>
                          <span>•</span>
                          <a
                            href="https://cloudinary.com"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Cloudinary
                          </a>
                        </div>
                      </div>

                      {/* Sizes Section */}
                      <div className={styles.sizesSection}>
                        <div className={styles.sizeHeader}>
                          <label className={styles.formLabel}>
                            Sizes <span className={styles.required}>*</span>
                          </label>
                          <button
                            type="button"
                            className={styles.addSizeBtn}
                            onClick={() => handleAddSize(vIndex)}
                          >
                            <FiPlus size={14} />
                            Add Size
                          </button>
                        </div>

                        {formErrors[`variant_${vIndex}_sizes`] && (
                          <span className={styles.errorText}>
                            <FiAlertCircle size={14} />
                            {formErrors[`variant_${vIndex}_sizes`]}
                          </span>
                        )}

                        {variant.sizes.length === 0 ? (
                          <div className={styles.emptySizes}>
                            <p>No sizes added. Click "Add Size" to start.</p>
                          </div>
                        ) : (
                          <div className={styles.sizesGrid}>
                            {variant.sizes.map((size, sIndex) => (
                              <div key={sIndex} className={styles.sizeCard}>
                                <button
                                  type="button"
                                  className={styles.removeSizeBtn}
                                  onClick={() =>
                                    handleRemoveSize(vIndex, sIndex)
                                  }
                                  title="Remove Size"
                                >
                                  <FiX size={14} />
                                </button>

                                <div className={styles.sizeField}>
                                  <label>Size *</label>
                                  <input
                                    type="text"
                                    value={size.size}
                                    onChange={(e) =>
                                      handleSizeChange(
                                        vIndex,
                                        sIndex,
                                        "size",
                                        e.target.value
                                      )
                                    }
                                    className={`${styles.formInput} ${
                                      formErrors[
                                        `variant_${vIndex}_size_${sIndex}_size`
                                      ]
                                        ? styles.inputError
                                        : ""
                                    }`}
                                    placeholder="e.g., 7, 8, 9, M, L"
                                  />
                                </div>

                                <div className={styles.sizeField}>
                                  <label>
                                    SKU *
                                    <button
                                      type="button"
                                      className={styles.generateSkuBtn}
                                      onClick={() =>
                                        generateSKU(vIndex, sIndex)
                                      }
                                      title="Auto-generate SKU"
                                    >
                                      Generate
                                    </button>
                                  </label>
                                  <input
                                    type="text"
                                    value={size.sku}
                                    onChange={(e) =>
                                      handleSizeChange(
                                        vIndex,
                                        sIndex,
                                        "sku",
                                        e.target.value
                                      )
                                    }
                                    className={`${styles.formInput} ${
                                      formErrors[
                                        `variant_${vIndex}_size_${sIndex}_sku`
                                      ]
                                        ? styles.inputError
                                        : ""
                                    }`}
                                    placeholder="SKU-001"
                                  />
                                </div>

                                <div className={styles.sizeField}>
                                  <label>Stock *</label>
                                  <input
                                    type="number"
                                    value={size.stock}
                                    onChange={(e) =>
                                      handleSizeChange(
                                        vIndex,
                                        sIndex,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                    className={`${styles.formInput} ${
                                      formErrors[
                                        `variant_${vIndex}_size_${sIndex}_stock`
                                      ]
                                        ? styles.inputError
                                        : ""
                                    }`}
                                    placeholder="0"
                                    min="0"
                                  />
                                </div>

                                <div className={styles.sizeField}>
                                  <label>Price Override (₹)</label>
                                  <input
                                    type="number"
                                    value={size.priceOverride || ""}
                                    onChange={(e) =>
                                      handleSizeChange(
                                        vIndex,
                                        sIndex,
                                        "priceOverride",
                                        e.target.value || null
                                      )
                                    }
                                    className={styles.formInput}
                                    placeholder="Optional"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                <span>{isEditMode ? "Update Product" : "Create Product"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
